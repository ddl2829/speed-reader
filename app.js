class SpeedReader {
    constructor() {
        this.words = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.intervalId = null;
        this.currentWPM = 250;
        this.mode = 'manual';
        this.practiceStartSpeed = 200;
        this.practiceRampRate = 10;
        this.practiceStartTime = null;
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
        
        this.initializeElements();
        this.loadSettings();
        this.attachEventListeners();
        this.initializePDFJS();
    }

    initializeElements() {
        // Display elements
        this.wordDisplay = document.getElementById('currentWord');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.progressBar = document.getElementById('progressFill');
        this.wordCount = document.getElementById('wordCount');
        this.timeRemaining = document.getElementById('timeRemaining');
        
        // Controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.loadTextBtn = document.getElementById('loadTextBtn');
        this.pdfInput = document.getElementById('pdfInput');
        this.uploadStatus = document.getElementById('uploadStatus');
        
        // Settings
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.fontSizeSlider = document.getElementById('fontSizeSlider');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.themeSelect = document.getElementById('themeSelect');
        this.fontSelect = document.getElementById('fontSelect');
        this.highlightCenterCheck = document.getElementById('highlightCenter');
        this.pausePunctuationCheck = document.getElementById('showPunctuation');
        
        // Sidebar
        this.textSidebar = document.getElementById('textSidebar');
        this.closeSidebarBtn = document.getElementById('closeSidebarBtn');
        this.fullText = document.getElementById('fullText');
        
        // Practice mode
        this.practiceOptions = document.getElementById('practiceOptions');
        this.startSpeedInput = document.getElementById('startSpeed');
        this.rampRateInput = document.getElementById('rampRate');
        
        // Library
        this.libraryBtn = document.getElementById('libraryBtn');
        this.searchInput = document.getElementById('searchInput');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.bookList = document.getElementById('bookList');
    }

    attachEventListeners() {
        // Help section toggle
        const helpToggle = document.getElementById('helpToggle');
        const helpSection = document.getElementById('helpSection');
        if (helpToggle && helpSection) {
            helpToggle.addEventListener('click', () => {
                helpSection.classList.toggle('expanded');
                // Save preference
                const isExpanded = helpSection.classList.contains('expanded');
                localStorage.setItem('helpExpanded', isExpanded);
            });
            
            // Load preference
            const savedExpanded = localStorage.getItem('helpExpanded');
            if (savedExpanded === 'true') {
                helpSection.classList.add('expanded');
            }
        }
        
        // Playback controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousWord());
        this.nextBtn.addEventListener('click', () => this.nextWord());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Speed control
        this.speedSlider.addEventListener('input', (e) => {
            this.currentWPM = parseInt(e.target.value);
            this.speedValue.textContent = this.currentWPM;
            if (this.isPlaying && this.mode === 'manual') {
                this.stop();
                this.play();
            }
        });
        
        // Mode toggle
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.practiceOptions.classList.toggle('hidden', this.mode !== 'practice');
                if (this.mode === 'practice') {
                    this.practiceStartSpeed = parseInt(this.startSpeedInput.value);
                    this.practiceRampRate = parseInt(this.rampRateInput.value);
                }
            });
        });
        
        // Practice mode settings
        this.startSpeedInput.addEventListener('change', (e) => {
            this.practiceStartSpeed = parseInt(e.target.value);
        });
        
        this.rampRateInput.addEventListener('change', (e) => {
            this.practiceRampRate = parseInt(e.target.value);
        });
        
        // Text input
        this.loadTextBtn.addEventListener('click', () => {
            const text = this.textInput.value.trim();
            if (text) {
                this.loadText(text);
                this.saveToHistory('manual', text.substring(0, 100) + '...');
            }
        });
        
        // PDF upload
        this.pdfInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                this.loadPDF(file);
            }
        });
        
        // Drag and drop for PDF
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'var(--sidebar-bg)';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.loadPDF(file);
            }
        });
        
        // Settings
        this.settingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.add('open');
            this.displayCustomThemes(); // Display custom themes
            this.updateSettingsUI(); // Update UI when modal opens
        });
        
        this.closeSettingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.remove('open');
        });
        
        this.fontSizeSlider.addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            this.fontSizeValue.textContent = this.settings.fontSize + 'px';
            this.applySettings();
        });
        
        // Theme presets
        document.querySelectorAll('.theme-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = btn.dataset.preset;
                this.settings.theme = theme;
                
                // Update custom colors to match the preset
                this.updateCustomColorsFromTheme(theme);
                
                this.applySettings();
                this.updateSettingsUI();
            });
        });
        
        // Font selection
        document.querySelectorAll('.font-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const font = btn.dataset.font;
                this.settings.fontFamily = font;
                this.applySettings();
                this.updateSettingsUI();
            });
        });
        
        // Color pickers
        this.initializeColorPickers();
        
        // Legacy theme select (if still exists)
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.applySettings();
            });
        }
        
        // Legacy font select (if still exists)
        if (this.fontSelect) {
            this.fontSelect.addEventListener('change', (e) => {
                this.settings.fontFamily = e.target.value;
                this.applySettings();
            });
        }
        
        this.highlightCenterCheck.addEventListener('change', (e) => {
            this.settings.highlightCenter = e.target.checked;
            this.applySettings();
        });
        
        this.pausePunctuationCheck.addEventListener('change', (e) => {
            this.settings.pauseOnPunctuation = e.target.checked;
        });
        
        // Sidebar - both library button and text button open it
        this.libraryBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Close sidebar button
        if (this.closeSidebarBtn) {
            this.closeSidebarBtn.addEventListener('click', () => {
                this.textSidebar.classList.remove('open');
            });
        }
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Library
        this.searchInput.addEventListener('input', () => this.searchBooks());
        this.categoryFilter.addEventListener('change', () => this.filterBooks());
        
        // Search Gutenberg button
        const searchGutenbergBtn = document.getElementById('searchGutenbergBtn');
        if (searchGutenbergBtn) {
            searchGutenbergBtn.addEventListener('click', () => {
                const query = this.searchInput.value.trim();
                if (query) {
                    this.searchGutenberg(query);
                } else {
                    this.loadLibrary(); // Load default books if no query
                }
            });
            
            // Also search when Enter is pressed in search input
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = this.searchInput.value.trim();
                    if (query) {
                        this.searchGutenberg(query);
                    }
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    this.previousWord();
                    break;
                case 'ArrowRight':
                    this.nextWord();
                    break;
                case 'r':
                    this.reset();
                    break;
                case 's':
                    this.toggleSidebar();
                    break;
            }
        });
        
        // Load library on tab switch
        let libraryLoaded = false;
        document.querySelector('[data-tab="library"]').addEventListener('click', () => {
            if (!libraryLoaded) {
                this.loadLibrary();
                libraryLoaded = true;
            }
        });
    }

    loadText(text) {
        // Store original text for sidebar display
        this.originalText = text;
        
        // Clean and process text for word display
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        this.words = cleanedText.split(' ').filter(word => word.length > 0);
        this.currentIndex = 0;
        this.updateDisplay();
        this.updateProgress();
        
        // Show in sidebar if open
        if (this.textSidebar.classList.contains('open')) {
            this.displayFullText();
        }
        
        // Save position
        this.savePosition();
    }

    async loadPDF(file) {
        this.uploadStatus.textContent = 'Loading PDF...';
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + ' ';
            }
            
            this.loadText(fullText);
            this.uploadStatus.textContent = `Loaded ${pdf.numPages} pages`;
            this.saveToHistory('pdf', file.name);
            
            setTimeout(() => {
                this.uploadStatus.textContent = '';
            }, 3000);
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.uploadStatus.textContent = 'Error loading PDF';
        }
    }

    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    play() {
        if (this.words.length === 0) return;
        
        this.isPlaying = true;
        this.playPauseBtn.textContent = '⏸️ Pause';
        
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
            this.displayWord(word);
            this.currentIndex++;
            this.updateProgress();
            
            // Calculate delay
            let delay = 60000 / this.currentWPM;
            
            // Add extra delay for punctuation
            if (this.settings.pauseOnPunctuation && /[.!?;]/.test(word)) {
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
                this.speedValue.textContent = this.currentWPM;
                this.speedSlider.value = this.currentWPM;
            }
            
            this.intervalId = setTimeout(showNextWord, delay);
        };
        
        showNextWord();
    }

    stop() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶️ Start';
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        this.savePosition();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    previousWord() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayWord(this.words[this.currentIndex]);
            this.updateProgress();
        }
    }

    nextWord() {
        if (this.currentIndex < this.words.length - 1) {
            this.currentIndex++;
            this.displayWord(this.words[this.currentIndex]);
            this.updateProgress();
        }
    }

    reset() {
        this.stop();
        this.currentIndex = 0;
        if (this.words.length > 0) {
            this.displayWord(this.words[0]);
        } else {
            this.wordDisplay.textContent = 'Welcome';
        }
        this.updateProgress();
    }
    
    toggleSidebar() {
        if (!this.textSidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        this.textSidebar.classList.toggle('open');
        
        // If opening and we have text, display it
        if (this.textSidebar.classList.contains('open') && this.words.length > 0) {
            this.displayFullText();
        }
    }

    displayWord(word) {
        if (this.settings.highlightCenter && word.length > 1) {
            const centerIndex = Math.floor(word.length / 2);
            const before = word.substring(0, centerIndex);
            const center = word[centerIndex];
            const after = word.substring(centerIndex + 1);
            this.wordDisplay.innerHTML = `${before}<span style="color: var(--primary-color)">${center}</span>${after}`;
        } else {
            this.wordDisplay.textContent = word;
        }
        
        // Update sidebar highlight if open
        if (this.textSidebar.classList.contains('open')) {
            this.highlightCurrentWord();
        }
    }

    updateProgress() {
        const progress = this.words.length > 0 ? (this.currentIndex / this.words.length) * 100 : 0;
        this.progressBar.style.width = progress + '%';
        this.wordCount.textContent = `${this.currentIndex} / ${this.words.length} words`;
        
        // Calculate time remaining
        if (this.words.length > 0 && this.currentIndex < this.words.length) {
            const wordsRemaining = this.words.length - this.currentIndex;
            const minutesRemaining = wordsRemaining / this.currentWPM;
            const seconds = Math.round(minutesRemaining * 60);
            const displayMinutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            this.timeRemaining.textContent = `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')} remaining`;
        } else {
            this.timeRemaining.textContent = '0:00 remaining';
        }
    }

    displayFullText() {
        if (!this.fullText) {
            console.error('Full text element not found');
            return;
        }
        
        this.fullText.innerHTML = '';
        
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
                        this.currentIndex = index;
                        this.displayWord(word);
                        this.updateProgress();
                        this.highlightCurrentWord();
                    });
                    this.fullText.appendChild(span);
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
                        this.currentIndex = index;
                        this.displayWord(this.words[index]);
                        this.updateProgress();
                        this.highlightCurrentWord();
                    });
                    
                    paragraphDiv.appendChild(span);
                    wordIndex++;
                }
            });
            
            this.fullText.appendChild(paragraphDiv);
        });
    }

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

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    async loadLibrary() {
        this.bookList.innerHTML = '<div class="loading">Loading books from Project Gutenberg...</div>';
        
        try {
            // Use Gutendex API (a free API for Project Gutenberg)
            const response = await fetch('https://gutendex.com/books/?mime_type=text%2Fplain&languages=en&copyright=false&page=1');
            const data = await response.json();
            
            // Transform the data to our format
            this.books = data.results.map(book => ({
                id: book.id,
                title: book.title,
                author: book.authors.length > 0 ? book.authors[0].name : 'Unknown',
                subjects: book.subjects,
                formats: book.formats,
                category: this.categorizeBook(book.subjects || [])
            }));
            
            this.allBooks = this.books; // Store all books for filtering
            this.displayBooks(this.books);
        } catch (error) {
            console.error('Error loading library:', error);
            // Fallback to curated popular books if API fails
            this.loadFallbackBooks();
        }
    }
    
    categorizeBook(subjects) {
        const subjectsLower = subjects.join(' ').toLowerCase();
        if (subjectsLower.includes('fiction') || subjectsLower.includes('novel') || subjectsLower.includes('stories')) {
            return 'fiction';
        } else if (subjectsLower.includes('science') || subjectsLower.includes('biology') || subjectsLower.includes('physics')) {
            return 'science';
        } else if (subjectsLower.includes('history') || subjectsLower.includes('historical')) {
            return 'history';
        } else if (subjectsLower.includes('philosophy') || subjectsLower.includes('ethics')) {
            return 'philosophy';
        }
        return 'other';
    }
    
    loadFallbackBooks() {
        // Curated list with correct IDs that actually work
        const fallbackBooks = [
            { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', category: 'fiction' },
            { id: 2701, title: 'Moby Dick', author: 'Herman Melville', category: 'fiction' },
            { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'fiction' },
            { id: 11, title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll', category: 'fiction' },
            { id: 84, title: 'Frankenstein', author: 'Mary Shelley', category: 'fiction' },
            { id: 844, title: 'The Importance of Being Earnest', author: 'Oscar Wilde', category: 'fiction' },
            { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', category: 'fiction' },
            { id: 1232, title: 'The Prince', author: 'Niccolò Machiavelli', category: 'philosophy' },
            { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', category: 'fiction' },
            { id: 345, title: 'Dracula', author: 'Bram Stoker', category: 'fiction' }
        ];
        
        this.books = fallbackBooks;
        this.allBooks = fallbackBooks;
        this.displayBooks(this.books);
    }

    displayBooks(books) {
        this.bookList.innerHTML = '';
        books.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.className = 'book-item';
            bookItem.innerHTML = `
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
            `;
            bookItem.addEventListener('click', () => this.loadBookFromGutenberg(book.id, book.title));
            this.bookList.appendChild(bookItem);
        });
    }

    async loadBookFromGutenberg(bookId, title) {
        this.bookList.innerHTML = '<div class="loading">Loading book text...</div>';
        
        try {
            // Try multiple URL patterns for Project Gutenberg
            const urlPatterns = [
                `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
                `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`,
                `https://www.gutenberg.org/ebooks/${bookId}.txt.utf-8`
            ];
            
            let text = null;
            let successUrl = null;
            
            // Try each URL pattern
            for (const url of urlPatterns) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        text = await response.text();
                        successUrl = url;
                        break;
                    }
                } catch (err) {
                    console.log(`Failed to fetch from ${url}`, err);
                }
            }
            
            // If direct fetch fails, try using a CORS proxy
            if (!text) {
                const corsProxy = 'https://corsproxy.io/?';
                const gutenbergUrl = `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`;
                const response = await fetch(corsProxy + encodeURIComponent(gutenbergUrl));
                if (response.ok) {
                    text = await response.text();
                    successUrl = 'CORS proxy';
                }
            }
            
            if (text) {
                // Clean up the text - remove Project Gutenberg headers/footers
                const startMarkers = ['*** START OF THE PROJECT GUTENBERG', '*** START OF THIS PROJECT GUTENBERG', '*END*THE SMALL PRINT!'];
                const endMarkers = ['*** END OF THE PROJECT GUTENBERG', '*** END OF THIS PROJECT GUTENBERG', 'End of the Project Gutenberg'];
                
                let cleanText = text;
                
                // Find and remove header
                for (const marker of startMarkers) {
                    const startIndex = cleanText.indexOf(marker);
                    if (startIndex !== -1) {
                        const endOfLine = cleanText.indexOf('\n', startIndex);
                        cleanText = cleanText.substring(endOfLine + 1);
                        break;
                    }
                }
                
                // Find and remove footer
                for (const marker of endMarkers) {
                    const endIndex = cleanText.indexOf(marker);
                    if (endIndex !== -1) {
                        cleanText = cleanText.substring(0, endIndex);
                        break;
                    }
                }
                
                this.loadText(cleanText);
                this.saveToHistory('gutenberg', title);
                this.switchTab('paste'); // Switch to reading view
                this.bookList.innerHTML = `<div class="loading">Loaded: ${title}</div>`;
                setTimeout(() => this.displayBooks(this.books), 2000);
            } else {
                throw new Error('Could not fetch book text');
            }
        } catch (error) {
            console.error('Error loading book:', error);
            this.bookList.innerHTML = '<div class="loading">Error loading book. Some books may not be available due to format or server issues. Please try another book.</div>';
            setTimeout(() => this.displayBooks(this.books), 3000);
        }
    }

    searchBooks() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const category = this.categoryFilter.value;
        
        let filtered = this.allBooks || this.books;
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(book => 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (category) {
            filtered = filtered.filter(book => book.category === category);
        }
        
        this.displayBooks(filtered);
    }

    filterBooks() {
        this.searchBooks(); // Use unified search/filter
    }
    
    async searchGutenberg(query) {
        try {
            this.bookList.innerHTML = '<div class="loading">Searching Project Gutenberg...</div>';
            const response = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}&mime_type=text%2Fplain&languages=en`);
            const data = await response.json();
            
            this.books = data.results.map(book => ({
                id: book.id,
                title: book.title,
                author: book.authors.length > 0 ? book.authors[0].name : 'Unknown',
                subjects: book.subjects,
                formats: book.formats,
                category: this.categorizeBook(book.subjects || [])
            }));
            
            this.allBooks = this.books;
            this.displayBooks(this.books);
        } catch (error) {
            console.error('Search error:', error);
            this.bookList.innerHTML = '<div class="loading">Search failed. Please try again.</div>';
        }
    }

    initializeColorPickers() {
        // Background color
        const bgPicker = document.getElementById('bgColorPicker');
        const bgText = document.getElementById('bgColorText');
        if (bgPicker && bgText) {
            bgPicker.addEventListener('input', (e) => {
                bgText.value = e.target.value;
                this.settings.customColors.background = e.target.value;
                this.applyCustomColors();
            });
            bgText.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    bgPicker.value = e.target.value;
                    this.settings.customColors.background = e.target.value;
                    this.applyCustomColors();
                }
            });
        }
        
        // Text color
        const textPicker = document.getElementById('textColorPicker');
        const textColorText = document.getElementById('textColorText');
        if (textPicker && textColorText) {
            textPicker.addEventListener('input', (e) => {
                textColorText.value = e.target.value;
                this.settings.customColors.text = e.target.value;
                this.applyCustomColors();
            });
            textColorText.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    textPicker.value = e.target.value;
                    this.settings.customColors.text = e.target.value;
                    this.applyCustomColors();
                }
            });
        }
        
        // Accent color
        const accentPicker = document.getElementById('accentColorPicker');
        const accentText = document.getElementById('accentColorText');
        if (accentPicker && accentText) {
            accentPicker.addEventListener('input', (e) => {
                accentText.value = e.target.value;
                this.settings.customColors.accent = e.target.value;
                this.applyCustomColors();
            });
            accentText.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    accentPicker.value = e.target.value;
                    this.settings.customColors.accent = e.target.value;
                    this.applyCustomColors();
                }
            });
        }
        
        // Display background color
        const displayBgPicker = document.getElementById('displayBgColorPicker');
        const displayBgText = document.getElementById('displayBgColorText');
        if (displayBgPicker && displayBgText) {
            displayBgPicker.addEventListener('input', (e) => {
                displayBgText.value = e.target.value;
                this.settings.customColors.displayBg = e.target.value;
                this.applyCustomColors();
            });
            displayBgText.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    displayBgPicker.value = e.target.value;
                    this.settings.customColors.displayBg = e.target.value;
                    this.applyCustomColors();
                }
            });
        }
        
        // Border color
        const borderPicker = document.getElementById('borderColorPicker');
        const borderText = document.getElementById('borderColorText');
        if (borderPicker && borderText) {
            borderPicker.addEventListener('input', (e) => {
                borderText.value = e.target.value;
                this.settings.customColors.border = e.target.value;
                this.applyCustomColors();
            });
            borderText.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    borderPicker.value = e.target.value;
                    this.settings.customColors.border = e.target.value;
                    this.applyCustomColors();
                }
            });
        }
        
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
    
    applyCustomColors() {
        this.settings.theme = 'custom';
        document.body.dataset.theme = 'custom';
        
        // Apply custom colors as CSS variables
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
        
        this.saveSettings();
    }
    
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
    
    loadCustomThemes() {
        const saved = localStorage.getItem('speedReaderCustomThemes');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveCustomThemes() {
        localStorage.setItem('speedReaderCustomThemes', JSON.stringify(this.customThemes));
    }
    
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
                    this.settings.theme = 'light';
                    this.applySettings();
                    this.updateSettingsUI();
                }
            }
        }
    }
    
    displayCustomThemes() {
        const customThemesSection = document.getElementById('customThemesSection');
        const customThemesList = document.getElementById('customThemesList');
        
        if (!customThemesList) return;
        
        // Clear existing custom themes
        customThemesList.innerHTML = '';
        
        // Show/hide the section based on whether there are custom themes
        const hasCustomThemes = Object.keys(this.customThemes).length > 0;
        if (customThemesSection) {
            customThemesSection.style.display = hasCustomThemes ? 'block' : 'none';
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
                this.settings.theme = themeId;
                this.settings.customColors = { ...theme.colors };
                this.applySettings();
                this.updateSettingsUI();
            });
            
            customThemesList.appendChild(button);
        });
    }
    
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
    
    updateSettingsUI() {
        // Update theme preset buttons
        document.querySelectorAll('.theme-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === this.settings.theme);
        });
        
        // Update font option buttons
        document.querySelectorAll('.font-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.font === this.settings.fontFamily);
        });
        
        // Always update color pickers to show current theme colors
        const bgPicker = document.getElementById('bgColorPicker');
        const bgText = document.getElementById('bgColorText');
        if (bgPicker) bgPicker.value = this.settings.customColors.background;
        if (bgText) bgText.value = this.settings.customColors.background;
        
        const textPicker = document.getElementById('textColorPicker');
        const textColorText = document.getElementById('textColorText');
        if (textPicker) textPicker.value = this.settings.customColors.text;
        if (textColorText) textColorText.value = this.settings.customColors.text;
        
        const accentPicker = document.getElementById('accentColorPicker');
        const accentText = document.getElementById('accentColorText');
        if (accentPicker) accentPicker.value = this.settings.customColors.accent;
        if (accentText) accentText.value = this.settings.customColors.accent;
        
        const displayBgPicker = document.getElementById('displayBgColorPicker');
        const displayBgText = document.getElementById('displayBgColorText');
        if (displayBgPicker) displayBgPicker.value = this.settings.customColors.displayBg;
        if (displayBgText) displayBgText.value = this.settings.customColors.displayBg;
        
        const borderPicker = document.getElementById('borderColorPicker');
        const borderText = document.getElementById('borderColorText');
        if (borderPicker) borderPicker.value = this.settings.customColors.border || '#e5e7eb';
        if (borderText) borderText.value = this.settings.customColors.border || '#e5e7eb';
    }
    
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
        
        // Reset UI elements
        this.fontSizeSlider.value = 48;
        this.fontSizeValue.textContent = '48px';
        this.highlightCenterCheck.checked = false;
        this.pausePunctuationCheck.checked = true;
        
        // Apply and save
        this.applySettings();
        this.updateSettingsUI();
        
        // Clear custom CSS properties
        const root = document.documentElement;
        root.style.removeProperty('--bg-color');
        root.style.removeProperty('--text-color');
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--word-display-bg');
        root.style.removeProperty('--sidebar-bg');
        root.style.removeProperty('--border-color');
    }
    
    applySettings() {
        // Apply theme
        if (this.settings.theme.startsWith('custom-')) {
            document.body.dataset.theme = 'custom';
            this.applyCustomColors();
        } else {
            document.body.dataset.theme = this.settings.theme;
        }
        
        // Apply custom colors if custom theme
        if (this.settings.theme === 'custom' || this.settings.theme.startsWith('custom-')) {
            this.applyCustomColors();
        } else {
            // Clear custom CSS properties
            const root = document.documentElement;
            root.style.removeProperty('--bg-color');
            root.style.removeProperty('--text-color');
            root.style.removeProperty('--primary-color');
            root.style.removeProperty('--word-display-bg');
            root.style.removeProperty('--sidebar-bg');
            root.style.removeProperty('--border-color');
        }
        
        // Apply font settings
        this.wordDisplay.style.fontSize = this.settings.fontSize + 'px';
        this.wordDisplay.style.fontFamily = this.settings.fontFamily;
        
        // Apply highlight center
        document.body.classList.toggle('highlight-center', this.settings.highlightCenter);
        
        // Save settings
        this.saveSettings();
    }

    saveSettings() {
        localStorage.setItem('speedReaderSettings', JSON.stringify(this.settings));
    }

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
            this.applySettings();
            
            // Update UI
            this.fontSizeSlider.value = this.settings.fontSize;
            this.fontSizeValue.textContent = this.settings.fontSize + 'px';
            if (this.themeSelect) this.themeSelect.value = this.settings.theme;
            if (this.fontSelect) this.fontSelect.value = this.settings.fontFamily;
            this.highlightCenterCheck.checked = this.settings.highlightCenter;
            this.pausePunctuationCheck.checked = this.settings.pauseOnPunctuation;
            
            // Update new UI elements
            this.updateSettingsUI();
        }
    }

    savePosition() {
        if (this.words.length > 0) {
            const position = {
                text: this.words.join(' '),
                index: this.currentIndex,
                timestamp: Date.now()
            };
            localStorage.setItem('speedReaderPosition', JSON.stringify(position));
        }
    }

    loadPosition() {
        const saved = localStorage.getItem('speedReaderPosition');
        if (saved) {
            const position = JSON.parse(saved);
            // Only restore if less than 24 hours old
            if (Date.now() - position.timestamp < 86400000) {
                this.loadText(position.text);
                this.currentIndex = position.index;
                this.updateDisplay();
                this.updateProgress();
            }
        }
    }

    saveToHistory(type, title) {
        let history = JSON.parse(localStorage.getItem('speedReaderHistory') || '[]');
        history.unshift({
            type,
            title,
            timestamp: Date.now()
        });
        // Keep only last 10 items
        history = history.slice(0, 10);
        localStorage.setItem('speedReaderHistory', JSON.stringify(history));
    }

    updateDisplay() {
        if (this.words.length > 0 && this.currentIndex < this.words.length) {
            this.displayWord(this.words[this.currentIndex]);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SpeedReader();
    
    // Load saved position if exists
    app.loadPosition();
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
});