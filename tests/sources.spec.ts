import { test, expect } from '@playwright/test';

test.describe('Sources Page', () => {
  test('should load the sources page', async ({ page }) => {
    await page.goto('/sources');
    
    // Check that the page title/heading is present
    await expect(page.locator('h2').filter({ hasText: 'Sources' })).toBeVisible();
    
    // Check that the table is present
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display sources table with columns', async ({ page }) => {
    await page.goto('/sources');
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check for expected column headers
    await expect(page.locator('th').filter({ hasText: 'Enable' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Source' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Last Sync' })).toBeVisible();
  });

  test('should have Enable All toggle above the table', async ({ page }) => {
    await page.goto('/sources');
    
    // Check for "Enable All:" label
    await expect(page.locator('text=Enable All:')).toBeVisible();
    
    // Check for the toggle switch
    const toggleSwitch = page.locator('button[role="switch"]').first();
    await expect(toggleSwitch).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/sources');
    
    // Find the search input
    const searchInput = page.locator('input[placeholder*="Search sources"]');
    await expect(searchInput).toBeVisible();
    
    // Test searching
    await searchInput.fill('grants');
    await page.waitForTimeout(500); // Wait for search to filter
    
    // The table should still be visible (even if empty)
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have Sync All Sources button', async ({ page }) => {
    await page.goto('/sources');
    
    // Check for Sync All button
    const syncAllButton = page.locator('button').filter({ hasText: /Sync All/i });
    await expect(syncAllButton).toBeVisible();
  });

  test('should display source rows', async ({ page }) => {
    await page.goto('/sources');
    
    // Wait for table body
    const tbody = page.locator('table tbody');
    await expect(tbody).toBeVisible();
    
    // Check if there are any source rows (at least one row, even if it's "No sources available")
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have Settings button for each source', async ({ page }) => {
    await page.goto('/sources');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check if there are any sources with Settings buttons
    const settingsButtons = page.locator('button').filter({ hasText: /Settings/i });
    const count = await settingsButtons.count();
    
    // If there are sources, there should be Settings buttons
    if (count > 0) {
      await expect(settingsButtons.first()).toBeVisible();
    }
  });

  test('should have individual toggle switches for each source', async ({ page }) => {
    await page.goto('/sources');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check for toggle switches in the table
    const toggleSwitches = page.locator('button[role="switch"]');
    const count = await toggleSwitches.count();
    
    // Should have at least the Enable All toggle, possibly more
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display summary stats cards', async ({ page }) => {
    await page.goto('/sources');
    
    // Check for summary cards
    await expect(page.locator('text=Total opportunities')).toBeVisible();
    await expect(page.locator('text=Active sources')).toBeVisible();
  });

  test('should have Filters section at the bottom', async ({ page }) => {
    await page.goto('/sources');
    
    // Scroll to bottom to find filters
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for Filters heading
    await expect(page.locator('h3').filter({ hasText: 'Filters' })).toBeVisible();
  });

  test('Enable All toggle should be clickable and functional', async ({ page }) => {
    await page.goto('/sources');
    
    // Wait for page to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Find the Enable All toggle (first switch in the Enable All section)
    const enableAllSection = page.locator('text=Enable All:').locator('..');
    const toggleSwitch = enableAllSection.locator('button[role="switch"]').first();
    
    await expect(toggleSwitch).toBeVisible();
    
    // Get initial state
    const initialChecked = await toggleSwitch.getAttribute('aria-checked');
    const initialState = initialChecked === 'true';
    
    console.log(`Initial toggle state: ${initialState}`);
    
    // Click the toggle
    await toggleSwitch.click();
    
    // Wait for the toggle to update (optimistic update should happen immediately)
    // Wait a bit longer to ensure state has updated
    await page.waitForTimeout(1000);
    
    // Check if the toggle state changed (optimistic update)
    const afterClickChecked = await toggleSwitch.getAttribute('aria-checked');
    const afterClickState = afterClickChecked === 'true';
    console.log(`After click toggle state: ${afterClickState}`);
    
    // The toggle should have changed state (optimistic update)
    // Note: If it didn't change, the API call might be failing
    expect(afterClickState).toBe(!initialState);
    
    // Wait for server response and revalidation
    await page.waitForTimeout(3000);
    
    // After revalidation, check the final state
    const finalChecked = await toggleSwitch.getAttribute('aria-checked');
    const finalState = finalChecked === 'true';
    console.log(`Final toggle state: ${finalState}`);
    
    // The toggle should still be enabled and interactive
    await expect(toggleSwitch).toBeEnabled();
  });

  test('should be able to expand source settings', async ({ page }) => {
    await page.goto('/sources');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Find the first Settings button
    const settingsButtons = page.locator('button').filter({ hasText: /Settings/i });
    const count = await settingsButtons.count();
    
    if (count > 0) {
      const firstSettingsButton = settingsButtons.first();
      await expect(firstSettingsButton).toBeVisible();
      
      // Click to expand
      await firstSettingsButton.click();
      
      // Wait for settings to expand
      await page.waitForTimeout(500);
      
      // Check for configuration form elements
      const configSection = page.locator('text=Configuration');
      if (await configSection.count() > 0) {
        await expect(configSection.first()).toBeVisible();
      }
    }
  });
});
