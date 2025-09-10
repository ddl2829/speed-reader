/**
 * LibraryManager - Handles Project Gutenberg integration and book management
 * 
 * Responsibilities:
 * - Project Gutenberg book search and loading
 * - Popular books curation and display
 * - Book categorization and filtering
 * - Text fetching with fallback strategies
 * - Library UI management
 */
class LibraryManager {
    constructor(textProcessor) {
        this.textProcessor = textProcessor;
        this.books = [];
        this.allBooks = [];
        this.elements = {};
        this.onBookLoad = null; // Callback for when a book is loaded
        this.onStatusUpdate = null; // Callback for status updates
        
        this.initializeElements();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.categoryFilter = document.getElementById('categoryFilter');
        this.elements.bookList = document.getElementById('bookList');
        this.elements.searchGutenbergBtn = document.getElementById('searchGutenbergBtn');
    }

    /**
     * Load and display the library with popular books
     */
    async loadLibrary() {
        this.updateBookList('<div class="loading">Loading popular titles...</div>');
        
        // Load hardcoded popular titles for fast initial display
        this.books = this.getPopularBooks();
        this.allBooks = this.books;
        this.displayBooks(this.books);
    }

    /**
     * Get curated list of popular books
     * @returns {Array} Array of popular book objects
     */
    getPopularBooks() {
        return [
            {
                id: 2701,
                title: "Moby Dick; Or, The Whale",
                author: "Herman Melville",
                category: "fiction",
                subjects: ["Fiction", "Adventure stories", "Whales -- Fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/2701/2701-0.txt` }
            },
            {
                id: 84,
                title: "Frankenstein; Or, The Modern Prometheus",
                author: "Mary Wollstonecraft Shelley",
                category: "fiction",
                subjects: ["Fiction", "Gothic fiction", "Science fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/84/84-0.txt` }
            },
            {
                id: 1513,
                title: "Romeo and Juliet",
                author: "William Shakespeare",
                category: "fiction",
                subjects: ["Fiction", "Tragedies", "Drama"],
                formats: { "text/plain": `https://www.gutenberg.org/files/1513/1513-0.txt` }
            },
            {
                id: 1342,
                title: "Pride and Prejudice",
                author: "Jane Austen",
                category: "fiction",
                subjects: ["Fiction", "Romance", "England -- Fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/1342/1342-0.txt` }
            },
            {
                id: 2641,
                title: "A Room with a View",
                author: "E. M. Forster",
                category: "fiction",
                subjects: ["Fiction", "British -- Italy -- Fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/2641/2641-0.txt` }
            },
            {
                id: 100,
                title: "The Complete Works of William Shakespeare",
                author: "William Shakespeare",
                category: "fiction",
                subjects: ["Fiction", "Drama", "Poetry"],
                formats: { "text/plain": `https://www.gutenberg.org/files/100/100-0.txt` }
            },
            {
                id: 145,
                title: "Middlemarch",
                author: "George Eliot",
                category: "fiction",
                subjects: ["Fiction", "England -- Fiction", "Bildungsromans"],
                formats: { "text/plain": `https://www.gutenberg.org/files/145/145-0.txt` }
            },
            {
                id: 11,
                title: "Alice's Adventures in Wonderland",
                author: "Lewis Carroll",
                category: "fiction",
                subjects: ["Fiction", "Fantasy fiction", "Children's stories"],
                formats: { "text/plain": `https://www.gutenberg.org/files/11/11-0.txt` }
            },
            {
                id: 37106,
                title: "Little Women; Or, Meg, Jo, Beth, and Amy",
                author: "Louisa May Alcott",
                category: "fiction",
                subjects: ["Fiction", "Family -- Fiction", "Sisters -- Fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/37106/37106-0.txt` }
            },
            {
                id: 1661,
                title: "The Adventures of Sherlock Holmes",
                author: "Arthur Conan Doyle",
                category: "fiction",
                subjects: ["Fiction", "Mystery fiction", "Detective stories"],
                formats: { "text/plain": `https://www.gutenberg.org/files/1661/1661-0.txt` }
            },
            {
                id: 74,
                title: "The Adventures of Tom Sawyer",
                author: "Mark Twain",
                category: "fiction",
                subjects: ["Fiction", "Adventure stories", "Boys -- Fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/74/74-0.txt` }
            },
            {
                id: 1260,
                title: "Jane Eyre: An Autobiography",
                author: "Charlotte Brontë",
                category: "fiction",
                subjects: ["Fiction", "Gothic fiction", "Orphans -- Fiction"],
                formats: { "text/plain": `https://www.gutenberg.org/files/1260/1260-0.txt` }
            }
        ];
    }

    /**
     * Display books in the library UI
     * @param {Array} books - Array of book objects to display
     */
    displayBooks(books) {
        if (!this.elements.bookList) return;
        
        this.elements.bookList.innerHTML = '';
        books.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.className = 'book-item';
            bookItem.innerHTML = `
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
            `;
            bookItem.addEventListener('click', () => this.loadBookFromGutenberg(book.id, book.title));
            this.elements.bookList.appendChild(bookItem);
        });
    }

    /**
     * Update book list HTML content
     * @param {string} html - HTML content to display
     */
    updateBookList(html) {
        if (this.elements.bookList) {
            this.elements.bookList.innerHTML = html;
        }
    }

    /**
     * Load a book from Project Gutenberg by ID
     * @param {number} bookId - Project Gutenberg book ID
     * @param {string} title - Book title for display
     */
    async loadBookFromGutenberg(bookId, title) {
        this.updateBookList('<div class="loading">Loading book text...</div>');
        
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
                // Process the text using TextProcessor
                const processedData = this.textProcessor.processGutenbergText(text, {
                    title: title,
                    bookId: bookId
                });
                
                // Notify that book is loaded
                if (this.onBookLoad) {
                    this.onBookLoad(processedData, title);
                }
                
                // Update status and restore book list
                this.updateBookList(`<div class="loading">Loaded: ${title}</div>`);
                setTimeout(() => this.displayBooks(this.books), 2000);
            } else {
                throw new Error('Could not fetch book text');
            }
        } catch (error) {
            console.error('Error loading book:', error);
            this.updateBookList('<div class="loading">Error loading book. Some books may not be available due to format or server issues. Please try another book.</div>');
            setTimeout(() => this.displayBooks(this.books), 3000);
        }
    }

    /**
     * Search Project Gutenberg for books
     * @param {string} query - Search query
     */
    async searchGutenberg(query) {
        try {
            this.updateBookList('<div class="loading">Searching Project Gutenberg...</div>');
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
            this.updateBookList('<div class="loading">Search failed. Please try again.</div>');
        }
    }

    /**
     * Search books within current library
     */
    searchBooks() {
        if (!this.elements.searchInput || !this.elements.categoryFilter) return;
        
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const category = this.elements.categoryFilter.value;
        
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

    /**
     * Filter books by category
     */
    filterBooks() {
        this.searchBooks(); // Use unified search/filter
    }

    /**
     * Categorize a book based on its subjects
     * @param {Array} subjects - Array of subject strings
     * @returns {string} Category name
     */
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

    /**
     * Load fallback books if API fails
     */
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

    /**
     * Setup event listeners for library functionality
     */
    setupEventListeners() {
        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => this.searchBooks());
            
            // Also search when Enter is pressed
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = this.elements.searchInput.value.trim();
                    if (query) {
                        this.searchGutenberg(query);
                    }
                }
            });
        }
        
        // Category filter
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', () => this.filterBooks());
        }
        
        // Search Gutenberg button
        if (this.elements.searchGutenbergBtn) {
            this.elements.searchGutenbergBtn.addEventListener('click', () => {
                const query = this.elements.searchInput ? this.elements.searchInput.value.trim() : '';
                if (query) {
                    this.searchGutenberg(query);
                } else {
                    this.loadLibrary(); // Load default books if no query
                }
            });
        }
    }

    /**
     * Get current books
     * @returns {Array} Current books array
     */
    getBooks() {
        return [...this.books];
    }

    /**
     * Get all books (unfiltered)
     * @returns {Array} All books array
     */
    getAllBooks() {
        return [...this.allBooks];
    }
}