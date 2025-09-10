/**
 * SpeedReader - RSVP Speed Reading Application (Modular Version)
 * 
 * Main application orchestrator that coordinates between specialized modules:
 * - TextProcessor: Text loading and processing
 * - PlaybackController: RSVP playback logic
 * - UIController: Display and interface management
 * - SettingsManager: Themes and settings
 * - LibraryManager: Project Gutenberg integration
 * - StorageManager: Data persistence
 * 
 * Architecture:
 * - Modular design with clear separation of concerns
 * - Event-driven communication between modules
 * - Centralized coordination and state management
 */
class SpeedReader {
    /**
     * Initialize the SpeedReader application with modular architecture
     */
    constructor() {
        // Initialize analytics reference
        this.analytics = window.speedReaderAnalytics;
        
        // Initialize all modules
        this.initializeModules();
        
        // Setup inter-module communication
        this.setupModuleCommunication();
        
        // Setup event listeners
        this.attachEventListeners();
        
        // Load initial state
        this.initialize();
    }

    /**
     * Initialize all application modules
     */
    initializeModules() {
        // Core modules
        this.textProcessor = new TextProcessor(this.analytics);
        this.playbackController = new PlaybackController();
        this.uiController = new UIController();
        this.settingsManager = new SettingsManager();
        this.storageManager = new StorageManager();
        this.libraryManager = new LibraryManager(this.textProcessor);
        
        // Initialize DOM elements that modules might need
        this.initializeElements();
    }

    /**
     * Initialize DOM element references not handled by modules
     */
    initializeElements() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.loadTextBtn = document.getElementById('loadTextBtn');
        this.pdfInput = document.getElementById('pdfInput');
        
        // Settings modal
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        
        // Practice mode
        this.practiceOptions = document.getElementById('practiceOptions');
        this.startSpeedInput = document.getElementById('startSpeed');
        this.rampRateInput = document.getElementById('rampRate');
        
        // Control elements
        this.speedSlider = document.getElementById('speedSlider');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    /**
     * Setup communication between modules
     */
    setupModuleCommunication() {
        // PlaybackController callbacks
        this.playbackController.onWordChange = (word, index) => {
            this.uiController.displayWord(word, index);
        };
        
        this.playbackController.onProgressUpdate = (currentIndex, totalWords) => {
            this.uiController.updateProgress(currentIndex, totalWords, this.playbackController.currentWPM);
            // Save position when progress updates
            this.savePosition();
        };
        
        this.playbackController.onPlayStateChange = (isPlaying) => {
            this.uiController.updatePlayButton(isPlaying);
        };
        
        this.playbackController.onSpeedChange = (wpm) => {
            this.uiController.updateSpeedDisplay(wpm);
        };
        
        this.playbackController.onStop = () => {
            this.savePosition();
        };
        
        // UIController callbacks
        this.uiController.onWordClick = (index, word) => {
            this.playbackController.setPosition(index);
            this.uiController.updateProgress(index, this.playbackController.words.length, this.playbackController.currentWPM);
            this.uiController.highlightCurrentWord();
        };
        
        // SettingsManager callbacks
        this.settingsManager.onSettingsChange = (settings) => {
            this.uiController.setHighlightCenter(settings.highlightCenter);
            this.playbackController.pauseOnPunctuation = settings.pauseOnPunctuation;
        };
        
        // LibraryManager callbacks
        this.libraryManager.onBookLoad = (processedData, title) => {
            this.loadProcessedText(processedData);
            this.storageManager.saveToHistory('gutenberg', title);
        };
    }

    /**
     * Load processed text data into the application
     * @param {Object} processedData - Processed text from TextProcessor
     */
    loadProcessedText(processedData) {
        // Set data in playback controller
        this.playbackController.setWords(processedData.words);
        
        // Set data in UI controller
        this.uiController.setTextData(processedData.words, processedData.originalText);
        
        // Update display
        this.uiController.updateProgress(0, processedData.words.length, this.playbackController.currentWPM);
        if (processedData.words.length > 0) {
            this.uiController.displayWord(processedData.words[0], 0);
        } else {
            this.uiController.displayWelcome();
        }
        
        // Switch to reader tab
        this.uiController.switchMainTab('reader');
        
        // Show in sidebar if open
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        if (sidebarToggleBtn && document.getElementById('textSidebar')?.classList.contains('open')) {
            this.uiController.displayFullText();
        }
        
        // Save position
        this.savePosition();
    }

