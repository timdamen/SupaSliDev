import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'playwright';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  startDashboard,
  stopDashboardAsync,
  waitForServer,
  getTmpDir,
  scaffoldProject,
  installDependencies,
  launchBrowser,
  createStandaloneSlidevProject,
  StandaloneSlidevProject,
} from './setup/test-utils.js';

const IMPORT_TEST_PROJECT = 'import-e2e-test';
const EXTERNAL_PROJECTS_DIR = 'external-slidev-projects';

interface InvalidProject {
  path: string;
  name: string;
}

function createProjectWithoutSlides(baseDir: string, name: string): InvalidProject {
  const projectPath = join(baseDir, name);
  mkdirSync(projectPath, { recursive: true });

  const packageJson = {
    name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'slidev',
    },
  };
  writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

  return { path: projectPath, name };
}

async function openImportDialog(page: Page, dashboardUrl: string): Promise<void> {
  await page.goto(dashboardUrl);

  const terminalInput = page.locator('.terminal-input');
  await terminalInput.focus();
  await terminalInput.fill('import');
  await terminalInput.press('Enter');

  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
}

interface ValidationWaitOptions {
  expectedText?: string;
  expectSuccess?: boolean;
  expectError?: boolean;
  timeout?: number;
}

async function waitForValidationComplete(
  page: Page,
  options: ValidationWaitOptions = {},
): Promise<void> {
  const { expectedText, expectSuccess, expectError, timeout = 5000 } = options;
  const dialog = page.locator('[role="dialog"]');
  const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');

  await dialog.waitFor({ state: 'visible', timeout });

  const successIcon = page.locator('.text-success').first();
  const errorIcon = page.locator('.text-error').first();

  await Promise.race([
    validatingIndicator.waitFor({ state: 'hidden', timeout }).catch(() => {}),
    expectSuccess ? successIcon.waitFor({ state: 'visible', timeout }) : Promise.resolve(),
    expectError ? errorIcon.waitFor({ state: 'visible', timeout }) : Promise.resolve(),
  ]);

  if (expectedText) {
    await page
      .locator(`[role="dialog"]:has-text("${expectedText}")`)
      .waitFor({ state: 'visible', timeout });
  }

  if (expectSuccess) {
    await successIcon.waitFor({ state: 'visible', timeout });
  }

  if (expectError) {
    await errorIcon.waitFor({ state: 'visible', timeout });
  }
}

