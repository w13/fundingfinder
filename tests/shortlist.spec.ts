import { test, expect } from '@playwright/test';

test.describe('Shortlist Page', () => {
  test('loads shortlist page and renders content', async ({ page }) => {
    await page.goto('/shortlist');

    await expect(page.getByRole('heading', { name: /AI Analysis/i })).toBeVisible();

    const table = page.locator('table');
    const emptyState = page.locator('text=No opportunities shortlisted yet');

    if (await table.count()) {
      await expect(table.first()).toBeVisible();
      return;
    }

    await expect(emptyState).toBeVisible();
  });
});
