import { test, expect } from '@playwright/test';

test.describe('Opportunities Flow', () => {
  test('loads homepage and supports search', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Global Funding Intelligence/i })).toBeVisible();

    const searchInput = page.locator('input[name="q"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('health');
    await searchInput.press('Enter');

    await page.waitForURL(/q=health/);
  });

  test('opens opportunity detail when available', async ({ page }) => {
    await page.goto('/');

    const detailsLinks = page.getByRole('link', { name: 'View details' });
    const linkCount = await detailsLinks.count();

    if (linkCount === 0) {
      await expect(page.locator('text=No opportunities yet')).toBeVisible();
      return;
    }

    await detailsLinks.first().click();

    await expect(page.locator('text=AI Feasibility Summary')).toBeVisible();
    await expect(page.locator('text=Key Constraints')).toBeVisible();
  });
});
