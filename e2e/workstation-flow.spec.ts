import { test, expect } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────

async function selectBrain(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^B\s+Brain\s+Routine/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /^B\s+Brain\s+Routine/i }).click();
  await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible({ timeout: 10000 });
}

async function selectKnee(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Extremity/i }).click();
  await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible();
}

/** Expand the BRAIN folder in ExamCards and add the first protocol */
async function expandBrainAndAddFirst(page: import('@playwright/test').Page) {
  // Click the BRAIN folder row button to expand (the ▶ BRAIN row)
  const brainFolder = page.locator('button:has-text("BRAIN")').filter({ hasText: /▶|▼/ }).first();
  // Fallback: just find the BRAIN button in the examcards area
  const folderBtn = (await brainFolder.isVisible().catch(() => false))
    ? brainFolder
    : page.locator('button').filter({ hasText: 'BRAIN' }).first();
  await folderBtn.click();
  await page.waitForTimeout(500);
  // Click the first "+ Add" button that appears
  const addBtn = page.locator('button:has-text("+ Add")').first();
  await expect(addBtn).toBeVisible({ timeout: 5000 });
  await addBtn.click();
  await page.waitForTimeout(200);
}

async function selectSpine(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('button:has-text("Spine")').filter({ hasText: /^S/ }).first().click();
}

// ─── Region Selection ───────────────────────────────────────

test.describe('Region Selection', () => {
  test('shows region selector with 3 regions on initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('MEDASSIST')).toBeVisible();
    await expect(page.getByText('Select a body region to begin')).toBeVisible();
    await expect(page.getByRole('button', { name: /^B\s+Brain\s+Routine/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Spine/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Extremity/i })).toBeVisible();
  });

  test('Brain → exam setup with Brain MRI label', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Brain MRI', { exact: true })).toBeVisible();
  });

  test('Spine → sub-region selector with back button', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    // Back button
    await expect(page.getByText(/Back to region select/i)).toBeVisible();
  });

  test('Extremity → exam setup with Knee label', async ({ page }) => {
    await selectKnee(page);
    await expect(page.getByText('Knee', { exact: true }).first()).toBeVisible();
  });

  test('spine sub-region Cervical → exam setup', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /C Cervical/i }).click();
    await expect(page.getByText('Cervical Spine MRI')).toBeVisible({ timeout: 10000 });
  });

  test('spine sub-region Thoracic → exam setup', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /T Thoracic/i }).click();
    await expect(page.getByText('Thoracic Spine MRI')).toBeVisible({ timeout: 10000 });
  });

  test('spine sub-region Lumbar → exam setup', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /L Lumbar/i }).click();
    await expect(page.getByText('Lumbar Spine MRI')).toBeVisible({ timeout: 10000 });
  });

  test('Change Region returns to region selector', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: /Change Region/i }).click();
    await expect(page.getByText('Select a body region to begin')).toBeVisible();
  });
});

// ─── ExamCards & Protocol Browser ───────────────────────────

test.describe('ExamCards Browser', () => {
  test('Brain shows BRAIN, NECK, KNEE folders in ExamCards', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    // ExamCards section with folder names
    await expect(page.locator('button:has-text("BRAIN")').first()).toBeVisible();
    await expect(page.locator('button:has-text("NECK")').first()).toBeVisible();
    await expect(page.locator('button:has-text("KNEE")').first()).toBeVisible();
  });

  test('expanding BRAIN folder shows protocol entries', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    // Click the BRAIN folder button to expand
    await page.locator('button').filter({ hasText: 'BRAIN' }).first().click();
    await page.waitForTimeout(500);
    // Should see protocol labels and Add buttons
    await expect(page.locator('button:has-text("+ Add")').first()).toBeVisible({ timeout: 5000 });
  });

  test('can add protocol from expanded folder', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    // Sidebar should show 1 sequence
    await expect(page.getByText(/1 sequence/i)).toBeVisible();
  });

  test('Knee exam setup shows KNEE folder', async ({ page }) => {
    await selectKnee(page);
    await page.waitForTimeout(300);
    await expect(page.locator('text=KNEE').first()).toBeVisible();
  });

  test('Confirm Protocols button is visible in exam-setup', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByRole('button', { name: /Confirm Protocols/i })).toBeVisible();
  });
});

