/**
 * UIController - Handles all display updates, word rendering, and progress tracking
 * 
 * Responsibilities:
 * - Word display with highlighting and center character emphasis
 * - Progress bar and statistics updates
 * - Sidebar text navigation and highlighting
 * - Tab switching and UI state management
 * - Time remaining calculations
 */
class UIController {
    constructor() {
        this.elements = {};
        this.highlightCenter = false;
        this.currentIndex = 0;
        this.words = [];
        this.originalText = '';
        this.currentWPM = 250;
        
        this.initializeElements();
    }

    /**
     * Initialize DOM element references for efficient access
     */
    initializeElements() {
        // Display elements
        this.elements.wordDisplay = document.getElementById('currentWord');
        this.elements.progressBar = document.getElementById('progressFill');
        this.elements.wordCount = document.getElementById('wordCount');
        this.elements.timeRemaining = document.getElementById('timeRemaining');
        this.elements.speedValue = document.getElementById('speedValue');
        this.elements.speedSlider = document.getElementById('speedSlider');
        
        // Control buttons
        this.elements.playPauseBtn = document.getElementById('playPauseBtn');
        
        // Sidebar
        this.elements.textSidebar = document.getElementById('textSidebar');
        this.elements.fullText = document.getElementById('fullText');
        
        // Upload status
        this.elements.uploadStatus = document.getElementById('uploadStatus');
    }

    /**
     * Display a word in the RSVP viewer with visual enhancements
     * @param {string} word - The word to display
     * @param {number} index - Current word index
     */
    displayWord(word, index = null) {
        if (index !== null) {
            this.currentIndex = index;
        }
        
        if (this.highlightCenter && word.length > 1) {
            const centerIndex = Math.floor(word.length / 2);
            const before = word.substring(0, centerIndex);
            const center = word[centerIndex];
            const after = word.substring(centerIndex + 1);
            this.elements.wordDisplay.innerHTML = `${before}<span style="color: var(--primary-color)">${center}</span>${after}`;
        } else {
            this.elements.wordDisplay.textContent = word;
        }
        
        // Update sidebar highlight if open
        if (this.elements.textSidebar.classList.contains('open')) {
            this.highlightCurrentWord();
        }
    }

    /**
     * Update progress bar and statistics
     * @param {number} currentIndex - Current word index
     * @param {number} totalWords - Total number of words
     * @param {number} currentWPM - Current reading speed
     */
    updateProgress(currentIndex, totalWords, currentWPM = null) {
        this.currentIndex = currentIndex;
        
        if (currentWPM !== null) {
            this.currentWPM = currentWPM;
        }
        
        const progress = totalWords > 0 ? ((currentIndex + 1) / totalWords) * 100 : 0;
        this.elements.progressBar.style.width = progress + '%';
        this.elements.wordCount.textContent = `${currentIndex + 1} / ${totalWords} words`;
        
        // Calculate time remaining
        if (totalWords > 0 && currentIndex < totalWords) {
            const wordsRemaining = totalWords - currentIndex;
            const minutesRemaining = wordsRemaining / this.currentWPM;
            const seconds = Math.round(minutesRemaining * 60);
            const displayMinutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            this.elements.timeRemaining.textContent = `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')} remaining`;
        } else {
            this.elements.timeRemaining.textContent = '0:00 remaining';
        }
    }

    /**
     * Update play/pause button state
     * @param {boolean} isPlaying - Current playing state
     */
    updatePlayButton(isPlaying) {
        this.elements.playPauseBtn.textContent = isPlaying ? '⏸️ Pause' : '▶️ Start';
    }

    /**
     * Update speed display
     * @param {number} wpm - Words per minute
     */
    updateSpeedDisplay(wpm) {
        this.currentWPM = wpm;
        this.elements.speedValue.textContent = wpm;
        this.elements.speedSlider.value = wpm;
    }

    /**
     * Set highlight center mode
     * @param {boolean} enabled - Whether to highlight center character
     */
    setHighlightCenter(enabled) {
        this.highlightCenter = enabled;
        document.body.classList.toggle('highlight-center', enabled);
    }

    /**
     * Display welcome message when no text is loaded
     */
    displayWelcome() {
        this.elements.wordDisplay.textContent = 'Welcome';
    }

    /**
     * Toggle sidebar visibility
     * @returns {boolean} - Whether sidebar is now open
     */
    toggleSidebar() {
        if (!this.elements.textSidebar) {
            console.error('Sidebar element not found');
            return false;
        }
        
        const wasOpen = this.elements.textSidebar.classList.contains('open');
        this.elements.textSidebar.classList.toggle('open');
        const isOpen = this.elements.textSidebar.classList.contains('open');
        
        // If opening and we have text, display it
        if (isOpen && this.words.length > 0) {
            this.displayFullText();
        }
        
        return isOpen;
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        if (this.elements.textSidebar) {
            this.elements.textSidebar.classList.remove('open');
        }
    }

