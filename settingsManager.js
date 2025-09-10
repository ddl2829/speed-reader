/**
 * SettingsManager - Handles theme management, settings persistence, and customization
 * 
 * Responsibilities:
 * - Theme management (presets and custom themes)
 * - Settings persistence to localStorage
 * - Color customization and CSS variable management
 * - Font and display settings
 * - Settings UI updates and synchronization
 */
class SettingsManager {
    constructor() {
        this.settings = {
            fontSize: 48,
            theme: 'light',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            highlightCenter: false,
            pauseOnPunctuation: true,
            customColors: {
                background: '#ffffff',
                text: '#000000',
                accent: '#2563eb',
                displayBg: '#ffffff',
                border: '#e5e7eb'
            }
        };
        
        this.customThemes = this.loadCustomThemes();
        this.elements = {};
        this.onSettingsChange = null; // Callback for settings changes
        
        this.initializeElements();
    }

    /**
     * Initialize DOM element references for settings controls
     */
    initializeElements() {
        // Settings modal
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        
        // Font and display settings
        this.elements.fontSizeSlider = document.getElementById('fontSizeSlider');
        this.elements.fontSizeValue = document.getElementById('fontSizeValue');
        this.elements.highlightCenterCheck = document.getElementById('highlightCenter');
        this.elements.pausePunctuationCheck = document.getElementById('showPunctuation');
        
        // Legacy selects (if they exist)
        this.elements.themeSelect = document.getElementById('themeSelect');
        this.elements.fontSelect = document.getElementById('fontSelect');
        
        // Custom theme elements
        this.elements.customThemesSection = document.getElementById('customThemesSection');
        this.elements.customThemesList = document.getElementById('customThemesList');
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('speedReaderSettings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
            // Merge with defaults to ensure all properties exist
            this.settings = {
                ...this.settings,
                ...loadedSettings,
                customColors: {
                    ...this.settings.customColors,
                    ...(loadedSettings.customColors || {})
                }
            };
        }
        this.applySettings();
        this.updateSettingsUI();
    }

    /**
     * Save current settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('speedReaderSettings', JSON.stringify(this.settings));
    }

    /**
     * Apply current settings to the UI and CSS
     */
    applySettings() {
        // Apply theme
        if (this.settings.theme.startsWith('custom-')) {
            document.body.dataset.theme = 'custom';
            this.applyCustomColors();
        } else {
            document.body.dataset.theme = this.settings.theme;
            this.clearCustomProperties();
        }
        
        // Apply custom colors if custom theme
        if (this.settings.theme === 'custom' || this.settings.theme.startsWith('custom-')) {
            this.applyCustomColors();
        }
        
        // Apply font settings
        const wordDisplay = document.getElementById('currentWord');
        if (wordDisplay) {
            wordDisplay.style.fontSize = this.settings.fontSize + 'px';
            wordDisplay.style.fontFamily = this.settings.fontFamily;
        }
        
        // Apply highlight center
        document.body.classList.toggle('highlight-center', this.settings.highlightCenter);
        
        // Notify of settings change
        if (this.onSettingsChange) {
            this.onSettingsChange(this.settings);
        }
        
        // Save settings
        this.saveSettings();
    }

    /**
     * Apply custom colors as CSS variables
     */
    applyCustomColors() {
        const root = document.documentElement;
        root.style.setProperty('--bg-color', this.settings.customColors.background);
        root.style.setProperty('--text-color', this.settings.customColors.text);
        root.style.setProperty('--primary-color', this.settings.customColors.accent);
        root.style.setProperty('--word-display-bg', this.settings.customColors.displayBg);
        root.style.setProperty('--border-color', this.settings.customColors.border);
        
        // Calculate sidebar background (slightly different from main background)
        const sidebarBg = this.lightenDarkenColor(this.settings.customColors.background, 10);
        root.style.setProperty('--sidebar-bg', sidebarBg);
        
        // Calculate hover color for primary
        const primaryHover = this.lightenDarkenColor(this.settings.customColors.accent, -20);
        root.style.setProperty('--primary-hover', primaryHover);
    }

    /**
     * Clear custom CSS properties
     */
    clearCustomProperties() {
        const root = document.documentElement;
        root.style.removeProperty('--bg-color');
        root.style.removeProperty('--text-color');
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--word-display-bg');
        root.style.removeProperty('--sidebar-bg');
        root.style.removeProperty('--border-color');
    }

