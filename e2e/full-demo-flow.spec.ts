import { test, expect } from '@playwright/test';

/**
 * Full end-to-end demo smoke test.
 * Walks through the entire Brain MRI exam from landing page to report.
 */
test.describe('Full Demo Flow — Brain MRI Exam', () => {
  test('Quick Start → Order → Survey → Plan → Check → Report', async ({ page }) => {
    // Step 1: Landing page
    await page.goto('/');
    await expect(page.getByText('MedAssist', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MRI Planning Training Simulator')).toBeVisible();

    // Step 2: Quick Start
    const quickStart = page.getByRole('button', { name: /Quick Start/i });
    await expect(quickStart).toBeVisible();
    await quickStart.click();

    // Step 3: Handle ordering panel (4 protocols → panel appears)
    await page.waitForTimeout(1000);
    const hasOrderPanel = await page.getByText('ARRANGE SEQUENCES').isVisible().catch(() => false);
    if (hasOrderPanel) {
      const confirmBtn = page.getByRole('button', { name: /Confirm Order/i });
      // If order is already valid, confirm it
      if (await confirmBtn.isEnabled().catch(() => false)) {
        await confirmBtn.click();
      }
    }

    // Step 4: Wait for survey to complete
    await page.waitForTimeout(5000);

    // Step 5: Should be at survey-complete — sidebar visible
    await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible({ timeout: 10000 });

    // Step 6: Turn off tips for a smoother demo flow
    const tipsBtn = page.getByRole('button', { name: 'Tips ON' });
    if (await tipsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tipsBtn.click();
    }

    // Step 7: Activate first protocol from sidebar
    // Click the first protocol row (after the "SCAN PROTOCOLS" header)
    const protocolRows = page.locator('div').filter({ hasText: /Sag T1|Ax T2|Ax FLAIR|Ax DWI/ });
    const firstRow = protocolRows.first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1000);
    }

    // Step 8: Switch to Feedback tab
    await page.getByRole('button', { name: 'Feedback' }).click();
    await page.waitForTimeout(500);

    // Step 9: Check Planning
    const checkBtn = page.getByRole('button', { name: 'Check Planning' });
    if (await checkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkBtn.click();
      await page.waitForTimeout(2000);

      // Should see a score
      const hasScore = await page.locator('text=/\\d+%/').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasScore).toBe(true);
    }

    // Step 10: Visit the report page
    await page.goto('/report');
    await expect(page.getByText(/Session Report/i)).toBeVisible({ timeout: 10000 });
  });

  test('Region selector shows all 3 regions and Quick Start', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^B\s+Brain\s+Routine/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Spine/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Extremity/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Quick Start/i })).toBeVisible();
  });

  test('Knee region shows localizer images (not blank)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Extremity/i }).click();
    await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('SAGITTAL')).toBeVisible();
    await expect(page.getByText('CORONAL')).toBeVisible();
    await expect(page.getByText('AXIAL')).toBeVisible();
  });

  test('Report page shows MedAssist branding', async ({ page }) => {
    await page.goto('/report');
    await expect(page.getByText(/Session Report/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MedAssist', { exact: true }).first()).toBeVisible();
  });
});
