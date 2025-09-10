// Configuration for Speed Reader
// Set your Google Analytics Measurement ID here
// You can get this from Google Analytics 4 dashboard

// For development/testing, set to null to disable GA
// const GA_MEASUREMENT_ID = null;

// For production, set your GA4 Measurement ID (format: G-XXXXXXXXXX)
// Disable analytics during testing
const GA_MEASUREMENT_ID = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.navigator.webdriver 
    ? null // Disable during automated tests
    : 'G-BMD4CW8NQ7'; // Replace with your actual GA4 ID

// Other analytics configuration
const ANALYTICS_CONFIG = {
    // Enable local event storage for backup/debugging
    enableLocalStorage: true,
    
    // How many events to keep in localStorage
    maxLocalEvents: 100,
    
    // Heartbeat interval (minutes) 
    heartbeatInterval: 5,
    
    // Privacy settings
    privacy: {
        anonymizeIP: true,
        allowGoogleSignals: false,
        allowAdPersonalization: false
    }
};

// Export for use in other modules
window.GA_MEASUREMENT_ID = GA_MEASUREMENT_ID;
window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;