# Speed Reader 🚀

Speed Reader helps you read faster by displaying one word at a time in the center of your screen using RSVP (Rapid Serial Visual Presentation) - a technique that eliminates eye movement and subvocalization to dramatically increase reading speed. Simply paste text, upload a PDF, or choose from classic books, then watch words flash at your chosen pace from 100-1000 words per minute.

![Speed Reader Demo](speedreader-demo.gif)

## Features

### Core Reading Experience
- **RSVP Reading**: Display one word at a time at controlled speeds (100-1000 WPM)
- **Reading Modes**: Manual speed control or progressive practice mode with automatic ramping
- **Center Highlighting**: Optional highlighting of center character for improved focus
- **Punctuation Pausing**: Configurable pauses on punctuation marks for better comprehension

### Content Sources
- **Multiple Input Sources**: Paste text, upload PDFs, or choose from popular classics
- **Project Gutenberg Library**: Access to popular classic books with search and filtering
- **PDF Processing**: Client-side PDF text extraction with page-by-page loading
- **Smart Text Cleaning**: Automatic removal of Project Gutenberg headers/footers

### User Interface
- **Intuitive Controls**: Font size, reading options, and quick actions directly in the reader interface
- **Keyboard Shortcuts**: Full keyboard control for seamless reading experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Sidebar Navigation**: Full text view with clickable words to jump to any position
- **Progress Tracking**: Visual progress bar, word count, and time remaining display

### Customization
- **Themes**: 6 built-in themes (Light, Dark, Sepia, Ocean, Forest, High Contrast)
- **Custom Themes**: Create and save unlimited custom color schemes
- **Typography**: 18+ font options optimized for reading comfort
- **Immediate Feedback**: Settings apply instantly for immediate visual preview

### Technical Features
- **Session Persistence**: Resume reading where you left off across browser sessions
- **Offline Support**: PWA with service worker for offline use
- **Privacy-Friendly Analytics**: Optional usage tracking with full privacy controls
- **Modular Architecture**: Clean, maintainable codebase with separated concerns

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
├── index.html          # Main application HTML with responsive design
├── styles.css          # Optimized CSS with theme system and Tailwind
├── app.js              # Main orchestrator - coordinates all modules
├── textProcessor.js    # Text loading, cleaning, and PDF processing
├── playbackController.js # RSVP timing, speed control, and navigation
├── uiController.js     # Display updates, progress, and UI state
├── settingsManager.js  # Theme management and settings persistence
├── libraryManager.js   # Project Gutenberg integration and book search
├── storageManager.js   # Local storage operations and data persistence
├── analytics.js        # Privacy-friendly analytics tracking
├── config.js           # Analytics and app configuration
├── sw.js               # Service worker for PWA
├── manifest.json       # PWA manifest
├── server.js           # Development server
├── demo.js             # Demo recording script
├── package.json        # Dependencies and scripts
├── playwright.config.js # Test configuration
└── tests/
    └── speedreader.spec.js # Comprehensive test suite (130 tests)
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

### Architecture

#### Modular Design
The application uses a modular architecture with clear separation of concerns:

**Core Modules:**
- **TextProcessor**: Handles text loading, cleaning, and PDF processing
- **PlaybackController**: Manages RSVP timing, speed control, and word navigation  
- **UIController**: Controls display updates, progress tracking, and interface state
- **SettingsManager**: Manages themes, customization, and settings persistence
- **LibraryManager**: Handles Project Gutenberg integration and book search
- **StorageManager**: Manages local storage operations and data persistence

**Design Principles:**
- **Event-Driven Communication**: Modules communicate through callbacks and event handlers
- **Loose Coupling**: Each module has well-defined interfaces and responsibilities
- **Centralized Orchestration**: The main app.js coordinates between modules
- **Independent Testing**: Individual modules can be tested separately

#### User Interface Design

**Control Layout:**
- **Contextual Controls**: Reading controls (font size, highlighting, punctuation) are located directly in the reader interface
- **Immediate Feedback**: Settings apply instantly to provide immediate visual preview  
- **Streamlined Settings**: The settings dialog focuses on theming and visual customization
- **Responsive Layout**: All controls adapt to different screen sizes using CSS Grid
- **Intuitive Organization**: Controls are grouped near the content they affect

#### Performance Features

**Styling & Optimization:**
- **Efficient CSS**: Uses Tailwind CSS for optimized styling with minimal custom CSS
- **Theme System**: CSS custom properties enable smooth theme transitions across all elements
- **Text Preservation**: Sidebar maintains original text formatting across browser sessions  
- **Responsive Performance**: Optimized for fast rendering on all device sizes

**Quality Assurance:**
- **Comprehensive Testing**: 130 automated tests across 5 different browsers
- **Cross-Browser Compatibility**: Tested on Chromium, Firefox, WebKit, and mobile browsers
- **Reliability**: Continuous integration ensures consistent functionality

## Technologies Used

### Core Technologies
- **Vanilla JavaScript**: No frameworks, pure ES6+ web standards with modular architecture
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **CSS Grid/Flexbox**: Modern responsive layout with CSS custom properties for theming
- **PDF.js**: Client-side PDF text extraction and processing
- **Project Gutenberg API**: Access to free classic books via Gutendex API

### Development & Testing
- **Playwright**: Cross-browser end-to-end testing (130 tests across 5 browsers)
- **Node.js**: Development server and build tooling
- **Service Worker**: PWA offline functionality and caching

### APIs & Services
- **Google Analytics 4**: Optional privacy-friendly usage tracking
- **Local Storage API**: Settings and session persistence
- **Fetch API**: HTTP requests for book loading and search

## License

MIT License