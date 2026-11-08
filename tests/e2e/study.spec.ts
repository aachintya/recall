import { test, expect, type Page } from '@playwright/test';
import { examples } from '../../src/data/examples';

const openExample = async (page: Page) => {
  await page.getByRole('button', { name: /The science of green/ }).click();
  await expect(page.getByRole('heading', { name: 'The science of green' })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('a validated generation response becomes an interactive saved study set', async ({ page }) => {
  let submitted: unknown;
  await page.route('**/api/generate', (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ set: examples.react }),
    });
  });
  await page
    .getByRole('textbox', { name: 'Your notes or topic' })
    .fill('Explain React hooks and components.');
  await page.getByRole('button', { name: 'Challenge', exact: true }).click();
  await page.getByRole('button', { name: 'Create study set', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Think in components' })).toBeVisible();
  await expect(page.getByText('AI study set', { exact: true })).toBeVisible();
  expect(submitted).toEqual({
    notes: 'Explain React hooks and components.',
    count: 6,
    difficulty: 'challenge',
  });
  await page.getByRole('button', { name: 'Flip card to reveal answer' }).click();
  await expect(page.getByText(/A JavaScript function that returns a description/)).toBeVisible();
  await page.getByRole('button', { name: /My library/ }).click();
  await expect(page.getByRole('heading', { name: 'Think in components' })).toBeVisible();
});

test('flashcards, complete quiz, and practice only missed questions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openExample(page);
  await expect(page.getByText('Example set', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Flip card to reveal answer' }),
  ).toHaveAccessibleDescription('What is the main purpose of photosynthesis?');
  await page.getByRole('button', { name: 'Flip card to reveal answer' }).click();
  await expect(page.getByText(/To convert light energy into chemical energy/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Show question', exact: true }),
  ).toHaveAccessibleDescription(/To convert light energy into chemical energy/);
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await expect(page.getByText('17% of this set remembered')).toBeVisible();
  await page.getByRole('button', { name: /^Quiz/ }).click();
  for (const [index, answer] of [0, 2, 0, 3, 1, 2].entries()) {
    await page
      .getByRole('group', { name: 'Answer choices' })
      .getByRole('button')
      .nth(answer)
      .click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByRole('status')).toContainText(
      index === 0 ? 'A good one to remember.' : 'You’ve got it.',
    );
    await page
      .getByRole('button', { name: index === 5 ? 'See my results' : 'Next question' })
      .click();
  }
  await expect(page.getByText('83', { exact: false }).filter({ hasText: '%' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice 1 missed question', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Which form of energy/ })).toBeVisible();
  await expect(page.getByText('Question 1 of 1')).toBeVisible();
  await page.getByRole('group', { name: 'Answer choices' }).getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'See my results' }).click();
  await expect(page.getByRole('heading', { name: 'That knowledge is sticking.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('card shortcuts work after a click and Space flips the focused card once', async ({
  page,
}) => {
  await openExample(page);
  await page.getByRole('button', { name: 'Flip card to reveal answer' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.flashcard-navigation strong')).toHaveText('2');
  await expect(page.locator('.flashcard')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.flashcard-navigation strong')).toHaveText('1');
  await page.keyboard.press('Space');
  await expect(page.locator('.flashcard')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(page.locator('.flashcard')).toHaveAttribute('aria-pressed', 'false');
});

test('duplicate stored progress cannot mark an entire set as mastered', async ({ page }) => {
  await openExample(page);
  await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem('recall.sessions.v1')!);
    sessions[0].knownCards = [0, 0, 0, 0, 0, 0];
    localStorage.setItem('recall.sessions.v1', JSON.stringify(sessions));
  });
  await page.reload();
  await page.getByRole('button', { name: /My library/ }).click();
  await expect(page.getByText('6 cards · 1 remembered')).toBeVisible();
  await page.getByRole('button', { name: 'Continue learning' }).click();
  await expect(page.getByText('17% of this set remembered')).toBeVisible();
  await expect(page.locator('.mastered-banner')).toHaveCount(0);
});

test('library persists card progress, supports search, and restores deleted sets', async ({
  page,
}) => {
  await openExample(page);
  await page.getByRole('button', { name: 'Flip card to reveal answer' }).click();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /My library/ }).click();
  await expect(page.getByText('6 cards · 1 remembered')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search study sets' }).fill('nonexistent');
  await expect(page.getByRole('heading', { name: 'No sets by that name. Yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('button', { name: 'Delete The science of green' }).click();
  await expect(page.getByRole('heading', { name: 'Room for your next discovery.' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'Continue learning' }).click();
  await expect(page.getByText('17% of this set remembered')).toBeVisible();
});

test('input validation, provider error, retry, and recovery retain the notes', async ({ page }) => {
  await page.getByRole('button', { name: 'Create study set', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Add at least 10 characters');
  const notes = 'Explain the process of photosynthesis.';
  await page.getByRole('textbox', { name: 'Your notes or topic' }).fill(notes);
  await page.route('**/api/generate', (route) =>
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'MALFORMED_JSON',
          message: 'The model sent an incomplete response. Please try again.',
          retryable: true,
        },
      }),
    }),
  );
  await page.getByRole('button', { name: 'Create study set', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incomplete response');
  await expect(page.getByRole('textbox', { name: 'Your notes or topic' })).toHaveValue(notes);
  await page.getByRole('button', { name: 'Try again', exact: false }).first().click();
  await expect(page.getByRole('alert')).toContainText('incomplete response');
  await openExample(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a pending generation can be cancelled and an example opened', async ({ page }) => {
  await page.route('**/api/generate', () => new Promise(() => {}));
  await page
    .getByRole('textbox', { name: 'Your notes or topic' })
    .fill('Explain how the solar system works.');
  await page.getByRole('button', { name: 'Create study set', exact: true }).click();
  await expect(page.getByText('Finding the important things…')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel generation' }).click();
  await expect(page.getByRole('button', { name: 'Create study set', exact: true })).toBeVisible();
  await openExample(page);
});

test('theme persists, help closes with Escape, and the layout fits the viewport', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'How it works' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await openExample(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('an invalid health response reports unavailable status while examples remain usable', async ({
  page,
}) => {
  await page.route('**/api/health', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: 'true' }),
    }),
  );
  await page.reload();
  await expect(page.getByText('AI status unavailable', { exact: true })).toBeVisible();
  await openExample(page);
});

test('blocked browser storage keeps the study session and its progress usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage unavailable');
    };
  });
  await page.reload();
  await openExample(page);
  await expect(page.getByRole('status')).toContainText('This browser couldn’t save your changes');
  await expect(page.getByText('Available this session', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Flip card to reveal answer' }).click();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: 'My library', exact: true }).click();
  await expect(page.getByText('6 cards · 1 remembered')).toBeVisible();
  await page.getByRole('button', { name: 'Continue learning', exact: true }).click();
  await expect(page.getByText('17% of this set remembered', { exact: true })).toBeVisible();
});
