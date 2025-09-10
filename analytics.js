// Analytics tracking for Speed Reader
class SpeedReaderAnalytics {
    constructor() {
        this.sessionStartTime = Date.now();
        this.readingStats = {
            totalWordsRead: 0,
            totalTimeReading: 0,
            averageWPM: 0,
            sessionsCount: 0,
            wpmHistory: []
        };
        this.currentSession = {
            startTime: Date.now(),
            textLoadMethod: null,
            wordsRead: 0,
            timeSpentReading: 0,
            maxWPM: 0,
            minWPM: Infinity,
            wpmChanges: 0
        };
        
        // Load existing stats from localStorage
        this.loadStoredStats();
        
        // Initialize Google Analytics if GA_MEASUREMENT_ID is set
        this.initializeGA();
        
        // Track session start
        this.trackSessionStart();
        
        // Set up page unload tracking
        this.setupUnloadTracking();
    }

    initializeGA() {
        // Check if GA_MEASUREMENT_ID is defined (you'll need to set this)
        if (typeof GA_MEASUREMENT_ID !== 'undefined' && GA_MEASUREMENT_ID) {
            // Load Google Analytics script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            document.head.appendChild(script);
            
            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', GA_MEASUREMENT_ID, {
                // Privacy-friendly settings from config
                anonymize_ip: ANALYTICS_CONFIG.privacy.anonymizeIP,
                allow_google_signals: ANALYTICS_CONFIG.privacy.allowGoogleSignals,
                allow_ad_personalization_signals: ANALYTICS_CONFIG.privacy.allowAdPersonalization
            });
            