    /**
     * Update a specific setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    updateSetting(key, value) {
        if (key.includes('.')) {
            // Handle nested keys like 'customColors.background'
            const keys = key.split('.');
            let current = this.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        } else {
            this.settings[key] = value;
        }
        this.applySettings();
    }

    /**
     * Set theme and update custom colors to match
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        this.settings.theme = theme;
        this.updateCustomColorsFromTheme(theme);
        this.applySettings();
        this.updateSettingsUI();
    }

    /**
     * Update custom colors to match a preset theme
     * @param {string} theme - Theme name
     */
    updateCustomColorsFromTheme(theme) {
        // Check if it's a custom theme
        if (theme.startsWith('custom-')) {
            const safeName = theme.replace('custom-', '');
            if (this.customThemes[safeName]) {
                this.settings.customColors = { ...this.customThemes[safeName].colors };
                return;
            }
        }
        
        // Define theme color values
        const themeColors = {
            light: {
                background: '#ffffff',
                text: '#1f2937',
                accent: '#2563eb',
                displayBg: '#ffffff',
                border: '#e5e7eb'
            },
            dark: {
                background: '#111827',
                text: '#f3f4f6',
                accent: '#2563eb',
                displayBg: '#1f2937',
                border: '#374151'
            },
            sepia: {
                background: '#f4f1e8',
                text: '#5c4b37',
                accent: '#8b7355',
                displayBg: '#faf8f3',
                border: '#d4c4b0'
            },
            contrast: {
                background: '#000000',
                text: '#ffffff',
                accent: '#ffffff',
                displayBg: '#000000',
                border: '#ffffff'
            },
            ocean: {
                background: '#001f3f',
                text: '#7fdbff',
                accent: '#39cccc',
                displayBg: '#002855',
                border: '#0074d9'
            },
            forest: {
                background: '#1a3626',
                text: '#a8e6a3',
                accent: '#66bb6a',
                displayBg: '#244831',
                border: '#4a7c59'
            }
        };
        
        // Update custom colors to match the selected theme
        if (themeColors[theme]) {
            this.settings.customColors = themeColors[theme];
        }
    }

    /**
     * Initialize color picker controls
     */
    initializeColorPickers() {
        const colorInputs = [
            { picker: 'bgColorPicker', text: 'bgColorText', property: 'background' },
            { picker: 'textColorPicker', text: 'textColorText', property: 'text' },
            { picker: 'accentColorPicker', text: 'accentColorText', property: 'accent' },
            { picker: 'displayBgColorPicker', text: 'displayBgColorText', property: 'displayBg' },
            { picker: 'borderColorPicker', text: 'borderColorText', property: 'border' }
        ];

        colorInputs.forEach(({ picker, text, property }) => {
            const pickerElement = document.getElementById(picker);
            const textElement = document.getElementById(text);
            
            if (pickerElement && textElement) {
                pickerElement.addEventListener('input', (e) => {
                    textElement.value = e.target.value;
                    this.settings.customColors[property] = e.target.value;
                    this.applyCustomColorsAsCustomTheme();
                });
                
                textElement.addEventListener('input', (e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        pickerElement.value = e.target.value;
                        this.settings.customColors[property] = e.target.value;
                        this.applyCustomColorsAsCustomTheme();
                    }
                });
            }
        });
        
        // Save custom theme button
        const saveCustomBtn = document.getElementById('saveCustomTheme');
        if (saveCustomBtn) {
            saveCustomBtn.addEventListener('click', () => {
                this.saveCustomTheme();
            });
        }
        