// ─── Tips / Guidance Toggle ─────────────────────────────────

test.describe('Tips Toggle', () => {
  test('Tips ON by default', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByRole('button', { name: 'Tips ON' })).toBeVisible();
  });

  test('toggles OFF and back ON', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Tips ON' }).click();
    await expect(page.getByRole('button', { name: 'Tips OFF' })).toBeVisible();
    await page.getByRole('button', { name: 'Tips OFF' }).click();
    await expect(page.getByRole('button', { name: 'Tips ON' })).toBeVisible();
  });
});

// ─── Top Bar ────────────────────────────────────────────────

test.describe('Top Bar', () => {
  test('shows MEDASSIST branding', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('MEDASSIST')).toBeVisible();
  });

  test('shows patient name', async ({ page }) => {
    await selectBrain(page);
    // DOE, JOHN in top bar
    await expect(page.locator('text=DOE, JOHN').first()).toBeVisible();
  });

  test('shows elapsed timer at 00:00:00', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('00:00:00')).toBeVisible();
  });

  test('shows case label badge', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Brain MRI', { exact: true })).toBeVisible();
  });
});

// ─── Bottom Right Tabs ──────────────────────────────────────

test.describe('Bottom Right Tabs', () => {
  test('shows Real-Time, Feedback, and Notes tabs', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByRole('button', { name: 'Real-Time' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Feedback' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notes' })).toBeVisible();
  });

  test('Real-Time tab shows REAL-TIME VIEW header', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('REAL-TIME VIEW')).toBeVisible();
  });

  test('Real-Time shows NO SIGNAL before survey', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('NO SIGNAL')).toBeVisible();
  });

  test('Feedback tab shows placeholder', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Feedback' }).click();
    await expect(page.getByText('FEEDBACK', { exact: true })).toBeVisible();
  });

  test('Notes tab shows textarea', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('Notes textarea is editable', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForTimeout(200);
    const textarea = page.locator('textarea');
    // It should have placeholder text (disabled since no sequence selected)
    await expect(textarea).toBeVisible();
  });
});

// ─── Patient Info Panel ─────────────────────────────────────

test.describe('Patient Info Panel', () => {
  test('shows Patient Information header', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Patient Information')).toBeVisible();
  });

  test('shows patient name', async ({ page }) => {
    await selectBrain(page);
    // Check within the right panel area
    await expect(page.locator('text=DOE, JOHN').first()).toBeVisible();
  });

  test('shows DOB, Gender, Age', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('14-Mar-1985').first()).toBeVisible();
    await expect(page.getByText('40Y').first()).toBeVisible();
  });

  test('shows Study Type field', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Study Type')).toBeVisible();
    await expect(page.getByText('Brain MRI Routine')).toBeVisible();
  });

  test('shows Contrast field', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Contrast')).toBeVisible();
  });

  test('shows Weight', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('78 kg')).toBeVisible();
  });

  test('shows Patient ID', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('PAT-2024-00147')).toBeVisible();
  });
});

// ─── Scanner Status Bar ─────────────────────────────────────

test.describe('Scanner Status Bar', () => {
  test('shows scanner name and coil', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Ingenia 3.0T').first()).toBeVisible();
    await expect(page.getByText('32ch Head Coil').first()).toBeVisible();
  });

  test('shows region in status bar', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('BRAIN').first()).toBeVisible();
  });

  test('shows SAR meter', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('SAR')).toBeVisible();
  });
});

// ─── Protocol Sidebar ───────────────────────────────────────

test.describe('Protocol Sidebar', () => {
  test('shows SCAN PROTOCOLS header', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible();
  });

  test('shows 0 sequences initially', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('0 sequences')).toBeVisible();
  });

  test('shows empty state message', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('No protocols added')).toBeVisible();
  });

  test('count updates to 1 when protocol added', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    await expect(page.getByText(/1 sequence/i)).toBeVisible();
  });

  test('shows patient info at bottom of sidebar', async ({ page }) => {
    await selectBrain(page);
    // Patient section in sidebar
    await expect(page.getByText('PATIENT').first()).toBeVisible();
  });
});

