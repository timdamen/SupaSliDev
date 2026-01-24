import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'playwright';
import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  startDashboard,
  stopDashboardAsync,
  waitForServer,
  getBaseProjectPath,
  getTmpDir,
  cleanupProject,
  launchBrowser,
} from './setup/test-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = join(__dirname, '..', '__snapshots__');

function ensureSnapshotsDir(): void {
  if (!existsSync(SNAPSHOTS_DIR)) {
    mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

async function takeScreenshot(page: Page, name: string): Promise<Buffer> {
  ensureSnapshotsDir();
  const screenshotPath = join(SNAPSHOTS_DIR, `${name}.png`);
  const screenshot = await page.screenshot({ fullPage: true });
  writeFileSync(screenshotPath, screenshot);
  return screenshot;
}

function createSecondPresentation(projectPath: string): void {
  const presentationsDir = join(projectPath, 'presentations');
  const secondPresentationDir = join(presentationsDir, 'second-deck');

  mkdirSync(secondPresentationDir, { recursive: true });

  const packageJson = {
    name: '@supaslidev/second-deck',
    private: true,
    type: 'module',
    scripts: {
      dev: 'slidev --open',
      build: 'slidev build',
      export: 'slidev export',
    },
    dependencies: {
      '@slidev/cli': 'catalog:',
      '@slidev/theme-default': 'catalog:',
      vue: 'catalog:',
    },
  };

  writeFileSync(join(secondPresentationDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  const slidesContent = `---
title: second-deck
theme: default
---

# second-deck

Welcome to the second presentation

---

## Slide 2

Content for the second slide
`;

  writeFileSync(join(secondPresentationDir, 'slides.md'), slidesContent);
  writeFileSync(join(secondPresentationDir, '.gitignore'), 'node_modules\ndist\n');
  writeFileSync(join(secondPresentationDir, '.npmrc'), 'shamefully-hoist=true\n');
}

describe('Dashboard Display E2E', () => {
  const DASHBOARD_TEST_PROJECT = 'dashboard-display-test';
  let browser: Browser;
  let page: Page;
  let dashboardUrl: string;
  let projectPath: string;

  beforeAll(async () => {
    cleanupProject(DASHBOARD_TEST_PROJECT);

    const baseProjectPath = getBaseProjectPath();
    projectPath = join(getTmpDir(), DASHBOARD_TEST_PROJECT);

    cpSync(baseProjectPath, projectPath, { recursive: true });

    browser = await launchBrowser();
    page = await browser.newPage();

    const dashboardInfo = await startDashboard(projectPath);
    dashboardUrl = dashboardInfo.url;

    await waitForServer(dashboardUrl);
  }, 120000);

  afterAll(async () => {
    await browser?.close();
    await stopDashboardAsync();
    cleanupProject(DASHBOARD_TEST_PROJECT);
  });

  describe('dashboard startup', () => {
    it('starts and loads without errors', async () => {
      const response = await page.goto(dashboardUrl);

      expect(response?.ok()).toBe(true);

      const pageTitle = await page.locator('h1').textContent();
      expect(pageTitle).toBe('Supaslidev');
    });

    it('takes initial screenshot of dashboard', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const screenshot = await takeScreenshot(page, 'dashboard-initial');
      expect(screenshot.length).toBeGreaterThan(0);
    });
  });

  describe('presentation display', () => {
    it('shows presentation name correctly', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const cardTitle = await page.locator('.card-title').first().textContent();
      expect(cardTitle).toBe('test-deck');
    });

    it('shows presentation card with expected elements', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const card = page.locator('.card').first();
      expect(await card.isVisible()).toBe(true);

      const cardTitle = card.locator('.card-title');
      expect(await cardTitle.isVisible()).toBe(true);

      const presentButton = card.locator('.present-button');
      expect(await presentButton.isVisible()).toBe(true);
    });

    it('each presentation card has a present button', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const cards = page.locator('.card');
      const cardCount = await cards.count();

      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const presentButton = card.locator('.present-button');

        expect(await presentButton.isVisible()).toBe(true);
        expect(await presentButton.textContent()).toContain('dev');
        expect(await presentButton.isEnabled()).toBe(true);
      }
    });
  });

  describe('multiple presentations', () => {
    beforeAll(async () => {
      createSecondPresentation(projectPath);

      await stopDashboardAsync();

      const dashboardInfo = await startDashboard(projectPath);
      dashboardUrl = dashboardInfo.url;

      await waitForServer(dashboardUrl);

      await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('.card');
    }, 60000);

    it('shows 2 presentation cards after creating second presentation', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const cards = page.locator('.card');
      const cardCount = await cards.count();

      expect(cardCount).toBe(2);
    });

    it('displays both presentation names correctly', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const cardTitles = await page.locator('.card-title').allTextContents();

      expect(cardTitles).toContain('test-deck');
      expect(cardTitles).toContain('second-deck');
    });

    it('each card in multiple presentations view has a present button', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const presentButtons = page.locator('.present-button');
      const buttonCount = await presentButtons.count();

      expect(buttonCount).toBe(2);

      for (let i = 0; i < buttonCount; i++) {
        const button = presentButtons.nth(i);
        expect(await button.isVisible()).toBe(true);
        expect(await button.textContent()).toContain('dev');
      }
    });

    it('takes screenshot with multiple presentations', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const screenshot = await takeScreenshot(page, 'dashboard-multiple-presentations');
      expect(screenshot.length).toBeGreaterThan(0);
    });
  });

  describe('UI elements', () => {
    it('has a New Presentation button', async () => {
      await page.goto(dashboardUrl);

      const newButton = page.locator('.btn-new');
      expect(await newButton.isVisible()).toBe(true);
      expect(await newButton.textContent()).toContain('new');
    });

    it('has a search input', async () => {
      await page.goto(dashboardUrl);

      const searchInput = page.locator('.filter-input input');
      expect(await searchInput.isVisible()).toBe(true);
      expect(await searchInput.getAttribute('placeholder')).toBe(
        'Search presentations by title...',
      );
    });

    it('search filters presentations correctly', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const searchInput = page.locator('.filter-input input');
      await searchInput.fill('second');

      await page.waitForTimeout(400);

      const visibleCards = page.locator('.card');
      expect(await visibleCards.count()).toBe(1);

      const cardTitle = await visibleCards.first().locator('.card-title').textContent();
      expect(cardTitle).toBe('second-deck');
    });
  });

  describe('terminal bar', () => {
    it('has a terminal input field', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      expect(await terminalInput.isVisible()).toBe(true);
      expect(await terminalInput.getAttribute('placeholder')).toBe('Type a command...');
    });

    it('shows ghost text autocomplete when typing', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('Ne');

      await page.waitForTimeout(100);

      const ghostText = page.locator('.ghost-suffix');
      expect(await ghostText.isVisible()).toBe(true);
      expect(await ghostText.textContent()).toBe('w');
    });

    it('shows dropdown with matching commands', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('Present');

      await page.waitForTimeout(100);

      const dropdown = page.locator('.dropdown');
      expect(await dropdown.isVisible()).toBe(true);

      const dropdownItems = page.locator('.dropdown-item');
      expect(await dropdownItems.count()).toBeGreaterThan(0);
    });

    it('clears input after executing command', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('new');
      await terminalInput.press('Enter');

      await page.waitForTimeout(200);

      expect(await terminalInput.inputValue()).toBe('');
    });
  });

  describe('terminal command validation', () => {
    it('shows warning toast for present command with non-existent presentation', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('present non-existent-deck');
      await terminalInput.press('Enter');

      const toastTitle = page.locator('[data-slot="title"]').getByText('Presentation not found');
      await toastTitle.waitFor({ state: 'visible', timeout: 5000 });

      expect(await toastTitle.isVisible()).toBe(true);
    });

    it('shows warning toast for export command with non-existent presentation', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('export non-existent-deck');
      await terminalInput.press('Enter');

      const toastTitle = page.locator('[data-slot="title"]').getByText('Presentation not found');
      await toastTitle.waitFor({ state: 'visible', timeout: 5000 });

      expect(await toastTitle.isVisible()).toBe(true);
    });

    it('shows warning toast for unknown command', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('unknowncommand');
      await terminalInput.press('Enter');

      const toastTitle = page.locator('[data-slot="title"]').getByText('Unknown command');
      await toastTitle.waitFor({ state: 'visible', timeout: 5000 });

      expect(await toastTitle.isVisible()).toBe(true);
    });

    it('opens create dialog when executing new command', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('new');
      await terminalInput.press('Enter');

      const dialog = page.locator('[role="dialog"]');
      await dialog.waitFor({ state: 'visible', timeout: 5000 });

      expect(await dialog.isVisible()).toBe(true);
    });
  });
});
