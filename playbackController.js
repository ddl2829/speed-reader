/**
 * PlaybackController - Handles RSVP playback logic, timing, and speed control
 * 
 * Responsibilities:
 * - Play/pause/stop functionality
 * - Speed control and practice mode ramping
 * - Word navigation (next/previous/reset)
 * - Timing calculations and interval management
 */
class PlaybackController {
    constructor() {
        this.isPlaying = false;
        this.intervalId = null;
        this.currentIndex = 0;
        this.words = [];
        this.currentWPM = 250;
        this.mode = 'manual';
        this.practiceStartSpeed = 200;
        this.practiceRampRate = 10;
        this.practiceStartTime = null;
        this.pauseOnPunctuation = true;
        
        // Callbacks for external updates
        this.onWordChange = null;
        this.onProgressUpdate = null;
        this.onPlayStateChange = null;
        this.onSpeedChange = null;
        this.onStop = null;
    }

    /**
     * Set the text words for playback
     * @param {Array} words - Array of words to display
     */
    setWords(words) {
        this.words = words;
        this.currentIndex = 0;
    }

    /**
     * Set current playback position
     * @param {number} index - Word index to set
     */
    setPosition(index) {
        if (index >= 0 && index < this.words.length) {
            this.currentIndex = index;
            if (this.onWordChange) {
                this.onWordChange(this.words[this.currentIndex], this.currentIndex);
            }
            if (this.onProgressUpdate) {
                this.onProgressUpdate(this.currentIndex, this.words.length);
            }
        }
    }

    /**
     * Set playback mode
     * @param {string} mode - 'manual' or 'practice'
     * @param {number} startSpeed - Starting speed for practice mode
     * @param {number} rampRate - Speed increase rate for practice mode
     */
    setMode(mode, startSpeed = 200, rampRate = 10) {
        this.mode = mode;
        this.practiceStartSpeed = startSpeed;
        this.practiceRampRate = rampRate;
    }

    /**
     * Set speed control settings
     * @param {number} wpm - Words per minute
     * @param {boolean} pauseOnPunctuation - Whether to pause longer on punctuation
     */
    setSpeed(wpm, pauseOnPunctuation = true) {
        const oldWPM = this.currentWPM;
        this.currentWPM = wpm;
        this.pauseOnPunctuation = pauseOnPunctuation;
        
        if (this.onSpeedChange) {
            this.onSpeedChange(this.currentWPM, oldWPM);
        }
        
        // If currently playing in manual mode, restart with new speed
        if (this.isPlaying && this.mode === 'manual') {
            this.stop();
            this.play();
        }
    }

    /**
     * Start RSVP text playback at current speed
     * Handles both manual speed and practice mode with ramping
     */
    play() {
        if (this.words.length === 0) return;
        
        this.isPlaying = true;
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true);
        }
        
        if (this.mode === 'practice') {
            this.practiceStartTime = Date.now();
            this.currentWPM = this.practiceStartSpeed;
        }
        
        const showNextWord = () => {
            if (this.currentIndex >= this.words.length) {
                this.stop();
                return;
            }
            
            const word = this.words[this.currentIndex];
            
            // Notify word change
            if (this.onWordChange) {
                this.onWordChange(word, this.currentIndex);
            }
            
            this.currentIndex++;
            
            // Notify progress update
            if (this.onProgressUpdate) {
                this.onProgressUpdate(this.currentIndex, this.words.length);
            }
            
            // Calculate delay
            let delay = 60000 / this.currentWPM;
            
            // Add extra delay for punctuation
            if (this.pauseOnPunctuation && /[.!?;]/.test(word)) {
                delay *= 1.5;
            }
            
            // Update speed in practice mode
            if (this.mode === 'practice' && this.practiceStartTime) {
                const elapsedMinutes = (Date.now() - this.practiceStartTime) / 60000;
                const newSpeed = Math.min(
                    this.practiceStartSpeed + (this.practiceRampRate * elapsedMinutes),
                    1000
                );
                this.currentWPM = Math.round(newSpeed);
                
                if (this.onSpeedChange) {
                    this.onSpeedChange(this.currentWPM);
                }
            }
            
            this.intervalId = setTimeout(showNextWord, delay);
        };
        
        showNextWord();
    }

    /**
     * Stop playback
     */
    stop() {
        this.isPlaying = false;
        if (this.onPlayStateChange) {
            this.onPlayStateChange(false);
        }
        
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.onStop) {
            this.onStop();
        }
    }

    /**
     * Toggle between play and pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    /**
     * Go to previous word
     */
    previousWord() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            if (this.onWordChange) {
                this.onWordChange(this.words[this.currentIndex], this.currentIndex);
            }
            if (this.onProgressUpdate) {
                this.onProgressUpdate(this.currentIndex, this.words.length);
            }
        }
    }

    /**
     * Go to next word
     */
    nextWord() {
        if (this.currentIndex < this.words.length - 1) {
            this.currentIndex++;
            if (this.onWordChange) {
                this.onWordChange(this.words[this.currentIndex], this.currentIndex);
            }
            if (this.onProgressUpdate) {
                this.onProgressUpdate(this.currentIndex, this.words.length);
            }
        }
    }

    /**
     * Reset to beginning
     */
    reset() {
        this.stop();
        this.currentIndex = 0;
        if (this.words.length > 0) {
            if (this.onWordChange) {
                this.onWordChange(this.words[0], 0);
            }
        }
        if (this.onProgressUpdate) {
            this.onProgressUpdate(0, this.words.length);
        }
    }

    /**
     * Increase speed by 25 WPM
     */
    increaseSpeed() {
        const newSpeed = Math.min(this.currentWPM + 25, 1000);
        this.setSpeed(newSpeed);
    }

    /**
     * Decrease speed by 25 WPM
     */
    decreaseSpeed() {
        const newSpeed = Math.max(this.currentWPM - 25, 100);
        this.setSpeed(newSpeed);
    }

    /**
     * Get current playback state
     * @returns {Object} Current state information
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentIndex: this.currentIndex,
            currentWPM: this.currentWPM,
            mode: this.mode,
            totalWords: this.words.length,
            practiceStartSpeed: this.practiceStartSpeed,
            practiceRampRate: this.practiceRampRate
        };
    }
}