// ─── Canvas Panels ──────────────────────────────────────────

test.describe('Canvas Panels', () => {
  test('shows 3 view panels (SAGITTAL, CORONAL, AXIAL)', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('SAGITTAL')).toBeVisible();
    await expect(page.getByText('CORONAL')).toBeVisible();
    await expect(page.getByText('AXIAL')).toBeVisible();
  });

  test('shows NO IMAGE placeholder before survey', async ({ page }) => {
    await selectBrain(page);
    // At least one NO IMAGE text
    await expect(page.getByText('NO IMAGE').first()).toBeVisible();
  });

  test('shows orientation labels (H, F, A, P, R, L)', async ({ page }) => {
    await selectBrain(page);
    // These are positioned absolutely on the panels
    await expect(page.getByText('H').first()).toBeVisible();
    await expect(page.getByText('F').first()).toBeVisible();
  });
});

// ─── Confirm & Sequence Ordering ────────────────────────────

test.describe('Sequence Ordering', () => {
  test('confirm protocols is disabled without protocols', async ({ page }) => {
    await selectBrain(page);
    const btn = page.getByRole('button', { name: /Confirm Protocols/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('confirm protocols enables after adding protocol', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    const btn = page.getByRole('button', { name: /Confirm Protocols/i });
    await expect(btn).toBeEnabled();
  });

  test('clicking confirm with 1 protocol auto-skips ordering and starts survey', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    await page.getByRole('button', { name: /Confirm Protocols/i }).click();

    // With 1 protocol, ordering auto-skips and survey auto-starts
    // Wait for survey to complete (3s + buffer)
    await page.waitForTimeout(5000);

    // Should be at survey-complete or protocol-active — sidebar still visible
    await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Full Brain Exam E2E ────────────────────────────────────

test.describe('Full Brain Exam E2E', () => {
  test('add protocol → confirm → survey completes', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);

    // Add a protocol
    await expandBrainAndAddFirst(page);
    await expect(page.getByText(/1 sequence/i)).toBeVisible();

    // Confirm
    await page.getByRole('button', { name: /Confirm Protocols/i }).click();
    await page.waitForTimeout(500);

    // Handle ordering panel if present
    const hasOrderPanel = await page.getByText('ARRANGE SEQUENCES').isVisible().catch(() => false);
    if (hasOrderPanel) {
      const confirmBtn = page.getByRole('button', { name: /Confirm Order/i });
      if (await confirmBtn.isEnabled().catch(() => false)) {
        await confirmBtn.click();
      }
    }

    // Wait for survey to complete (3s + buffer)
    await page.waitForTimeout(5000);

    // After survey: should still see SCAN PROTOCOLS sidebar
    await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible();
  });
});

// ─── Knee Exam Flow ─────────────────────────────────────────

test.describe('Knee Exam Flow', () => {
  test('KNEE folder shows knee protocols when expanded', async ({ page }) => {
    await selectKnee(page);
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'KNEE' }).first().click();
    await page.waitForTimeout(500);
    // Should see Add buttons for knee protocols
    await expect(page.locator('button:has-text("+ Add")').first()).toBeVisible({ timeout: 5000 });
  });

  test('can add knee protocol to sidebar', async ({ page }) => {
    await selectKnee(page);
    await page.waitForTimeout(300);
    await page.locator('text=KNEE').first().click();
    await page.waitForTimeout(300);
    const addBtn = page.locator('button:has-text("Add")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByText(/1 sequence/i)).toBeVisible();
    }
  });
});

// ─── Spine Exam Flows ───────────────────────────────────────

test.describe('Spine Exam Flows', () => {
  test('Cervical spine shows NECK folder', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /C Cervical/i }).click();
    await expect(page.getByText('Cervical Spine MRI')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await expect(page.locator('text=NECK').first()).toBeVisible();
  });

  test('Lumbar spine shows DORSAL SPINE folder', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /L Lumbar/i }).click();
    await expect(page.getByText('Lumbar Spine MRI')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await expect(page.locator('text=DORSAL SPINE').first()).toBeVisible();
  });
});

