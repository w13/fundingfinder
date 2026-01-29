import { test, expect } from '@playwright/test';

test.describe('Status Page', () => {
  test('shows system status overview', async ({ page }) => {
    await page.goto('/status');

    await expect(page.getByRole('heading', { name: /System status/i })).toBeVisible();

    const overall = page.locator('text=Overall status');
    if (await overall.count()) {
      await expect(overall.first()).toBeVisible();
    }
  });
});
