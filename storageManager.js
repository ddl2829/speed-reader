/**
 * StorageManager - Handles all local storage operations and data persistence
 * 
 * Responsibilities:
 * - Position saving and loading for session continuity
 * - Reading history management
 * - Settings persistence (delegated to SettingsManager)
 * - Data validation and cleanup
 * - Storage quota management
 */
class StorageManager {
    constructor() {
        this.storageKeys = {
            position: 'speedReaderPosition',
            settings: 'speedReaderSettings',
            history: 'speedReaderHistory',
            customThemes: 'speedReaderCustomThemes'
        };
    }

    /**
     * Save current reading position and text
     * @param {Object} positionData - Position data to save
     * @param {Array} positionData.words - Array of words
     * @param {string} positionData.originalText - Original formatted text
     * @param {number} positionData.index - Current word index
     */
    savePosition(positionData) {
        if (!positionData.words || positionData.words.length === 0) return;
        
        const position = {
            text: positionData.words.join(' '),
            originalText: positionData.originalText || positionData.words.join(' '),
            index: positionData.index || 0,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.storageKeys.position, JSON.stringify(position));
        } catch (error) {
            console.error('Error saving position:', error);
            this.handleStorageError(error);
        }
    }

    /**
     * Load saved reading position
     * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
     * @returns {Object|null} Position data or null if not found/expired
     */
    loadPosition(maxAge = 86400000) { // 24 hours default
        try {
            const saved = localStorage.getItem(this.storageKeys.position);
            if (!saved) return null;
            
            const position = JSON.parse(saved);
            
            // Check if position is too old
            if (Date.now() - position.timestamp > maxAge) {
                this.clearPosition();
                return null;
            }
            
            return position;
        } catch (error) {
            console.error('Error loading position:', error);
            this.clearPosition(); // Clear corrupted data
            return null;
        }
    }

    /**
     * Clear saved reading position
     */
    clearPosition() {
        try {
            localStorage.removeItem(this.storageKeys.position);
        } catch (error) {
            console.error('Error clearing position:', error);
        }
    }

    /**
     * Save an item to reading history
     * @param {string} type - Type of content ('manual', 'pdf', 'gutenberg')
     * @param {string} title - Title or description of content
     * @param {Object} metadata - Additional metadata
     */
    saveToHistory(type, title, metadata = {}) {
        try {
            let history = this.getHistory();
            
            // Add new item to beginning
            history.unshift({
                type,
                title,
                metadata,
                timestamp: Date.now()
            });
            
            // Keep only last 10 items
            history = history.slice(0, 10);
            
            localStorage.setItem(this.storageKeys.history, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving to history:', error);
            this.handleStorageError(error);
        }
    }

    /**
     * Get reading history
     * @returns {Array} Array of history items
     */
    getHistory() {
        try {
            const saved = localStorage.getItem(this.storageKeys.history);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    /**
     * Clear reading history
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKeys.history);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    /**
     * Get a specific history item by index
     * @param {number} index - History item index
     * @returns {Object|null} History item or null if not found
     */
    getHistoryItem(index) {
        const history = this.getHistory();
        return history[index] || null;
    }

    /**
     * Remove a specific history item
     * @param {number} index - Index of item to remove
     */
    removeHistoryItem(index) {
        try {
            const history = this.getHistory();
            if (index >= 0 && index < history.length) {
                history.splice(index, 1);
                localStorage.setItem(this.storageKeys.history, JSON.stringify(history));
            }
        } catch (error) {
            console.error('Error removing history item:', error);
        }
    }

    /**
     * Save any generic data to localStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     */
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving data for key ${key}:`, error);
            this.handleStorageError(error);
        }
    }

    /**
     * Load generic data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Loaded data or default value
     */
    loadData(key, defaultValue = null) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error(`Error loading data for key ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key to remove
     */
    removeData(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing data for key ${key}:`, error);
        }
    }

    /**
     * Check if a key exists in localStorage
     * @param {string} key - Storage key to check
     * @returns {boolean} True if key exists
     */
    hasData(key) {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        let totalSize = 0;
        let itemCount = 0;
        const itemSizes = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            
            totalSize += size;
            itemCount++;
            itemSizes[key] = size;
        }
        
        return {
            totalSize,
            itemCount,
            itemSizes,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            availableSpace: this.getAvailableStorageSpace()
        };
    }

    /**
     * Estimate available storage space
     * @returns {number} Estimated available space in bytes
     */
    getAvailableStorageSpace() {
        try {
            // Try to use the Storage API if available
            if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    return estimate.quota - estimate.usage;
                });
            }
            
            // Fallback: Most browsers have ~5-10MB localStorage limit
            const currentUsage = JSON.stringify(localStorage).length;
            const estimatedLimit = 5 * 1024 * 1024; // 5MB conservative estimate
            
            return Math.max(0, estimatedLimit - currentUsage);
        } catch (error) {
            console.error('Error estimating storage space:', error);
            return 0;
        }
    }

    /**
     * Clean up old or large data items
     * @param {number} maxAge - Maximum age for items in milliseconds
     */
    cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const now = Date.now();
        
        // Clean up old position data
        const position = this.loadPosition(maxAge);
        if (!position) {
            this.clearPosition();
        }
        
        // Clean up old history items
        try {
            const history = this.getHistory();
            const cleanHistory = history.filter(item => 
                now - item.timestamp <= maxAge
            );
            
            if (cleanHistory.length !== history.length) {
                localStorage.setItem(this.storageKeys.history, JSON.stringify(cleanHistory));
            }
        } catch (error) {
            console.error('Error cleaning up history:', error);
        }
    }

    /**
     * Handle storage errors (quota exceeded, etc.)
     * @param {Error} error - Storage error
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, cleaning up...');
            this.cleanup();
            
            // Try to clear some space by removing oldest history items
            try {
                const history = this.getHistory();
                if (history.length > 5) {
                    const reducedHistory = history.slice(0, 5);
                    localStorage.setItem(this.storageKeys.history, JSON.stringify(reducedHistory));
                }
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
        }
    }

    /**
     * Export all app data for backup
     * @returns {Object} All app data
     */
    exportData() {
        const data = {};
        
        Object.values(this.storageKeys).forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch (error) {
                    data[key] = value; // Store as string if not valid JSON
                }
            }
        });
        
        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data
        };
    }

    /**
     * Import app data from backup
     * @param {Object} backupData - Backup data to import
     * @returns {boolean} Success status
     */
    importData(backupData) {
        try {
            if (!backupData.data) {
                throw new Error('Invalid backup data format');
            }
            
            Object.entries(backupData.data).forEach(([key, value]) => {
                if (Object.values(this.storageKeys).includes(key)) {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all app data
     */
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            this.removeData(key);
        });
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = 'storageTest';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}