    /**
     * Set text data for sidebar display
     * @param {Array} words - Array of words
     * @param {string} originalText - Original formatted text
     */
    setTextData(words, originalText) {
        this.words = words;
        this.originalText = originalText;
    }

    /**
     * Display full text in sidebar with clickable words
     */
    displayFullText() {
        if (!this.elements.fullText) {
            console.error('Full text element not found');
            return;
        }
        
        this.elements.fullText.innerHTML = '';
        
        if (!this.originalText || this.originalText.length === 0) {
            // Fallback if no original text stored - reconstruct from words
            if (this.words && this.words.length > 0) {
                this.words.forEach((word, index) => {
                    const span = document.createElement('span');
                    span.className = 'word';
                    span.textContent = word + ' ';
                    span.dataset.index = index;
                    if (index === this.currentIndex) {
                        span.classList.add('current');
                    }
                    span.addEventListener('click', () => {
                        this.onWordClick(index, word);
                    });
                    this.elements.fullText.appendChild(span);
                });
            }
            return;
        }
        
        // Split text into paragraphs
        const paragraphs = this.originalText.split(/\n\s*\n/);
        let wordIndex = 0;
        
        paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) return;
            
            const paragraphDiv = document.createElement('div');
            paragraphDiv.className = 'text-paragraph';
            
            // Split paragraph into words while preserving structure
            const paragraphWords = paragraph.replace(/\s+/g, ' ').trim().split(' ');
            
            paragraphWords.forEach(word => {
                if (!word) return;
                
                // Find the corresponding index in our main words array
                let currentWordIndex = wordIndex;
                if (currentWordIndex < this.words.length && this.words[currentWordIndex] === word) {
                    const span = document.createElement('span');
                    span.className = 'word';
                    span.textContent = word + ' ';
                    span.dataset.index = currentWordIndex;
                    
                    if (currentWordIndex === this.currentIndex) {
                        span.classList.add('current');
                    }
                    
                    const index = currentWordIndex;
                    span.addEventListener('click', () => {
                        this.onWordClick(index, this.words[index]);
                    });
                    
                    paragraphDiv.appendChild(span);
                    wordIndex++;
                }
            });
            
            this.elements.fullText.appendChild(paragraphDiv);
        });
    }

    /**
     * Highlight current word in sidebar
     */
    highlightCurrentWord() {
        document.querySelectorAll('.full-text .word').forEach(word => {
            word.classList.remove('current');
        });
        const currentWord = document.querySelector(`.full-text .word[data-index="${this.currentIndex}"]`);
        if (currentWord) {
            currentWord.classList.add('current');
            currentWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Handle sub-tab switching within panels (e.g., paste/upload/library tabs)
     * @param {string} tabName - The name of the tab to switch to
     */
    switchTab(tabName) {
        // Update secondary tab buttons
        document.querySelectorAll('[data-tab-group="input"] [role="tab"]').forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('text-primary', isActive);
            btn.classList.toggle('shadow-sm', isActive);
            btn.classList.toggle('text-gray-600', !isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    /**
     * Switch main application tabs
     * @param {string} tabName - The name of the main tab to switch to
     */
    switchMainTab(tabName) {
        // Update main tab buttons only
        document.querySelectorAll('[data-tab-group="main"] [role="tab"]').forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('border-primary', isActive);
            btn.classList.toggle('text-primary', isActive);
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('bg-opacity-50', isActive);
            btn.classList.toggle('border-transparent', !isActive);
            btn.classList.toggle('text-gray-600', !isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        
        // Update main tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName + 'Panel').classList.add('active');
        
        // Special handling for certain tabs
        if (tabName === 'input') {
            // Initialize secondary tab state - ensure paste tab is active by default
            this.switchTab('paste');
        }
    }

    /**
     * Update upload status message
     * @param {string} message - Status message to display
     * @param {boolean} temporary - Whether to clear the message after 3 seconds
     */
    updateUploadStatus(message, temporary = false) {
        if (this.elements.uploadStatus) {
            this.elements.uploadStatus.textContent = message;
            
            if (temporary) {
                setTimeout(() => {
                    this.elements.uploadStatus.textContent = '';
                }, 3000);
            }
        }
    }

    /**
     * Clear upload status
     */
    clearUploadStatus() {
        if (this.elements.uploadStatus) {
            this.elements.uploadStatus.textContent = '';
        }
    }

    /**
     * Callback for when a word in the sidebar is clicked
     * Override this method or set onWordClick property
     * @param {number} index - Word index
     * @param {string} word - The word that was clicked
     */
    onWordClick(index, word) {
        // Override this method or set as property
        console.log('Word clicked:', index, word);
    }
}