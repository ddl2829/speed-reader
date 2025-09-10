/**
 * SpeedReaderAnalytics - Minimal Text Loading Analytics
 * 
 * Features:
 * - Tracks only the 3 text loading methods: paste, upload, library
 * - Sends unique events: text_loaded_paste, text_loaded_upload, text_loaded_library
 * - Google Analytics 4 integration with privacy controls
 * - No user behavior, performance, or personal data tracking
 * 
 * Privacy Design:
 * - Minimal data collection - only basic usage patterns
 * - Google Analytics only loads if explicitly configured
 * - IP anonymization enabled by default
 * - No personal information collected or stored
 */
class SpeedReaderAnalytics {
    /**
     * Initialize simplified analytics system focused on text loading methods
     * Only tracks: paste, upload, and library text loading methods
     */
    constructor() {
        this.sessionStartTime = Date.now();
        
        // Initialize Google Analytics if GA_MEASUREMENT_ID is set
        this.initializeGA();
    }

    /* ===== GOOGLE ANALYTICS INTEGRATION ===== */

    /**
     * Initialize Google Analytics 4 with privacy-friendly configuration
     * Only loads GA if GA_MEASUREMENT_ID is configured, otherwise uses console logging
     */
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

    /* ===== EVENT TRACKING CORE ===== */

    /* ===== TEXT LOADING TRACKING ===== */

    /**
     * Track text loading methods - sends unique event for each method
     * @param {string} method - The method used: 'paste', 'upload', or 'library'
     */
    trackTextLoad(method) {
        // Validate that only the 3 allowed methods are tracked
        if (!['paste', 'upload', 'library'].includes(method)) {
            return;
        }

        // Create unique event name for each method
        const eventName = `text_loaded_${method}`;

        // Log to console for development
        console.log('Analytics:', eventName);
        
        // Send to Google Analytics if initialized
        if (this.gaInitialized && window.gtag) {
            window.gtag('event', eventName);
        }
    }
}

// Initialize analytics when the script loads
window.speedReaderAnalytics = new SpeedReaderAnalytics();