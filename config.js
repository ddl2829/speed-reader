/**
 * Speed Reader Application Configuration
 * 
 * This file contains all configurable settings for the Speed Reader application:
 * - Analytics and privacy settings
 * - Feature flags and behavioral controls
 * - Integration credentials and API keys
 * 
 * Setup Instructions:
 * 1. Replace GA_MEASUREMENT_ID with your Google Analytics 4 tracking ID
 * 2. Adjust privacy settings based on your requirements
 * 3. Modify heartbeat and storage settings for your use case
 */

/* ===== ANALYTICS CONFIGURATION ===== */

/**
 * Google Analytics 4 Measurement ID
 * 
 * Set to your GA4 tracking ID (format: G-XXXXXXXXXX) for production
 * Set to null to disable analytics completely
 * 
 * Automatic test detection: Analytics are disabled during automated testing
 * to prevent test data from polluting analytics
 */
const GA_MEASUREMENT_ID = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.navigator.webdriver 
    ? null // Disable during automated tests (Playwright, Selenium, etc.)
    : 'G-BMD4CW8NQ7'; // Replace with your actual GA4 Measurement ID

/**
 * Analytics Configuration Options
 * Controls data collection, privacy settings, and performance parameters
 */
const ANALYTICS_CONFIG = {
    // Data Storage Settings
    enableLocalStorage: true,      // Store events in browser localStorage for backup/debugging
    maxLocalEvents: 100,           // Maximum events to retain in localStorage (prevents bloat)
    
    // Performance Settings  
    heartbeatInterval: 5,          // Minutes between activity heartbeat events
    
    // Privacy Controls (GDPR/CCPA compliant defaults)
    privacy: {
        anonymizeIP: true,                    // Anonymize visitor IP addresses
        allowGoogleSignals: false,            // Disable Google Signals (cross-device tracking)
        allowAdPersonalization: false        // Disable ad personalization features
    }
};

// Export for use in other modules
window.GA_MEASUREMENT_ID = GA_MEASUREMENT_ID;
window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;