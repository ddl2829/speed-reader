const { test, expect } = require('@playwright/test');

test.describe('Speed Reader Application', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to initialize
    await page.waitForSelector('.main-tabs');
  });

  test.describe('Tab Navigation', () => {
    
    test('should show help tab by default', async ({ page }) => {
      // Verify help tab is active by default
      await expect(page.locator('.main-tab-btn[data-tab="help"]')).toHaveClass(/active/);
      await expect(page.locator('#helpPanel')).toHaveClass(/active/);
      
      // Verify help content is visible
      await expect(page.locator('h2').filter({ hasText: 'Welcome to Speed Reader!' })).toBeVisible();
      await expect(page.locator('h3').filter({ hasText: 'What is RSVP?' })).toBeVisible();
    });

    test('should switch between tabs correctly', async ({ page }) => {
      // Switch to Load Text tab
      await page.click('.main-tab-btn[data-tab="input"]');
      await expect(page.locator('.main-tab-btn[data-tab="input"]')).toHaveClass(/active/);
      await expect(page.locator('#inputPanel')).toHaveClass(/active/);
      await expect(page.locator('#helpPanel')).not.toHaveClass(/active/);
      
      // Switch to Speed Reader tab
      await page.click('.main-tab-btn[data-tab="reader"]');
      await expect(page.locator('.main-tab-btn[data-tab="reader"]')).toHaveClass(/active/);
      await expect(page.locator('#readerPanel')).toHaveClass(/active/);
      await expect(page.locator('#inputPanel')).not.toHaveClass(/active/);
      
      // Switch back to help
      await page.click('.main-tab-btn[data-tab="help"]');
      await expect(page.locator('#helpPanel')).toHaveClass(/active/);
    });
  });

  test.describe('Text Input and Loading', () => {
    
    test('should load text from paste input', async ({ page }) => {
      const testText = 'This is a test sentence for speed reading practice.';
      
      // Navigate to input tab
      await page.click('.main-tab-btn[data-tab="input"]');
      
      // Ensure paste tab is active
      await expect(page.locator('#pasteTab')).toHaveClass(/active/);
      
      // Enter text and load
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
      
      // Should automatically switch to reader tab
      await expect(page.locator('.main-tab-btn[data-tab="reader"]')).toHaveClass(/active/);
      
      // Verify first word is displayed
      await expect(page.locator('#currentWord')).toContainText('This');
      
      // Verify word count  
      await expect(page.locator('#wordCount')).toContainText('1 / 9 words');
    });
    
    test('should switch between input tabs', async ({ page }) => {
      await page.click('.main-tab-btn[data-tab="input"]');
      
      // Test paste tab (should be active by default)
      await expect(page.locator('.tab-btn[data-tab="paste"]')).toHaveClass(/active/);
      await expect(page.locator('#pasteTab')).toHaveClass(/active/);
      
      // Switch to upload tab
      await page.click('.tab-btn[data-tab="upload"]');
      await expect(page.locator('.tab-btn[data-tab="upload"]')).toHaveClass(/active/);
      await expect(page.locator('#uploadTab')).toHaveClass(/active/);
      await expect(page.locator('#pasteTab')).not.toHaveClass(/active/);
      
      // Switch to library tab
      await page.click('.tab-btn[data-tab="library"]');
      await expect(page.locator('.tab-btn[data-tab="library"]')).toHaveClass(/active/);
      await expect(page.locator('#libraryTab')).toHaveClass(/active/);
      await expect(page.locator('#uploadTab')).not.toHaveClass(/active/);
    });
  });

  test.describe('Speed Reader Controls', () => {
    
    test.beforeEach(async ({ page }) => {
      // Load some test text first
      const testText = 'The quick brown fox jumps over the lazy dog repeatedly.';
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
      
      // Should be on reader tab now
      await expect(page.locator('#readerPanel')).toHaveClass(/active/);
    });

    test('should control playback with play/pause button', async ({ page }) => {
      // Initially should show "▶️ Start"
      await expect(page.locator('#playPauseBtn')).toContainText('▶️ Start');
      
      // Start playing
      await page.click('#playPauseBtn');
      await expect(page.locator('#playPauseBtn')).toContainText('⏸️ Pause');
      
      // Wait a moment and pause
      await page.waitForTimeout(1000);
      await page.click('#playPauseBtn');
      await expect(page.locator('#playPauseBtn')).toContainText('▶️ Start');
    });

    test('should navigate words with prev/next buttons', async ({ page }) => {
      // Should start with first word
      await expect(page.locator('#currentWord')).toContainText('The');
      
      // Go to next word
      await page.click('#nextBtn');
      await expect(page.locator('#currentWord')).toContainText('quick');
      
      // Go to previous word
      await page.click('#prevBtn');
      await expect(page.locator('#currentWord')).toContainText('The');
    });

    test('should reset to beginning', async ({ page }) => {
      // Navigate to a different word
      await page.click('#nextBtn');
      await page.click('#nextBtn');
      await expect(page.locator('#currentWord')).toContainText('brown');
      
      // Reset
      await page.click('#resetBtn');
      await expect(page.locator('#currentWord')).toContainText('The');
      await expect(page.locator('#wordCount')).toContainText('1 /');
    });

    test('should adjust speed with slider', async ({ page }) => {
      // Check default speed
      await expect(page.locator('#speedValue')).toContainText('250');
      
      // Change speed
      await page.locator('#speedSlider').fill('400');
      await expect(page.locator('#speedValue')).toContainText('400');
    });

    test('should toggle between manual and practice mode', async ({ page }) => {
      // Manual mode should be selected by default
      await expect(page.locator('input[value="manual"]')).toBeChecked();
      await expect(page.locator('#practiceOptions')).toHaveClass(/hidden/);
      
      // Switch to practice mode
      await page.click('input[value="practice"]');
      await expect(page.locator('input[value="practice"]')).toBeChecked();
      await expect(page.locator('#practiceOptions')).not.toHaveClass(/hidden/);
      
      // Switch back to manual
      await page.click('input[value="manual"]');
      await expect(page.locator('#practiceOptions')).toHaveClass(/hidden/);
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    
    test.beforeEach(async ({ page }) => {
      // Load test text
      const testText = 'One two three four five six seven eight nine ten.';
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
    });

    test('should play/pause with spacebar', async ({ page }) => {
      await expect(page.locator('#playPauseBtn')).toContainText('▶️ Start');
      
      // Press spacebar to start
      await page.keyboard.press('Space');
      await expect(page.locator('#playPauseBtn')).toContainText('⏸️ Pause');
      
      // Press spacebar to pause
      await page.keyboard.press('Space');
      await expect(page.locator('#playPauseBtn')).toContainText('▶️ Start');
    });

    test('should navigate with arrow keys', async ({ page }) => {
      await expect(page.locator('#currentWord')).toContainText('One');
      
      // Right arrow for next word
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#currentWord')).toContainText('two');
      
      // Left arrow for previous word
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('#currentWord')).toContainText('One');
    });

    test('should adjust speed with up/down arrows', async ({ page }) => {
      await expect(page.locator('#speedValue')).toContainText('250');
      
      // Up arrow to increase speed
      await page.keyboard.press('ArrowUp');
      await expect(page.locator('#speedValue')).toContainText('275');
      
      // Down arrow to decrease speed
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('#speedValue')).toContainText('250');
    });

    test('should reset with R key', async ({ page }) => {
      // Navigate to different word
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#currentWord')).toContainText('three');
      
      // Reset with R
      await page.keyboard.press('KeyR');
      await expect(page.locator('#currentWord')).toContainText('One');
    });
  });

  test.describe('Library Functionality', () => {
    
    test('should load popular books by default', async ({ page }) => {
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.click('.tab-btn[data-tab="library"]');
      
      // Should see popular books loaded
      await expect(page.locator('.book-list .book-item')).toHaveCount(12);
      
      // Check for some expected titles
      await expect(page.locator('.book-title').filter({ hasText: 'Moby Dick' })).toBeVisible();
      await expect(page.locator('.book-title').filter({ hasText: 'Pride and Prejudice' })).toBeVisible();
      await expect(page.locator('.book-title').filter({ hasText: 'Frankenstein' })).toBeVisible();
    });

    test('should load book when clicked', async ({ page }) => {
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.click('.tab-btn[data-tab="library"]');
      
      // Wait for books to load
      await page.waitForSelector('.book-item');
      
      // Click on first book (should be Moby Dick)
      await page.click('.book-item:first-child');
      
      // Should switch to reader tab and load the book
      await expect(page.locator('.main-tab-btn[data-tab="reader"]')).toHaveClass(/active/);
      
      // Should show loading or first word
      await page.waitForSelector('#currentWord:not(:empty)', { timeout: 10000 });
    });

    test('should filter books by category', async ({ page }) => {
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.click('.tab-btn[data-tab="library"]');
      
      // All books should be visible initially
      await expect(page.locator('.book-item')).toHaveCount(12);
      
      // Filter by fiction (all our hardcoded books are fiction)
      await page.selectOption('#categoryFilter', 'fiction');
      await expect(page.locator('.book-item')).toHaveCount(12);
      
      // Filter by science (should show none)
      await page.selectOption('#categoryFilter', 'science');
      await expect(page.locator('.book-item')).toHaveCount(0);
    });
  });

  test.describe('Settings and Themes', () => {
    
    test('should open and close settings modal', async ({ page }) => {
      // Settings modal should not be visible initially
      await expect(page.locator('#settingsModal')).not.toBeVisible();
      
      // Click settings button
      await page.click('#settingsBtn');
      await expect(page.locator('#settingsModal')).toBeVisible();
      
      // Close settings
      await page.click('#closeSettingsBtn');
      await expect(page.locator('#settingsModal')).not.toBeVisible();
    });

    test('should change font size', async ({ page }) => {
      // Load some text first
      const testText = 'Test text for font size.';
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
      
      // Open settings
      await page.click('#settingsBtn');
      
      // Change font size
      await page.locator('#fontSizeSlider').fill('60');
      await expect(page.locator('#fontSizeValue')).toContainText('60');
      
      // Check that font size changed (word display should have new font size)
      await page.click('#closeSettingsBtn');
      
      const fontSize = await page.locator('#currentWord').evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      expect(parseInt(fontSize)).toBeGreaterThan(48); // Should be larger than default
    });

    test('should change themes', async ({ page }) => {
      // Open settings
      await page.click('#settingsBtn');
      
      // Wait for settings modal to be visible
      await expect(page.locator('#settingsModal')).toBeVisible();
      
      // Change to dark theme by clicking the dark theme preset button
      await page.click('.theme-preset[data-preset="dark"]');
      
      // Close settings to apply theme
      await page.click('#closeSettingsBtn');
      
      // Check that theme changed (body should have different background)
      const bgColor = await page.evaluate(() => 
        window.getComputedStyle(document.body).backgroundColor
      );
      
      // Dark theme should not be white
      expect(bgColor).not.toBe('rgb(255, 255, 255)');
    });
  });

  test.describe('Sidebar Functionality', () => {
    
    test.beforeEach(async ({ page }) => {
      // Load test text
      const testText = 'First sentence. Second sentence. Third sentence for testing sidebar functionality.';
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
    });

    test('should toggle sidebar', async ({ page }) => {
      // Sidebar should be closed initially
      await expect(page.locator('#textSidebar')).not.toHaveClass(/open/);
      
      // Open sidebar
      await page.click('#sidebarToggleBtn');
      await expect(page.locator('#textSidebar')).toHaveClass(/open/);
      
      // Close sidebar
      await page.click('#closeSidebarBtn');
      await expect(page.locator('#textSidebar')).not.toHaveClass(/open/);
    });

    test('should open sidebar with S key', async ({ page }) => {
      // Open with keyboard
      await page.keyboard.press('KeyS');
      await expect(page.locator('#textSidebar')).toHaveClass(/open/);
      
      // Close with keyboard again
      await page.keyboard.press('KeyS');
      await expect(page.locator('#textSidebar')).not.toHaveClass(/open/);
    });
  });

  test.describe('Progress and Word Count', () => {
    
    test('should show correct progress information', async ({ page }) => {
      const testText = 'One two three four five';
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
      
      // Should show correct word count
      await expect(page.locator('#wordCount')).toContainText('1 / 5 words');
      
      // Navigate and check progress
      await page.click('#nextBtn');
      await expect(page.locator('#wordCount')).toContainText('2 / 5 words');
      
      // Check progress bar width (should be 40% = 2/5)
      const progressWidth = await page.locator('#progressFill').evaluate(el => 
        el.style.width
      );
      expect(progressWidth).toBe('40%');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle empty text input', async ({ page }) => {
      await page.click('.main-tab-btn[data-tab="input"]');
      
      // Try to load empty text
      await page.click('#loadTextBtn');
      
      // Should not switch tabs or break
      await expect(page.locator('.main-tab-btn[data-tab="input"]')).toHaveClass(/active/);
    });

    test('should handle very short text', async ({ page }) => {
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', 'Hi');
      await page.click('#loadTextBtn');
      
      // Should work with single word
      await expect(page.locator('#currentWord')).toContainText('Hi');
      await expect(page.locator('#wordCount')).toContainText('1 / 1 words');
    });

    test('should handle speed limits', async ({ page }) => {
      const testText = 'Test text for speed limits.';
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', testText);
      await page.click('#loadTextBtn');
      
      // Try to set speed below minimum with down arrow
      await page.locator('#speedSlider').fill('100');
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('#speedValue')).toContainText('100'); // Should not go below 100
      
      // Try to set speed above maximum with up arrow
      await page.locator('#speedSlider').fill('1000');
      await page.keyboard.press('ArrowUp');
      await expect(page.locator('#speedValue')).toContainText('1000'); // Should not go above 1000
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Basic functionality should still work
      await page.click('.main-tab-btn[data-tab="input"]');
      await page.fill('#textInput', 'Mobile test text');
      await page.click('#loadTextBtn');
      
      await expect(page.locator('#currentWord')).toContainText('Mobile');
      
      // Tabs should still be functional
      await page.click('.main-tab-btn[data-tab="help"]');
      await expect(page.locator('#helpPanel')).toHaveClass(/active/);
    });
  });
});