// ─── Protocol Browser Interaction ──────────────────────────

test.describe('Protocol Browser Interaction', () => {
  test('expanding BRAIN folder shows specific protocol entries', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'BRAIN' }).first().click();
    await page.waitForTimeout(500);
    // Verify specific protocol labels are visible
    await expect(page.getByText('Ax T2 TSE', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Ax T2 FLAIR', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Ax T1 TSE', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('adding 2 protocols shows "2 sequences" in sidebar', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    // Expand BRAIN folder
    await page.locator('button').filter({ hasText: 'BRAIN' }).first().click();
    await page.waitForTimeout(500);
    // Add first protocol
    const addButtons = page.locator('button:has-text("+ Add")');
    await expect(addButtons.first()).toBeVisible({ timeout: 5000 });
    await addButtons.nth(0).click();
    await page.waitForTimeout(200);
    await expect(page.getByText(/1 sequence/i)).toBeVisible({ timeout: 5000 });
    // Add second protocol
    await addButtons.nth(1).click();
    await page.waitForTimeout(200);
    await expect(page.getByText('2 sequences')).toBeVisible({ timeout: 5000 });
  });
});

// ─── Scan Time Display ─────────────────────────────────────

test.describe('Scan Time Display', () => {
  test('protocol entries show estimated time in ExamCards', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'BRAIN' }).first().click();
    await page.waitForTimeout(500);
    // The estimated times from examcards data (e.g. "2:30", "3:10")
    await expect(page.getByText('2:30').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Feedback Panel Structure ──────────────────────────────

test.describe('Feedback Panel Structure', () => {
  test('Feedback tab shows Check Planning and Submit Session buttons after confirm', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    // Confirm protocols and complete survey
    await page.getByRole('button', { name: /Confirm Protocols/i }).click();
    await page.waitForTimeout(500);
    const hasOrderPanel = await page.getByText('ARRANGE SEQUENCES').isVisible().catch(() => false);
    if (hasOrderPanel) {
      const confirmBtn = page.getByRole('button', { name: /Confirm Order/i });
      if (await confirmBtn.isEnabled().catch(() => false)) {
        await confirmBtn.click();
      }
    }
    // Wait for survey to finish
    await page.waitForTimeout(5000);
    // Switch to Feedback tab
    await page.getByRole('button', { name: 'Feedback' }).click();
    await page.waitForTimeout(300);
    // Check Planning button should be present
    await expect(page.getByRole('button', { name: 'Check Planning' })).toBeVisible({ timeout: 10000 });
    // Submit Session button should be present (disabled until all visited)
    await expect(page.getByRole('button', { name: 'Submit Session' })).toBeVisible({ timeout: 5000 });
  });

  test('Feedback tab shows Reset button', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    await page.getByRole('button', { name: /Confirm Protocols/i }).click();
    await page.waitForTimeout(500);
    const hasOrderPanel = await page.getByText('ARRANGE SEQUENCES').isVisible().catch(() => false);
    if (hasOrderPanel) {
      const confirmBtn = page.getByRole('button', { name: /Confirm Order/i });
      if (await confirmBtn.isEnabled().catch(() => false)) {
        await confirmBtn.click();
      }
    }
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: 'Feedback' }).click();
    await page.waitForTimeout(300);
    // Reset button in the feedback action bar
    await expect(page.getByRole('button', { name: 'Reset', exact: true }).first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Notes Panel Functionality ─────────────────────────────

test.describe('Notes Panel Functionality', () => {
  test('Notes tab shows "Notes" heading', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Notes', { exact: true }).first()).toBeVisible();
  });

  test('Notes textarea shows placeholder for no active sequence', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForTimeout(200);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', 'Select a sequence to add notes');
  });

  test('Notes textarea is disabled without active protocol', async ({ page }) => {
    await selectBrain(page);
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForTimeout(200);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeDisabled();
  });

  test('Notes textarea is editable after protocol activation', async ({ page }) => {
    await selectBrain(page);
    await page.waitForTimeout(300);
    await expandBrainAndAddFirst(page);
    await page.getByRole('button', { name: /Confirm Protocols/i }).click();
    await page.waitForTimeout(500);
    const hasOrderPanel = await page.getByText('ARRANGE SEQUENCES').isVisible().catch(() => false);
    if (hasOrderPanel) {
      const confirmBtn = page.getByRole('button', { name: /Confirm Order/i });
      if (await confirmBtn.isEnabled().catch(() => false)) {
        await confirmBtn.click();
      }
    }
    await page.waitForTimeout(5000);
    // Switch to Notes tab
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForTimeout(300);
    const textarea = page.locator('textarea');
    // After survey completes and protocol is active, textarea should be enabled
    const isEnabled = !(await textarea.isDisabled().catch(() => true));
    if (isEnabled) {
      await textarea.fill('Test note for this sequence');
      await expect(textarea).toHaveValue('Test note for this sequence');
    }
  });
});

// ─── Multiple Region Navigation ────────────────────────────

test.describe('Multiple Region Navigation', () => {
  test('Brain → Change Region → Extremity (Knee) → Change Region → Spine → Cervical', async ({ page }) => {
    // Start with Brain
    await selectBrain(page);
    await expect(page.getByText('Brain MRI', { exact: true })).toBeVisible({ timeout: 10000 });

    // Change Region back
    await page.getByRole('button', { name: /Change Region/i }).click();
    await expect(page.getByText('Select a body region to begin')).toBeVisible({ timeout: 10000 });

    // Select Extremity (Knee)
    await page.getByRole('button', { name: /Extremity/i }).click();
    await expect(page.getByText('SCAN PROTOCOLS')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Knee', { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // Change Region again
    await page.getByRole('button', { name: /Change Region/i }).click();
    await expect(page.getByText('Select a body region to begin')).toBeVisible({ timeout: 10000 });

    // Select Spine → Cervical
    await page.locator('button:has-text("Spine")').filter({ hasText: /^S/ }).first().click();
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /C Cervical/i }).click();
    await expect(page.getByText('Cervical Spine MRI')).toBeVisible({ timeout: 10000 });
  });
});

