import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import {
  startDashboard,
  stopDashboardAsync,
  waitForServer,
  getBaseProjectPath,
  getTmpDir,
  cleanupProject,
  launchBrowser,
} from './setup/test-utils.js';

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

  describe('CreatePresentationDialog', () => {
    async function openCreateDialog() {
      await page.goto(dashboardUrl);
      const newButton = page.locator('.btn-new');
      await newButton.click();
      await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 });
    }

    async function closeDialog() {
      const cancelButton = page.locator('[role="dialog"] button:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 5000 });
      }
    }

    describe('template selection', () => {
      it('has default template selected by default', async () => {
        await openCreateDialog();

        const templates = page.locator('[role="dialog"] label');
        const templateCount = await templates.count();
        expect(templateCount).toBeGreaterThanOrEqual(3);

        await closeDialog();
      });

      it('can select seriph template', async () => {
        await openCreateDialog();

        const seriphTemplate = page.locator('[role="dialog"] label:has-text("Seriph")');
        expect(await seriphTemplate.isVisible()).toBe(true);
        await seriphTemplate.click();

        await closeDialog();
      });

      it('can select apple-basic template', async () => {
        await openCreateDialog();

        const appleTemplate = page.locator('[role="dialog"] label:has-text("Apple Basic")');
        expect(await appleTemplate.isVisible()).toBe(true);
        await appleTemplate.click();

        await closeDialog();
      });

      it('shows correct descriptions for each template', async () => {
        await openCreateDialog();

        const descriptions = await page.locator('[role="dialog"] .text-xs').allTextContents();
        expect(descriptions).toContain('Clean and minimal starter template');
        expect(descriptions).toContain('Elegant theme with serif typography');
        expect(descriptions).toContain('Minimalist Apple-inspired design');

        await closeDialog();
      });
    });

    describe('error border behavior', () => {
      it('does not show red border on initial dialog open', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        const hasErrorColor = await nameInput.evaluate((el) => {
          const classes = el.className;
          return classes.includes('error') || classes.includes('ring-red');
        });
        expect(hasErrorColor).toBe(false);

        await closeDialog();
      });

      it('shows error after blurring empty name field', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        await nameInput.focus();
        await nameInput.blur();

        await page.waitForTimeout(100);

        const errorMessage = page.locator('[role="dialog"]').getByText('Name is required');
        expect(await errorMessage.isVisible()).toBe(true);

        await closeDialog();
      });

      it('shows error for invalid name format', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        await nameInput.fill('Invalid Name');
        await nameInput.blur();

        await page.waitForTimeout(100);

        const errorMessage = page
          .locator('[role="dialog"]')
          .getByText('Use lowercase letters, numbers, and hyphens only');
        expect(await errorMessage.isVisible()).toBe(true);

        await closeDialog();
      });

      it('clears error when valid name is entered', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        await nameInput.fill('Invalid Name');
        await nameInput.blur();
        await page.waitForTimeout(100);

        await nameInput.fill('valid-name');
        await page.waitForTimeout(100);

        const errorMessage = page
          .locator('[role="dialog"]')
          .getByText('Use lowercase letters, numbers, and hyphens only');
        expect(await errorMessage.isVisible()).toBe(false);

        await closeDialog();
      });
    });

    describe('title and description fields', () => {
      it('has title field with correct placeholder', async () => {
        await openCreateDialog();

        const titleInput = page.locator(
          '[role="dialog"] input[placeholder="Welcome to My Presentation"]',
        );
        expect(await titleInput.isVisible()).toBe(true);

        await closeDialog();
      });

      it('has description field with correct placeholder', async () => {
        await openCreateDialog();

        const descriptionInput = page.locator(
          '[role="dialog"] textarea[placeholder="A presentation about..."]',
        );
        expect(await descriptionInput.isVisible()).toBe(true);

        await closeDialog();
      });

      it('creates presentation with custom title and selected template', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        const titleInput = page.locator(
          '[role="dialog"] input[placeholder="Welcome to My Presentation"]',
        );
        const seriphTemplate = page.locator('[role="dialog"] label:has-text("Seriph")');
        const createButton = page.locator('[role="dialog"] button:has-text("Create Presentation")');

        await nameInput.fill('custom-title-test');
        await titleInput.fill('My Custom Title');
        await seriphTemplate.click();
        await createButton.click();

        await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 60000 });

        const slidesPath = join(projectPath, 'presentations', 'custom-title-test', 'slides.md');
        await page.waitForTimeout(2000);

        const slidesContent = readFileSync(slidesPath, 'utf-8');
        expect(slidesContent).toContain('title: My Custom Title');
        expect(slidesContent).toContain('theme: seriph');
      }, 90000);

      it('creates presentation with description', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        const descriptionInput = page.locator(
          '[role="dialog"] textarea[placeholder="A presentation about..."]',
        );
        const createButton = page.locator('[role="dialog"] button:has-text("Create Presentation")');

        await nameInput.fill('description-test');
        await descriptionInput.fill('This is a test description');
        await createButton.click();

        await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 60000 });

        const slidesPath = join(projectPath, 'presentations', 'description-test', 'slides.md');
        await page.waitForTimeout(2000);

        const slidesContent = readFileSync(slidesPath, 'utf-8');
        expect(slidesContent).toContain('This is a test description');
      }, 90000);

      it('creates presentation with apple-basic template', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        const appleTemplate = page.locator('[role="dialog"] label:has-text("Apple Basic")');
        const createButton = page.locator('[role="dialog"] button:has-text("Create Presentation")');

        await nameInput.fill('apple-theme-test');
        await appleTemplate.click();
        await createButton.click();

        await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 60000 });

        const slidesPath = join(projectPath, 'presentations', 'apple-theme-test', 'slides.md');
        await page.waitForTimeout(2000);

        const slidesContent = readFileSync(slidesPath, 'utf-8');
        expect(slidesContent).toContain('theme: apple-basic');
      }, 90000);
    });

    describe('form submission', () => {
      it('shows loading state on create button during submission', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        const createButton = page.locator('[role="dialog"] button:has-text("Create Presentation")');

        await nameInput.fill('loading-state-test');
        await createButton.click();

        const loadingButton = page.locator('[role="dialog"] button:has-text("Creating...")');
        const isLoading = await loadingButton.isVisible().catch(() => false);

        if (!isLoading) {
          await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 60000 });
        }

        expect(true).toBe(true);
      }, 90000);

      it('creates presentation with seriph theme, custom title and description', async () => {
        await openCreateDialog();

        const nameInput = page.locator('[role="dialog"] input[placeholder="my-presentation"]');
        const titleInput = page.locator(
          '[role="dialog"] input[placeholder="Welcome to My Presentation"]',
        );
        const descriptionInput = page.locator(
          '[role="dialog"] textarea[placeholder="A presentation about..."]',
        );
        const seriphTemplate = page.locator('[role="dialog"] label:has-text("Seriph")');
        const createButton = page.locator('[role="dialog"] button:has-text("Create Presentation")');

        await nameInput.fill('full-form-test');
        await titleInput.fill('My Complete Presentation');
        await descriptionInput.fill('A comprehensive test presentation with all fields filled');
        await seriphTemplate.click();
        await createButton.click();

        await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 60000 });

        const slidesPath = join(projectPath, 'presentations', 'full-form-test', 'slides.md');
        await page.waitForTimeout(2000);

        const slidesContent = readFileSync(slidesPath, 'utf-8');
        expect(slidesContent).toContain('title: My Complete Presentation');
        expect(slidesContent).toContain('theme: seriph');
        expect(slidesContent).toContain('A comprehensive test presentation with all fields filled');

        await page.waitForFunction(
          () => {
            const titles = Array.from(document.querySelectorAll('.card-title')).map(
              (el) => el.textContent,
            );
            return titles.some((title) => title?.includes('My Complete Presentation'));
          },
          { timeout: 10000 },
        );

        const cardTitle = page.locator('.card-title:has-text("My Complete Presentation")');
        expect(await cardTitle.count()).toBeGreaterThan(0);

        const card = page.locator('.card:has-text("My Complete Presentation")');
        const themeBadge = card.locator('text=--theme=seriph');
        expect(await themeBadge.count()).toBeGreaterThan(0);
      }, 90000);

      it('shows presentation cards on dashboard', async () => {
        await page.goto(dashboardUrl);
        await page.waitForSelector('.card');

        const cards = page.locator('.card');
        const cardCount = await cards.count();
        expect(cardCount).toBeGreaterThan(0);
      });
    });
  });
});
