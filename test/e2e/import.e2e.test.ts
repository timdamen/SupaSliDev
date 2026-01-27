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

      await page.keyboard.press('Meta+k');

      const modal = page.locator('[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      expect(await modal.isVisible()).toBe(true);

      const paletteContent = await modal.textContent();
      expect(paletteContent).toContain('Actions');
    });

    it('shows Import option in command palette', async () => {
      await page.goto(dashboardUrl);

      await page.keyboard.press('Meta+k');

      const modal = page.locator('[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      const importOption = page.getByText('Import', { exact: true });
      expect(await importOption.isVisible()).toBe(true);
    });

    it('opens import dialog when selecting Import from command palette', async () => {
      await page.goto(dashboardUrl);

      await page.keyboard.press('Meta+k');

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

      const validatingIndicator = page.locator('span.text-muted:has-text("Validating...")');
      if (await validatingIndicator.isVisible()) {
        await validatingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
      }

      await page.waitForTimeout(500);

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
});
