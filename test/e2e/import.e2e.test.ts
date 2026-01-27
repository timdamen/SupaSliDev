import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'playwright';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
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

describe('Import E2E', () => {
  let browser: Browser;
  let page: Page;
  let dashboardUrl: string;
  let projectPath: string;
  let externalProjectsPath: string;
  let standaloneProject1: StandaloneSlidevProject;
  let standaloneProject2: StandaloneSlidevProject;

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
});
