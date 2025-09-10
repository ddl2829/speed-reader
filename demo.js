/**
 * Speed Reader Demo Script
 * 
 * Playwright script that demonstrates the key features of the Speed Reader application.
 * Designed to create a comprehensive demo video/GIF showing:
 * - Loading text from different sources
 * - Using the reading controls (font size, highlighting, etc.)
 * - Speed reading functionality
 * - Theme customization
 * - Sidebar navigation
 */

const { chromium } = require('playwright');

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        recordVideo: { dir: './demo-recording/', size: { width: 1200, height: 800 } }
    });
    
    const page = await context.newPage();
    
    try {
        console.log('🎬 Starting Speed Reader Demo...');
        
        // Navigate to the application
        await page.goto('http://localhost:8080');
        await wait(1500);
        
        console.log('📝 Switching to Load Text tab...');
        // Switch to input tab to load text
        await page.click('[data-tab="input"]');
        await wait(1000);
        
        console.log('✍️ Loading sample text...');
        // Add some sample text
        const sampleText = `Speed reading is a collection of reading methods which attempt to increase rates of reading without substantially reducing comprehension or retention. Methods include chunking and eliminating subvocalization. The many available speed-reading training programs include books, videos, software, and seminars. Speed reading claims have been met with skepticism by the scientific community.`;
        
        await page.fill('#textInput', sampleText);
        await wait(1000);
        
        // Load the text
        await page.click('#loadTextBtn');
        await wait(1500);
        
        console.log('📖 Opening sidebar to show full text...');
        // Open sidebar to show full text view
        await page.click('#sidebarToggleBtn');
        await wait(1000);
        
        console.log('⚡ Setting speed to 500 WPM...');
        // Set speed to 500 WPM
        await page.locator('#speedSlider').fill('500');
        await wait(1000);
        
        console.log('▶️ Starting speed reading demo at 500 WPM...');
        // Start reading
        await page.click('#playPauseBtn');
        await wait(5000); // Let it read for 5 seconds at 500 WPM
        
        console.log('🎉 Demo completed successfully!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        await wait(3000); // Extra time to see final state
        await context.close();
        await browser.close();
    }
}

// Check if this is being run directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { runDemo };