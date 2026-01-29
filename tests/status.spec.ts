import { test, expect } from '@playwright/test';

test.describe('Status Page', () => {
  test('shows system status overview', async ({ page }) => {
    const response = await page.goto('/status');
    if (response?.status() === 404) {
      test.skip(true, 'Status page not available on target frontend');
    }

    await expect(page.getByRole('heading', { name: /System status/i })).toBeVisible();

    const overall = page.locator('text=Overall status');
    if (await overall.count()) {
      await expect(overall.first()).toBeVisible();
    }
  });
});
