/**
 * TextProcessor - Handles text loading, cleaning, and preparation for RSVP display
 * 
 * Responsibilities:
 * - Text input processing and cleaning
 * - PDF file loading and text extraction
 * - Text formatting and word array preparation
 * - Original text preservation for sidebar display
 */
class TextProcessor {
    constructor(analytics) {
        this.analytics = analytics;
        this.initializePDFJS();
    }

    /**
     * Initialize PDF.js library with worker configuration
     */
    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Load and prepare text for RSVP display
     * @param {string} text - The text to be displayed
     * @param {Object} metadata - Optional metadata about the text source
     * @returns {Object} - Processed text data with words array and original text
     */
    processText(text, metadata = {}) {
        // Store original text for sidebar display
        const originalText = text;
        
        // Clean and process text for word display
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        const words = cleanedText.split(' ').filter(word => word.length > 0);
        
        // Track text loading method - only analytics we collect  
        if (this.analytics && metadata.method) {
            this.analytics.trackTextLoad(metadata.method);
        }
        
        return {
            words,
            originalText,
            metadata
        };
    }

    /**
     * Load and extract text from PDF file
     * @param {File} file - PDF file to process
     * @param {Function} statusCallback - Callback for status updates
     * @returns {Promise<Object>} - Processed PDF text data
     */
    async loadPDF(file, statusCallback) {
        if (statusCallback) statusCallback('Loading PDF...');
        
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
            
            const processedData = this.processText(fullText, { 
                method: 'pdf_upload', 
                source: 'pdf_file',
                title: file.name,
                pages: pdf.numPages
            });

            if (statusCallback) statusCallback(`Loaded ${pdf.numPages} pages`);
            
            return {
                ...processedData,
                statusMessage: `Loaded ${pdf.numPages} pages`,
                fileName: file.name
            };
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw new Error('Error loading PDF');
        }
    }

    /**
     * Clean Project Gutenberg text by removing headers and footers
     * @param {string} text - Raw Project Gutenberg text
     * @returns {string} - Cleaned text
     */
    cleanGutenbergText(text) {
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
        
        return cleanText;
    }

    /**
     * Load text from Project Gutenberg with cleaning
     * @param {string} rawText - Raw text from Project Gutenberg
     * @param {Object} metadata - Book metadata
     * @returns {Object} - Processed text data
     */
    processGutenbergText(rawText, metadata = {}) {
        const cleanedText = this.cleanGutenbergText(rawText);
        
        return this.processText(cleanedText, {
            method: 'project_gutenberg',
            source: 'gutenberg_library',
            ...metadata
        });
    }
}