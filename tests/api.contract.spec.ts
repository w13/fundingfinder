import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.GRANT_SENTINEL_API_URL ?? 'https://grant-sentinel.wakas.workers.dev';

test.describe('Worker API contracts', () => {
  test('health endpoint returns status payload', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(typeof payload.status).toBe('string');
  });

  test('opportunities list returns items array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/opportunities?limit=1`);
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(Array.isArray(payload.items)).toBeTruthy();
  });

  test('opportunity detail returns item when available', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE_URL}/api/opportunities?limit=1`);
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();

    if (!Array.isArray(listPayload.items) || listPayload.items.length === 0) {
      return;
    }

    const item = listPayload.items[0];
    const detailResponse = await request.get(`${API_BASE_URL}/api/opportunities/${item.id}`);
    expect(detailResponse.ok()).toBeTruthy();
    const detailPayload = await detailResponse.json();

    expect(detailPayload.item).toBeTruthy();
    expect(detailPayload.item.id).toBe(item.id);
    expect(Array.isArray(detailPayload.item.documents)).toBeTruthy();
  });

  test('sources endpoint returns array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/sources`);
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(Array.isArray(payload.sources)).toBeTruthy();
  });

  test('admin overview returns summary and health', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/overview`);
    if (response.status() === 404) {
      test.skip(true, 'Admin overview endpoint not available on target API');
    }
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(payload.summary).toBeTruthy();
    expect(Array.isArray(payload.sources)).toBeTruthy();
    expect(Array.isArray(payload.rules)).toBeTruthy();
  });

  test('saved searches returns array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/saved-searches`);
    if (response.status() === 404) {
      test.skip(true, 'Saved searches endpoint not available on target API');
    }
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(Array.isArray(payload.searches)).toBeTruthy();
  });
});