        // Reset defaults button
        const resetBtn = document.getElementById('resetDefaults');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }
    }

    /**
     * Apply custom colors and set theme to custom
     */
    applyCustomColorsAsCustomTheme() {
        this.settings.theme = 'custom';
        document.body.dataset.theme = 'custom';
        this.applyCustomColors();
        this.saveSettings();
    }

    /**
     * Update settings UI elements to reflect current settings
     */
    updateSettingsUI() {
        // Update font size
        if (this.elements.fontSizeSlider) {
            this.elements.fontSizeSlider.value = this.settings.fontSize;
        }
        if (this.elements.fontSizeValue) {
            this.elements.fontSizeValue.textContent = this.settings.fontSize + 'px';
        }
        
        // Update checkboxes
        if (this.elements.highlightCenterCheck) {
            this.elements.highlightCenterCheck.checked = this.settings.highlightCenter;
        }
        if (this.elements.pausePunctuationCheck) {
            this.elements.pausePunctuationCheck.checked = this.settings.pauseOnPunctuation;
        }
        
        // Update legacy selects
        if (this.elements.themeSelect) {
            this.elements.themeSelect.value = this.settings.theme;
        }
        if (this.elements.fontSelect) {
            this.elements.fontSelect.value = this.settings.fontFamily;
        }
        
        // Update theme preset buttons
        document.querySelectorAll('.theme-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === this.settings.theme);
        });
        
        // Update font option buttons
        document.querySelectorAll('.font-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.font === this.settings.fontFamily);
        });
        
        // Update color pickers
        this.updateColorPickers();
    }

    /**
     * Update color picker values
     */
    updateColorPickers() {
        const colorMappings = [
            { picker: 'bgColorPicker', text: 'bgColorText', value: this.settings.customColors.background },
            { picker: 'textColorPicker', text: 'textColorText', value: this.settings.customColors.text },
            { picker: 'accentColorPicker', text: 'accentColorText', value: this.settings.customColors.accent },
            { picker: 'displayBgColorPicker', text: 'displayBgColorText', value: this.settings.customColors.displayBg },
            { picker: 'borderColorPicker', text: 'borderColorText', value: this.settings.customColors.border || '#e5e7eb' }
        ];

        colorMappings.forEach(({ picker, text, value }) => {
            const pickerElement = document.getElementById(picker);
            const textElement = document.getElementById(text);
            if (pickerElement) pickerElement.value = value;
            if (textElement) textElement.value = value;
        });
    }

    /**
     * Load custom themes from localStorage
     */
    loadCustomThemes() {
        const saved = localStorage.getItem('speedReaderCustomThemes');
        return saved ? JSON.parse(saved) : {};
    }

    /**
     * Save custom themes to localStorage
     */
    saveCustomThemes() {
        localStorage.setItem('speedReaderCustomThemes', JSON.stringify(this.customThemes));
    }

    /**
     * Save current colors as a custom theme
     */
    saveCustomTheme() {
        const themeName = prompt('Enter a name for your custom theme:');
        if (!themeName || themeName.trim() === '') {
            return;
        }
        
        const safeName = themeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // Save the current colors as a new theme
        this.customThemes[safeName] = {
            name: themeName.trim(),
            colors: {
                background: this.settings.customColors.background,
                text: this.settings.customColors.text,
                accent: this.settings.customColors.accent,
                displayBg: this.settings.customColors.displayBg,
                border: this.settings.customColors.border
            }
        };
        
        this.saveCustomThemes();
        this.settings.theme = 'custom-' + safeName;
        this.saveSettings();
        this.displayCustomThemes();
        this.updateSettingsUI();
        
        alert(`Theme "${themeName}" saved successfully!`);
    }

    /**
     * Delete a custom theme
     * @param {string} themeId - Theme ID to delete
     */
    deleteCustomTheme(themeId) {
        const safeName = themeId.replace('custom-', '');
        if (this.customThemes[safeName]) {
            const themeName = this.customThemes[safeName].name;
            if (confirm(`Delete theme "${themeName}"?`)) {
                delete this.customThemes[safeName];
                this.saveCustomThemes();
                this.displayCustomThemes();
                
                // If this was the active theme, switch to light
                if (this.settings.theme === themeId) {
                    this.setTheme('light');
                }
            }
        }
    }

    /**
     * Display custom themes in the settings UI
     */
    displayCustomThemes() {
        if (!this.elements.customThemesList) return;
        
        // Clear existing custom themes
        this.elements.customThemesList.innerHTML = '';
        
        // Show/hide the section based on whether there are custom themes
        const hasCustomThemes = Object.keys(this.customThemes).length > 0;
        if (this.elements.customThemesSection) {
            this.elements.customThemesSection.style.display = hasCustomThemes ? 'block' : 'none';
        }
        
        // Add each custom theme
        Object.entries(this.customThemes).forEach(([safeName, theme]) => {
            const themeId = 'custom-' + safeName;
            const button = document.createElement('button');
            button.className = 'theme-preset custom-theme';
            button.dataset.preset = themeId;
            
            // Create preview
            const preview = document.createElement('span');
            preview.className = 'theme-preview';
            preview.style.background = theme.colors.background;
            preview.style.color = theme.colors.text;
            preview.textContent = 'Aa';
            
            // Create label
            const label = document.createElement('span');
            label.className = 'theme-label';
            label.textContent = theme.name;
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-theme-btn';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteCustomTheme(themeId);
            };
            
            button.appendChild(preview);
            button.appendChild(label);
            button.appendChild(deleteBtn);
            
            // Add click handler
            button.addEventListener('click', () => {
                this.setTheme(themeId);
            });
            
            this.elements.customThemesList.appendChild(button);
        });
    }

    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        this.settings = {
            fontSize: 48,
            theme: 'light',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            highlightCenter: false,
            pauseOnPunctuation: true,
            customColors: {
                background: '#ffffff',
                text: '#000000',
                accent: '#2563eb',
                displayBg: '#ffffff',
                border: '#e5e7eb'
            }
        };
        
        this.applySettings();
        this.updateSettingsUI();
    }

    /**
     * Utility function to lighten or darken a color
     * @param {string} col - Hex color code
     * @param {number} amt - Amount to lighten (positive) or darken (negative)
     * @returns {string} Modified hex color
     */
    lightenDarkenColor(col, amt) {
        let usePound = false;
        if (col[0] == "#") {
            col = col.slice(1);
            usePound = true;
        }
        let num = parseInt(col, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    /**
     * Get current settings
     * @returns {Object} Current settings object
     */
    getSettings() {
        return { ...this.settings };
    }
}