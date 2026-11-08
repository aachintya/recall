import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { examples } from '../../src/data/examples';

test('main learning screens pass automated WCAG A/AA checks in both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const check = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(result.violations).toEqual([]);
  };
  await check();
  await page.getByRole('button', { name: /The science of green/ }).click();
  await check();
  await page.getByRole('button', { name: /^Quiz/ }).click();
  await check();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await check();
  await page.getByRole('button', { name: 'My library' }).click();
  await check();
});

test('long but valid model text wraps safely on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const long = structuredClone(examples.react);
  long.title = 'T'.repeat(80);
  long.subject = 'S'.repeat(40);
  long.description = 'D'.repeat(240);
  long.cards[0] = { question: 'Q'.repeat(300), answer: 'A'.repeat(700), tag: 'C'.repeat(32) };
  long.quiz[0] = {
    question: 'Q'.repeat(400),
    options: ['A'.repeat(200), 'B'.repeat(200), 'C'.repeat(200), 'D'.repeat(200)],
    correctIndex: 1,
    explanation: 'E'.repeat(700),
  };
  await page.route('**/api/generate', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ set: long }),
    }),
  );
  await page.goto('/');
  const fits = async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  await fits();
  await page
    .getByRole('textbox', { name: 'Your notes or topic' })
    .fill('A deliberately difficult wrapping test.');
  await page.getByRole('button', { name: 'Create study set', exact: true }).click();
  await expect(page.getByRole('heading', { name: long.title })).toBeVisible();
  await fits();
  await page.getByRole('button', { name: 'Flip card to reveal answer' }).click();
  await fits();
  await page.getByRole('button', { name: /^Quiz/ }).click();
  await fits();
});