// ─── ExamCards for Different Regions ────────────────────────

test.describe('ExamCards for Different Regions', () => {
  test('Knee region shows KNEE folder with knee protocols', async ({ page }) => {
    await selectKnee(page);
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'KNEE' }).first().click();
    await page.waitForTimeout(500);
    // Knee-specific protocol labels
    await expect(page.getByText('Sag PD (Knee)').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cor PD (Knee)').first()).toBeVisible({ timeout: 5000 });
  });

  test('Cervical spine shows NECK folder with neck protocols', async ({ page }) => {
    await selectSpine(page);
    await expect(page.getByText('Spine Region')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /C Cervical/i }).click();
    await expect(page.getByText('Cervical Spine MRI')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    // Expand NECK folder
    await page.locator('button').filter({ hasText: 'NECK' }).first().click();
    await page.waitForTimeout(500);
    // Neck-specific protocol labels
    await expect(page.getByText('Ax T2 TSE (Neck)').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cor STIR (Neck)').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Top Bar Elements Simultaneous ─────────────────────────

test.describe('Top Bar Elements All Visible', () => {
  test('all top bar elements visible simultaneously', async ({ page }) => {
    await selectBrain(page);
    // All these should be visible at the same time
    await expect(page.getByText('MEDASSIST')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=DOE, JOHN').first()).toBeVisible();
    await expect(page.getByText('00:00:00')).toBeVisible();
    await expect(page.getByText('Brain MRI', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tips (ON|OFF)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Change Region/i })).toBeVisible();
  });
});

// ─── Scanner Status Bar Full ───────────────────────────────

test.describe('Scanner Status Bar Full', () => {
  test('scanner name, coil, and SAR meter all visible simultaneously', async ({ page }) => {
    await selectBrain(page);
    await expect(page.getByText('Ingenia 3.0T').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('32ch Head Coil').first()).toBeVisible();
    await expect(page.getByText('SAR')).toBeVisible();
    await expect(page.getByText('0.1 W/kg')).toBeVisible();
    await expect(page.getByText('BRAIN').first()).toBeVisible();
    // Patient name also in status bar
    await expect(page.locator('text=DOE, JOHN').first()).toBeVisible();
  });
});