    /**
     * Initialize application after modules are set up
     */
    initialize() {
        // Load settings
        this.settingsManager.loadSettings();
        
        // Initialize color pickers
        this.settingsManager.initializeColorPickers();
        
        // Setup library event listeners
        this.libraryManager.setupEventListeners();
        
        // Load saved position if exists
        this.loadPosition();
    }

    /**
     * Attach event listeners for main application functionality
     */
    attachEventListeners() {
        // Main tabs
        document.querySelectorAll('[data-tab-group="main"] [role="tab"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.uiController.switchMainTab(tabName);
            });
        });
        
        // Playback controls
        this.playPauseBtn?.addEventListener('click', () => this.playbackController.togglePlayPause());
        this.prevBtn?.addEventListener('click', () => this.playbackController.previousWord());
        this.nextBtn?.addEventListener('click', () => this.playbackController.nextWord());
        this.resetBtn?.addEventListener('click', () => this.playbackController.reset());
        
        // Speed control
        this.speedSlider?.addEventListener('input', (e) => {
            const newWPM = parseInt(e.target.value);
            this.playbackController.setSpeed(newWPM, this.playbackController.pauseOnPunctuation);
        });
        
        // Mode toggle
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mode = e.target.value;
                this.practiceOptions?.classList.toggle('hidden', mode !== 'practice');
                
                if (mode === 'practice') {
                    const startSpeed = parseInt(this.startSpeedInput?.value || 200);
                    const rampRate = parseInt(this.rampRateInput?.value || 10);
                    this.playbackController.setMode('practice', startSpeed, rampRate);
                } else {
                    this.playbackController.setMode('manual');
                }
            });
        });
        
        // Practice mode settings
        this.startSpeedInput?.addEventListener('change', (e) => {
            const startSpeed = parseInt(e.target.value);
            const rampRate = parseInt(this.rampRateInput?.value || 10);
            this.playbackController.setMode('practice', startSpeed, rampRate);
        });
        
        this.rampRateInput?.addEventListener('change', (e) => {
            const rampRate = parseInt(e.target.value);
            const startSpeed = parseInt(this.startSpeedInput?.value || 200);
            this.playbackController.setMode('practice', startSpeed, rampRate);
        });
        
        // Text input
        this.loadTextBtn?.addEventListener('click', () => {
            const text = this.textInput?.value.trim();
            if (text) {
                const processedData = this.textProcessor.processText(text, { 
                    method: 'paste', 
                    source: 'manual_paste',
                    title: text.substring(0, 50) + '...'
                });
                this.loadProcessedText(processedData);
                this.storageManager.saveToHistory('manual', text.substring(0, 100) + '...');
            }
        });
        
        // PDF upload
        this.pdfInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                try {
                    const processedData = await this.textProcessor.loadPDF(file, (status) => {
                        this.uiController.updateUploadStatus(status);
                    });
                    this.loadProcessedText(processedData);
                    this.storageManager.saveToHistory('pdf', processedData.fileName);
                    this.uiController.updateUploadStatus(processedData.statusMessage, true);
                } catch (error) {
                    this.uiController.updateUploadStatus('Error loading PDF', true);
                }
            }
        });
        
        // Drag and drop for PDF
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.background = 'var(--sidebar-bg)';
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.background = '';
            });
            
            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                uploadArea.style.background = '';
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'application/pdf') {
                    try {
                        const processedData = await this.textProcessor.loadPDF(file, (status) => {
                            this.uiController.updateUploadStatus(status);
                        });
                        this.loadProcessedText(processedData);
                        this.storageManager.saveToHistory('pdf', processedData.fileName);
                        this.uiController.updateUploadStatus(processedData.statusMessage, true);
                    } catch (error) {
                        this.uiController.updateUploadStatus('Error loading PDF', true);
                    }
                }
            });
        }
        
        // Settings
        this.settingsBtn?.addEventListener('click', () => {
            this.settingsModal?.classList.add('open');
            this.settingsManager.displayCustomThemes();
            this.settingsManager.updateSettingsUI();
        });
        
        this.closeSettingsBtn?.addEventListener('click', () => {
            this.settingsModal?.classList.remove('open');
        });
        
        // Settings controls
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        const fontSizeValue = document.getElementById('fontSizeValue');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const fontSize = parseInt(e.target.value);
                this.settingsManager.updateSetting('fontSize', fontSize);
                // Update display immediately
                if (fontSizeValue) {
                    fontSizeValue.textContent = fontSize + 'px';
                }
            });
        }
        
        const highlightCenterCheck = document.getElementById('highlightCenter');
        if (highlightCenterCheck) {
            highlightCenterCheck.addEventListener('change', (e) => {
                this.settingsManager.updateSetting('highlightCenter', e.target.checked);
                
                // Immediately redisplay current word to show the effect
                const state = this.playbackController.getState();
                if (state.totalWords > 0 && state.currentIndex < state.totalWords) {
                    const currentWord = this.playbackController.words[state.currentIndex];
                    this.uiController.displayWord(currentWord, state.currentIndex);
                }
            });
        }
        
        const pausePunctuationCheck = document.getElementById('showPunctuation');
        if (pausePunctuationCheck) {
            pausePunctuationCheck.addEventListener('change', (e) => {
                this.settingsManager.updateSetting('pauseOnPunctuation', e.target.checked);
            });
        }
        
        // Theme presets
        document.querySelectorAll('.theme-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = btn.dataset.preset;
                this.settingsManager.setTheme(theme);
            });
        });
        
        // Font selection
        document.querySelectorAll('.font-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const font = btn.dataset.font;
                this.settingsManager.updateSetting('fontFamily', font);
            });
        });
        
        // Sidebar toggle button
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => {
                this.uiController.toggleSidebar();
            });
        }
        
        // Close sidebar button
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => {
                this.uiController.closeSidebar();
            });
        }
        
        // Secondary tabs (input methods)
        document.querySelectorAll('[data-tab-group="input"] [role="tab"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.uiController.switchTab(tabName);
            });
        });
        
        // Library tab loading
        let libraryLoaded = false;
        const libraryTab = document.querySelector('[data-tab="library"]');
        if (libraryTab) {
            libraryTab.addEventListener('click', () => {
                if (!libraryLoaded) {
                    this.libraryManager.loadLibrary();
                    libraryLoaded = true;
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.playbackController.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    this.playbackController.previousWord();
                    break;
                case 'ArrowRight':
                    this.playbackController.nextWord();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.playbackController.increaseSpeed();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.playbackController.decreaseSpeed();
                    break;
                case 'r':
                    this.playbackController.reset();
                    break;
                case 's':
                    this.uiController.toggleSidebar();
                    break;
            }
        });
    }

    /**
     * Save current reading position
     */
    savePosition() {
        const state = this.playbackController.getState();
        if (state.totalWords > 0) {
            this.storageManager.savePosition({
                words: this.playbackController.words,
                originalText: this.uiController.originalText,
                index: state.currentIndex
            });
        }
    }

    /**
     * Load saved reading position
     */
    loadPosition() {
        const position = this.storageManager.loadPosition();
        if (position) {
            // Use originalText if available to preserve formatting
            const textToLoad = position.originalText || position.text;
            const processedData = this.textProcessor.processText(textToLoad);
            this.loadProcessedText(processedData);
            this.playbackController.setPosition(position.index);
        }
    }

    /**
     * Get application state for debugging or external access
     */
    getState() {
        return {
            playback: this.playbackController.getState(),
            settings: this.settingsManager.getSettings(),
            books: this.libraryManager.getBooks(),
            storageInfo: this.storageManager.getStorageInfo()
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SpeedReader();
    
    // Make app globally accessible for debugging
    window.speedReaderApp = app;
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
});