describe('Import E2E', () => {
  let browser: Browser;
  let page: Page;
  let dashboardUrl: string;
  let projectPath: string;
  let externalProjectsPath: string;
  let standaloneProject1: StandaloneSlidevProject;
  let standaloneProject2: StandaloneSlidevProject;
  let projectWithoutSlides: InvalidProject;

  beforeAll(async () => {
    const tmpDir = getTmpDir();

    projectPath = join(tmpDir, IMPORT_TEST_PROJECT);
    if (existsSync(projectPath)) {
      rmSync(projectPath, { recursive: true, force: true });
    }

    externalProjectsPath = join(tmpDir, EXTERNAL_PROJECTS_DIR);
    if (existsSync(externalProjectsPath)) {
      rmSync(externalProjectsPath, { recursive: true, force: true });
    }
    mkdirSync(externalProjectsPath, { recursive: true });

    standaloneProject1 = createStandaloneSlidevProject(externalProjectsPath, 'external-deck-one');
    standaloneProject2 = createStandaloneSlidevProject(externalProjectsPath, 'external-deck-two');
    projectWithoutSlides = createProjectWithoutSlides(externalProjectsPath, 'no-slides-project');

    scaffoldProject(IMPORT_TEST_PROJECT);
    installDependencies(projectPath);

    browser = await launchBrowser();
    page = await browser.newPage();

    const dashboardInfo = await startDashboard(projectPath);
    dashboardUrl = dashboardInfo.url;

    await waitForServer(dashboardUrl);
  }, 120000);

  afterAll(async () => {
    await browser?.close();
    await stopDashboardAsync();

    if (existsSync(projectPath)) {
      rmSync(projectPath, { recursive: true, force: true });
    }

    if (existsSync(externalProjectsPath)) {
      rmSync(externalProjectsPath, { recursive: true, force: true });
    }
  });

  describe('test setup verification', () => {
    it('created two standalone Slidev projects', () => {
      expect(existsSync(standaloneProject1.path)).toBe(true);
      expect(existsSync(standaloneProject2.path)).toBe(true);
      expect(existsSync(join(standaloneProject1.path, 'package.json'))).toBe(true);
      expect(existsSync(join(standaloneProject2.path, 'package.json'))).toBe(true);
      expect(existsSync(join(standaloneProject1.path, 'slides.md'))).toBe(true);
      expect(existsSync(join(standaloneProject2.path, 'slides.md'))).toBe(true);
    });

    it('created fresh supaslidev workspace', () => {
      expect(existsSync(projectPath)).toBe(true);
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true);
      expect(existsSync(join(projectPath, 'presentations'))).toBe(true);
    });

    it('dashboard is running and accessible', async () => {
      const response = await page.goto(dashboardUrl);
      expect(response?.ok()).toBe(true);

      const pageTitle = await page.locator('h1').textContent();
      expect(pageTitle).toBe('Supaslidev');
    });
  });

  describe('import dialog access via terminal bar', () => {
    it('opens import dialog when typing "import" and pressing Enter', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('import');
      await terminalInput.press('Enter');

      const dialog = page.locator('[role="dialog"]');
      await dialog.waitFor({ state: 'visible', timeout: 5000 });

      expect(await dialog.isVisible()).toBe(true);

      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('Import');
    });

    it('shows "port" ghost text when typing "Im"', async () => {
      await page.goto(dashboardUrl);

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('Im');

      await page.waitForTimeout(100);

      const ghostText = page.locator('.ghost-suffix');
      expect(await ghostText.isVisible()).toBe(true);
      expect(await ghostText.textContent()).toBe('port');
    });
  });

  describe('import dialog access via command palette', () => {
    it('opens command palette with Cmd+K', async () => {
      await page.goto(dashboardUrl);

      await page.keyboard.press('ControlOrMeta+K');

      const modal = page.locator('[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      expect(await modal.isVisible()).toBe(true);

      const paletteContent = await modal.textContent();
      expect(paletteContent).toContain('Actions');
    });

    it('shows Import option in command palette', async () => {
      await page.goto(dashboardUrl);

      await page.keyboard.press('ControlOrMeta+K');

      const modal = page.locator('[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      const importOption = page.getByText('Import', { exact: true });
      expect(await importOption.isVisible()).toBe(true);
    });

    it('opens import dialog when selecting Import from command palette', async () => {
      await page.goto(dashboardUrl);

      await page.keyboard.press('ControlOrMeta+K');

      const commandPaletteModal = page.locator('[role="dialog"]');
      await commandPaletteModal.waitFor({ state: 'visible', timeout: 5000 });

      const importOption = commandPaletteModal.getByText('Import', { exact: true });
      await importOption.click();

      await page.waitForTimeout(300);

      const importDialog = page.locator('[role="dialog"]');
      await importDialog.waitFor({ state: 'visible', timeout: 5000 });

      expect(await importDialog.isVisible()).toBe(true);

      const dialogContent = await importDialog.textContent();
      expect(dialogContent).toContain('Import');
    });
  });

  describe('path validation', () => {
    it('shows suggested name when entering a valid path', async () => {
      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      await pathInput.fill(standaloneProject1.path);
      await pathInput.blur();

      await waitForValidationComplete(page, {
        expectedText: 'external-deck-one',
        expectSuccess: true,
      });

      const dialog = page.locator('[role="dialog"]');
      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('external-deck-one');

      const checkIcon = page.locator('.text-success');
      expect(await checkIcon.first().isVisible()).toBe(true);
    });

    it('shows error message when entering an invalid path (file instead of directory)', async () => {
      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      const slidesFilePath = join(standaloneProject1.path, 'slides.md');
      await pathInput.fill(slidesFilePath);
      await pathInput.blur();

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('Source path is not a directory');

      const errorIcon = page.locator('.text-error');
      expect(await errorIcon.first().isVisible()).toBe(true);
    });

    it('shows error message when entering a non-existent path', async () => {
      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      const nonExistentPath = '/path/that/does/not/exist/anywhere';
      await pathInput.fill(nonExistentPath);
      await pathInput.blur();

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('Source directory does not exist');

      const errorIcon = page.locator('.text-error');
      expect(await errorIcon.first().isVisible()).toBe(true);
    });

    it('shows error message when entering path without slides.md', async () => {
      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      await pathInput.fill(projectWithoutSlides.path);
      await pathInput.blur();

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('No slides.md found');

      const errorIcon = page.locator('.text-error');
      expect(await errorIcon.first().isVisible()).toBe(true);
    });
  });

  describe('multi-project import', () => {
    it('validates both projects when entering two comma-separated valid paths', async () => {
      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      const commaSeparatedPaths = `${standaloneProject1.path}, ${standaloneProject2.path}`;
      await pathInput.fill(commaSeparatedPaths);
      await pathInput.blur();

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('external-deck-one');
      expect(dialogContent).toContain('external-deck-two');

      const validIndicator = page.locator('text=2 of 2 valid');
      expect(await validIndicator.isVisible()).toBe(true);
    });

    it('imports both projects with progress indicator and shows them in dashboard', async () => {
      await page.goto(dashboardUrl);
      await page.waitForTimeout(500);

      let dashboardContent = await page.content();
      const alreadyImported =
        dashboardContent.includes('external-deck-one') &&
        dashboardContent.includes('external-deck-two');

      if (alreadyImported) {
        expect(dashboardContent).toContain('external-deck-one');
        expect(dashboardContent).toContain('external-deck-two');
        return;
      }

      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      const commaSeparatedPaths = `${standaloneProject1.path}, ${standaloneProject2.path}`;
      await pathInput.fill(commaSeparatedPaths);
      await pathInput.blur();

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

      const validIndicator = page.locator('text=2 of 2 valid');
      await validIndicator.waitFor({ state: 'visible', timeout: 5000 });

      const importButton = page.locator('button:has-text("Import 2 Presentations")');
      await importButton.click();

      const dialog = page.locator('[role="dialog"]');
      const progressIndicator = page.locator('p:has-text("Importing")');
      const errorSummary = page.locator('text=/\\d+ succeeded, \\d+ failed/');

      let sawProgress = false;
      const startTime = Date.now();
      const maxWaitTime = 120000;

      while (Date.now() - startTime < maxWaitTime) {
        const dialogVisible = await dialog.isVisible();

        if (!dialogVisible) {
          break;
        }

        if (!sawProgress && (await progressIndicator.isVisible())) {
          sawProgress = true;
          const progressText = await progressIndicator.textContent();
          expect(progressText).toMatch(/Importing \d+\/2/);
        }

        if (await errorSummary.isVisible()) {
          const dialogContent = await dialog.textContent();
          throw new Error(`Import failed with partial success: ${dialogContent}`);
        }

        await page.waitForTimeout(500);
      }

      const dialogStillVisible = await dialog.isVisible();
      if (dialogStillVisible) {
        const dialogContent = await dialog.textContent();
        throw new Error(`Dialog did not close within timeout: ${dialogContent}`);
      }

      const deckOneCard = page.locator('.card:has-text("external-deck-one")');
      const deckTwoCard = page.locator('.card:has-text("external-deck-two")');

      await deckOneCard.waitFor({ state: 'visible', timeout: 10000 });
      await deckTwoCard.waitFor({ state: 'visible', timeout: 10000 });

      expect(await deckOneCard.isVisible()).toBe(true);
      expect(await deckTwoCard.isVisible()).toBe(true);
    });

    it('shows mixed results when importing one valid and one invalid path', async () => {
      await openImportDialog(page, dashboardUrl);

      const pathInput = page.locator('input[placeholder="/path/to/presentation"]');
      const mixedPaths = `${standaloneProject1.path}, ${projectWithoutSlides.path}`;
      await pathInput.fill(mixedPaths);
      await pathInput.blur();

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const dialogContent = await dialog.textContent();
      expect(dialogContent).toContain('1 of 2 valid');

      const successIcon = page.locator('.text-success');
      expect(await successIcon.first().isVisible()).toBe(true);

      const errorIcon = page.locator('.text-error');
      expect(await errorIcon.first().isVisible()).toBe(true);
    });
  });
});
