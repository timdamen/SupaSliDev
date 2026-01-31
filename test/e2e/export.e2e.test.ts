import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserContext, Page } from 'playwright';
import { existsSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  startDashboard,
  stopDashboardAsync,
  waitForServer,
  getBaseProjectPath,
  getTmpDir,
  cleanupProject,
  createBrowserContext,
} from './setup/test-utils.js';

describe('Export E2E', () => {
  const EXPORT_TEST_PROJECT = 'export-test';
  let context: BrowserContext;
  let page: Page;
  let dashboardUrl: string;
  let projectPath: string;

  beforeAll(async () => {
    cleanupProject(EXPORT_TEST_PROJECT);

    const baseProjectPath = getBaseProjectPath();
    projectPath = join(getTmpDir(), EXPORT_TEST_PROJECT);

    cpSync(baseProjectPath, projectPath, { recursive: true });

    context = await createBrowserContext();
    page = await context.newPage();

    const dashboardInfo = await startDashboard(projectPath);
    dashboardUrl = dashboardInfo.url;

    await waitForServer(dashboardUrl);
  }, 120000);

  afterAll(async () => {
    await context?.close();
    await stopDashboardAsync();
    cleanupProject(EXPORT_TEST_PROJECT);
  });

  async function cleanupExports() {
    const exportsDir = join(projectPath, 'exports');
    if (existsSync(exportsDir)) {
      rmSync(exportsDir, { recursive: true, force: true });
    }
  }

  describe('export via terminal command', () => {
    it('exports presentation to PDF via terminal', async () => {
      await cleanupExports();
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.fill('export test-deck');
      await terminalInput.press('Enter');

      const exportsDir = join(projectPath, 'exports');
      const pdfPath = join(exportsDir, 'test-deck.pdf');

      await expect
        .poll(() => existsSync(pdfPath), {
          message: 'PDF file should be created',
          timeout: 120000,
          interval: 1000,
        })
        .toBe(true);

      expect(existsSync(exportsDir)).toBe(true);
      expect(existsSync(pdfPath)).toBe(true);
    }, 150000);

    it('shows error toast for non-existent presentation', async () => {
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.focus();
      await terminalInput.fill('export non-existent-deck');
      await terminalInput.press('Enter');

      const toastTitle = page.locator('[data-slot="title"]').getByText('Presentation not found');
      await toastTitle.waitFor({ state: 'visible', timeout: 5000 });

      expect(await toastTitle.isVisible()).toBe(true);
    }, 30000);
  });

  describe('export via command palette', () => {
    it('exports presentation via command palette', async () => {
      await cleanupExports();
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      await page.keyboard.press('ControlOrMeta+k');
      const commandPalette = page.locator('[role="dialog"]').first();
      await commandPalette.waitFor({ state: 'visible', timeout: 5000 });

      const searchInput = commandPalette.locator('input');
      await searchInput.fill('export test');

      const exportOption = commandPalette.getByText('Export > test-deck');
      await exportOption.waitFor({ state: 'visible', timeout: 5000 });
      await exportOption.click();

      await page.waitForTimeout(300);

      const exportsDir = join(projectPath, 'exports');
      const pdfPath = join(exportsDir, 'test-deck.pdf');

      await expect
        .poll(() => existsSync(pdfPath), {
          message: 'PDF file should be created via command palette',
          timeout: 120000,
          interval: 1000,
        })
        .toBe(true);
    }, 150000);
  });

  describe('export via card button', () => {
    it('exports presentation via export button on card', async () => {
      await cleanupExports();
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const card = page.locator('.card').first();
      const exportButton = card.locator(
        'button:has-text("export"), .export-button, button[title*="export" i]',
      );

      if (await exportButton.isVisible()) {
        await exportButton.click();

        const exportsDir = join(projectPath, 'exports');
        const pdfPath = join(exportsDir, 'test-deck.pdf');

        await expect
          .poll(() => existsSync(pdfPath), {
            message: 'PDF file should be created via card button',
            timeout: 120000,
            interval: 1000,
          })
          .toBe(true);
      } else {
        console.log('Export button not visible on card - skipping card button test');
      }
    }, 150000);

    it('shows loading state during export', async () => {
      await cleanupExports();
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const card = page.locator('.card').first();
      const exportButton = card.locator(
        'button:has-text("export"), .export-button, button[title*="export" i]',
      );

      if (await exportButton.isVisible()) {
        await exportButton.click();

        const loadingIndicator = card.locator('.loading, [data-loading], .animate-spin, .spinner');
        const buttonDisabled = await exportButton.isDisabled();

        expect(buttonDisabled || (await loadingIndicator.isVisible().catch(() => false))).toBe(
          true,
        );

        const pdfPath = join(projectPath, 'exports', 'test-deck.pdf');
        await expect
          .poll(() => existsSync(pdfPath), { timeout: 120000, interval: 1000 })
          .toBe(true);
      }
    }, 150000);
  });

  describe('export file verification', () => {
    it('creates exports directory if it does not exist', async () => {
      await cleanupExports();
      const exportsDir = join(projectPath, 'exports');
      expect(existsSync(exportsDir)).toBe(false);

      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const terminalInput = page.locator('.terminal-input');
      await terminalInput.fill('export test-deck');
      await terminalInput.press('Enter');

      await expect
        .poll(() => existsSync(exportsDir), {
          message: 'Exports directory should be created',
          timeout: 120000,
          interval: 1000,
        })
        .toBe(true);
    }, 150000);

    it('overwrites existing PDF on re-export', async () => {
      await cleanupExports();
      await page.goto(dashboardUrl);
      await page.waitForSelector('.card');

      const terminalInput = page.locator('.terminal-input');
      const pdfPath = join(projectPath, 'exports', 'test-deck.pdf');

      await terminalInput.fill('export test-deck');
      await terminalInput.press('Enter');

      await expect.poll(() => existsSync(pdfPath), { timeout: 120000, interval: 1000 }).toBe(true);

      const { mtimeMs: firstMtime } = await import('node:fs').then((fs) =>
        fs.promises.stat(pdfPath),
      );

      await page.waitForTimeout(1000);

      await terminalInput.fill('export test-deck');
      await terminalInput.press('Enter');

      await expect
        .poll(
          async () => {
            if (!existsSync(pdfPath)) return false;
            const { mtimeMs } = await import('node:fs').then((fs) => fs.promises.stat(pdfPath));
            return mtimeMs > firstMtime;
          },
          {
            message: 'PDF should be overwritten with newer file',
            timeout: 120000,
            interval: 1000,
          },
        )
        .toBe(true);
    }, 300000);
  });
});