            // Make gtag globally available
            window.gtag = gtag;
            this.gaInitialized = true;
        } else {
            console.log('Analytics: GA_MEASUREMENT_ID not set, using console logging only');
            this.gaInitialized = false;
        }
    }

    // Track custom events
    trackEvent(eventName, parameters = {}) {
        const eventData = {
            event_name: eventName,
            timestamp: Date.now(),
            ...parameters
        };
        
        // Log to console for development
        console.log('Analytics Event:', eventData);
        
        // Send to Google Analytics if initialized
        if (this.gaInitialized && window.gtag) {
            window.gtag('event', eventName, parameters);
        }
        
        // Store locally for backup/analysis
        this.storeEventLocally(eventData);
    }

    storeEventLocally(eventData) {
        // Only store if enabled in config
        if (!ANALYTICS_CONFIG.enableLocalStorage) {
            return;
        }
        
        const events = JSON.parse(localStorage.getItem('speedreader_analytics_events') || '[]');
        events.push(eventData);
        
        // Keep only configured max events to avoid storage bloat
        const maxEvents = ANALYTICS_CONFIG.maxLocalEvents;
        if (events.length > maxEvents) {
            events.splice(0, events.length - maxEvents);
        }
        
        localStorage.setItem('speedreader_analytics_events', JSON.stringify(events));
    }

    loadStoredStats() {
        const stored = localStorage.getItem('speedreader_analytics_stats');
        if (stored) {
            this.readingStats = { ...this.readingStats, ...JSON.parse(stored) };
        }
    }

    saveStats() {
        localStorage.setItem('speedreader_analytics_stats', JSON.stringify(this.readingStats));
    }

    // Session tracking
    trackSessionStart() {
        this.readingStats.sessionsCount++;
        this.trackEvent('session_start', {
            session_count: this.readingStats.sessionsCount,
            returning_user: this.readingStats.sessionsCount > 1
        });
    }

    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        this.trackEvent('session_end', {
            session_duration_ms: sessionDuration,
            session_duration_minutes: Math.round(sessionDuration / 60000),
            words_read_in_session: this.currentSession.wordsRead,
            time_spent_reading_ms: this.currentSession.timeSpentReading,
            text_load_method: this.currentSession.textLoadMethod,
            max_wpm_in_session: this.currentSession.maxWPM > 0 ? this.currentSession.maxWPM : null,
            min_wpm_in_session: this.currentSession.minWPM < Infinity ? this.currentSession.minWPM : null,
            wpm_changes: this.currentSession.wpmChanges
        });
    }

    // Text loading method tracking
    trackTextLoad(method, metadata = {}) {
        this.currentSession.textLoadMethod = method;
        
        this.trackEvent('text_loaded', {
            load_method: method,
            word_count: metadata.wordCount || 0,
            text_source: metadata.source || 'unknown',
            text_title: metadata.title || null,
            ...metadata
        });
    }

    // Reading session tracking
    trackReadingStart(wpm) {
        this.readingSessionStartTime = Date.now();
        this.trackEvent('reading_start', {
            initial_wpm: wpm,
            text_load_method: this.currentSession.textLoadMethod
        });
    }

    trackReadingPause(currentIndex, totalWords, wpm) {
        if (this.readingSessionStartTime) {
            const sessionTime = Date.now() - this.readingSessionStartTime;
            this.currentSession.timeSpentReading += sessionTime;
            
            this.trackEvent('reading_pause', {
                words_read_in_segment: Math.max(0, currentIndex),
                total_words: totalWords,
                progress_percentage: totalWords > 0 ? Math.round((currentIndex / totalWords) * 100) : 0,
                segment_duration_ms: sessionTime,
                current_wpm: wpm
            });
        }
    }

    trackReadingComplete(totalWords, totalTime, averageWPM) {
        this.currentSession.wordsRead += totalWords;
        this.readingStats.totalWordsRead += totalWords;
        this.readingStats.totalTimeReading += totalTime;
        
        // Update WPM stats
        this.readingStats.wpmHistory.push(averageWPM);
        this.readingStats.averageWPM = this.readingStats.wpmHistory.reduce((a, b) => a + b, 0) / this.readingStats.wpmHistory.length;
        
        this.trackEvent('reading_complete', {
            total_words: totalWords,
            total_time_ms: totalTime,
            average_wpm: averageWPM,
            text_load_method: this.currentSession.textLoadMethod,
            completion_rate: 100
        });
        
        this.saveStats();
    }

    // WPM tracking
    trackWPMChange(oldWPM, newWPM, method = 'manual') {
        this.currentSession.wpmChanges++;
        this.currentSession.maxWPM = Math.max(this.currentSession.maxWPM, newWPM);
        this.currentSession.minWPM = Math.min(this.currentSession.minWPM, newWPM);
        
        this.trackEvent('wpm_changed', {
            old_wpm: oldWPM,
            new_wpm: newWPM,
            change_method: method, // 'manual', 'keyboard', 'practice_mode'
            change_amount: newWPM - oldWPM
        });
    }

    // Feature usage tracking
    trackFeatureUse(feature, metadata = {}) {
        this.trackEvent('feature_used', {
            feature_name: feature,
            ...metadata
        });
    }

    // Tab switching tracking
    trackTabSwitch(fromTab, toTab) {
        this.trackEvent('tab_switched', {
            from_tab: fromTab,
            to_tab: toTab
        });
    }

    // Settings changes
    trackSettingsChange(setting, oldValue, newValue) {
        this.trackEvent('settings_changed', {
            setting_name: setting,
            old_value: oldValue,
            new_value: newValue
        });
    }

    // Error tracking
    trackError(errorType, errorMessage, context = {}) {
        this.trackEvent('error_occurred', {
            error_type: errorType,
            error_message: errorMessage,
            ...context
        });
    }

    // Setup automatic session end tracking
    setupUnloadTracking() {
        // Track when user leaves the page
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
            
            // Try to send any pending analytics
            if (this.gaInitialized && navigator.sendBeacon) {
                // sendBeacon is more reliable for page unload
                const data = new FormData();
                data.append('session_end', 'true');
                navigator.sendBeacon('/analytics-beacon', data);
            }
        });

        // Track visibility changes (tab switching, minimizing)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });

        // Track activity based on configured heartbeat interval
        setInterval(() => {
            this.trackEvent('heartbeat', {
                session_duration_minutes: Math.round((Date.now() - this.sessionStartTime) / 60000),
                total_words_read: this.currentSession.wordsRead
            });
        }, ANALYTICS_CONFIG.heartbeatInterval * 60 * 1000);
    }

    // Get analytics summary for debugging/display
    getAnalyticsSummary() {
        return {
            session: {
                startTime: this.sessionStartTime,
                currentDuration: Date.now() - this.sessionStartTime,
                textLoadMethod: this.currentSession.textLoadMethod,
                wordsRead: this.currentSession.wordsRead
            },
            lifetime: this.readingStats,
            gaInitialized: this.gaInitialized
        };
    }
}

// Initialize analytics when the script loads
window.speedReaderAnalytics = new SpeedReaderAnalytics();