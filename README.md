# Speed Reader 🚀

A web-based speed reading application using the RSVP (Rapid Serial Visual Presentation) technique to help users improve their reading speed and comprehension.

![Speed Reader Demo](speedreader-demo.gif)

## Features

- **RSVP Reading**: Display one word at a time at controlled speeds (100-1000 WPM)
- **Multiple Input Sources**: Paste text, upload PDFs, or choose from popular classics
- **Reading Modes**: Manual speed control or progressive practice mode
- **Keyboard Shortcuts**: Full keyboard control for seamless reading
- **Themes**: Multiple visual themes plus custom color customization
- **Typography**: 18 font options optimized for reading
- **Project Gutenberg Library**: Access to popular classic books
- **Progress Tracking**: Visual progress bar and word count
- **Sidebar Navigation**: Jump to specific parts of the text  
- **Analytics**: Privacy-friendly usage tracking with Google Analytics 4
- **Session Persistence**: Resume reading where you left off
- **Offline Support**: PWA with service worker for offline use

## Quick Start

1. **Run the application**:
   ```bash
   npm start
   ```
   Open http://localhost:8080 in your browser

2. **Load text**: Use the "Load Text" tab to paste text, upload a PDF, or select from the library

3. **Start reading**: Switch to "Speed Reader" tab and click play or press spacebar

## Keyboard Shortcuts

- `Space` - Play/Pause
- `←` / `→` - Previous/Next word  
- `↑` / `↓` - Increase/Decrease speed (±25 WPM)
- `R` - Reset to beginning
- `S` - Toggle sidebar text view

## Development

### Testing

The application includes comprehensive Playwright tests covering all functionality:

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests (headless - fast)
npm test

# Run all tests (headed - visible browser with slow motion)
npm run test:headed

# Run specific test suites
npx playwright test --grep "Tab Navigation"
npx playwright test --grep "Keyboard Shortcuts" 
npx playwright test --grep "Library Functionality"

# Other test options
npm run test:ui      # Interactive test runner UI
npm run test:debug   # Debug mode with breakpoints
npm run test:report  # View HTML test report
```

### Test Coverage

The test suite includes:

- **Tab Navigation**: 3-tab system (Help, Load Text, Speed Reader)
- **Text Input**: Paste, PDF upload, library selection
- **Speed Reader Controls**: Play/pause, navigation, speed adjustment
- **Keyboard Shortcuts**: All keyboard controls
- **Library Functionality**: Popular books, filtering, search
- **Settings & Themes**: Theme switching, font changes, color customization
- **Sidebar**: Text navigation and word jumping
- **Progress Tracking**: Word count and progress bar accuracy
- **Error Handling**: Edge cases and input validation
- **Responsive Design**: Mobile viewport compatibility

### Project Structure

```
speedreader/
├── index.html          # Main application HTML
├── styles.css          # All application styles  
├── app.js              # Main application logic
├── analytics.js        # Privacy-friendly analytics tracking
├── config.js           # Analytics and app configuration
├── sw.js               # Service worker for PWA
├── manifest.json       # PWA manifest
├── server.js           # Development server
├── demo.js             # Demo recording script
├── package.json        # Dependencies and scripts
├── playwright.config.js # Test configuration
└── tests/
    └── speedreader.spec.js # Comprehensive test suite
```

### Analytics Configuration

The application includes optional privacy-friendly analytics. To configure:

1. **Edit `config.js`**:
   ```javascript
   // Set your Google Analytics 4 measurement ID
   const GA_MEASUREMENT_ID = 'G-YOUR-GA4-ID';
   
   // Configure privacy settings
   const ANALYTICS_CONFIG = {
       enableLocalStorage: true,  // Backup events locally
       maxLocalEvents: 100,       // Max events to store
       heartbeatInterval: 5,      // Minutes between heartbeats
       privacy: {
           anonymizeIP: true,              // Anonymize visitor IPs
           allowGoogleSignals: false,      // Disable Google Signals
           allowAdPersonalization: false  // Disable ad personalization
       }
   };
   ```

2. **Analytics Features**:
   - **Session Tracking**: Reading duration and engagement metrics
   - **Feature Usage**: Track which features are used most
   - **Reading Performance**: WPM improvements and reading patterns
   - **Text Loading**: Track preferred text input methods
   - **Privacy First**: All data anonymized and configurable

### Bug Fixes Applied

1. **Progress Display**: Fixed word count to show 1-based indexing (1/9 words) instead of 0-based (0/9 words)
2. **Theme Selection**: Updated tests to use theme preset buttons instead of select dropdowns
3. **Progress Bar**: Corrected progress calculation for accurate visual representation

## Technologies Used

- **Vanilla JavaScript**: No frameworks, pure web standards
- **CSS Grid/Flexbox**: Modern responsive layout
- **PDF.js**: Client-side PDF text extraction
- **Project Gutenberg API**: Access to free classic books  
- **Service Worker**: PWA offline functionality
- **Playwright**: End-to-end testing framework

## License

MIT License - see LICENSE file for details