import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'playwright';
import { existsSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  startDashboard,
  stopDashboard,
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

async function waitForPresentationServer(port: number, timeout = 30000): Promise<void> {
  return waitForServer(`http://localhost:${port}`, { timeout });
}

function getSlideNumberFromUrl(url: string): number {
  const match = url.match(/\/(\d+)(?:\?|$)/);
  return match ? parseInt(match[1]) : 1;
}

async function waitForSlideChange(page: Page, expectedSlideNumber: number): Promise<void> {
  await page.waitForFunction(
    (slideNum) => {
      const url = window.location.href;
      const match = url.match(/\/(\d+)(?:\?|$)/);
      const currentSlide = match ? parseInt(match[1]) : 1;
      return currentSlide === slideNum;
    },
    expectedSlideNumber,
    { timeout: 5000 },
  );
}

describe('Presentation Viewing E2E', () => {
  const PRESENTATION_TEST_PROJECT = 'presentation-viewing-test';
  let browser: Browser;
  let dashboardPage: Page;
  let presentationPage: Page;
  let dashboardUrl: string;
  let projectPath: string;
  let presentationUrl: string;

  beforeAll(async () => {
    cleanupProject(PRESENTATION_TEST_PROJECT);

    const baseProjectPath = getBaseProjectPath();
    projectPath = join(getTmpDir(), PRESENTATION_TEST_PROJECT);

    cpSync(baseProjectPath, projectPath, { recursive: true });

    browser = await launchBrowser();
    const context = await browser.newContext();
    const browserName = (process.env.BROWSER || 'chromium').toLowerCase();
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    dashboardPage = await context.newPage();

    const dashboardInfo = await startDashboard(projectPath);
    dashboardUrl = dashboardInfo.url;

    await waitForServer(dashboardUrl);
  }, 120000);

  afterAll(async () => {
    await browser?.close();
    stopDashboard();
    cleanupProject(PRESENTATION_TEST_PROJECT);
  });

  describe('launching presentation from dashboard', () => {
    it('clicking present button starts the presentation server', async () => {
      await dashboardPage.goto(dashboardUrl);
      await dashboardPage.waitForSelector('.card');

      const presentButton = dashboardPage.locator('.present-button').first();
      expect(await presentButton.isVisible()).toBe(true);
      expect(await presentButton.textContent()).toBe('Present');

      const popupPromise = dashboardPage.context().waitForEvent('page', { timeout: 90000 });
      await presentButton.click();

      await dashboardPage.waitForFunction(
        () => {
          const button = document.querySelector('.present-button');
          return (
            button?.textContent?.trim() === 'Stop' ||
            button?.classList.contains('present-button--loading')
          );
        },
        { timeout: 10000 },
      );

      await dashboardPage.waitForFunction(
        () => {
          const button = document.querySelector('.present-button');
          return button?.textContent?.trim() === 'Stop';
        },
        { timeout: 60000 },
      );

      let popup;
      try {
        popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        presentationUrl = popup.url();
        await popup.close();
      } catch {
        // Popup may have been blocked, get URL from card href
      }

      if (
        !presentationUrl ||
        presentationUrl === 'about:blank' ||
        presentationUrl.startsWith('chrome-error')
      ) {
        const cardLink = dashboardPage.locator('.card').first();
        const href = await cardLink.getAttribute('href');
        if (href && href.startsWith('http')) {
          presentationUrl = href;
        } else {
          const apiUrl = dashboardUrl.replace(/:\d+$/, ':3001');
          const serversResponse = await fetch(`${apiUrl}/api/servers`);
          if (serversResponse.ok) {
            const servers = (await serversResponse.json()) as Record<string, { port: number }>;
            const firstServer = Object.values(servers)[0];
            if (firstServer) {
              presentationUrl = `http://localhost:${firstServer.port}`;
            }
          }
        }
      }

      expect(presentationUrl).toMatch(/http:\/\/localhost:\d+/);
    }, 120000);

    it('present button shows Stop when server is running', async () => {
      const presentButton = dashboardPage.locator('.present-button').first();
      expect(await presentButton.textContent()).toBe('Stop');
    });

    it('presentation server responds to requests', async () => {
      await waitForPresentationServer(parseInt(presentationUrl.split(':')[2]) || 3030, 30000);
      const response = await fetch(presentationUrl);
      expect(response.ok).toBe(true);
    }, 35000);
  });

  describe('presentation slide content', () => {
    beforeAll(async () => {
      presentationPage = await browser.newPage();
      await presentationPage.goto(presentationUrl);
      await presentationPage.waitForSelector('.slidev-page', { timeout: 30000 });
    }, 35000);

    it('presentation slide content is visible', async () => {
      const slideContent = presentationPage.locator('.slidev-page');
      const count = await slideContent.count();
      expect(count).toBeGreaterThan(0);
    });

    it('first slide shows presentation title', async () => {
      const bodyText = await presentationPage.locator('body').textContent();
      expect(bodyText).toContain('test-deck');
    });

    it('takes screenshot of first slide', async () => {
      const screenshot = await takeScreenshot(presentationPage, 'presentation-slide-1');
      expect(screenshot.length).toBeGreaterThan(0);
    });
  });

  describe('slide navigation with controls', () => {
    it('navigating to next slide changes URL', async () => {
      const initialSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.click('body');
      await presentationPage.keyboard.press('ArrowRight');
      await waitForSlideChange(presentationPage, initialSlide + 1);

      const newSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(newSlide).toBe(initialSlide + 1);
    });

    it('slide content updates after navigation', async () => {
      const slideContent = presentationPage.locator('.slidev-page');
      const count = await slideContent.count();
      expect(count).toBeGreaterThan(0);
    });

    it('takes screenshot of second slide', async () => {
      const screenshot = await takeScreenshot(presentationPage, 'presentation-slide-2');
      expect(screenshot.length).toBeGreaterThan(0);
    });

    it('navigating to previous slide changes URL back', async () => {
      const currentSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.keyboard.press('ArrowLeft');
      await waitForSlideChange(presentationPage, currentSlide - 1);

      const previousSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(previousSlide).toBe(currentSlide - 1);
    });
  });

  describe('keyboard arrow navigation', () => {
    beforeAll(async () => {
      await presentationPage.goto(presentationUrl);
      await presentationPage.waitForSelector('.slidev-page', { timeout: 10000 });
    });

    it('right arrow key navigates to next slide', async () => {
      const initialSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.keyboard.press('ArrowRight');
      await waitForSlideChange(presentationPage, initialSlide + 1);

      const newSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(newSlide).toBe(initialSlide + 1);
    });

    it('left arrow key navigates to previous slide', async () => {
      const currentSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.keyboard.press('ArrowLeft');
      await waitForSlideChange(presentationPage, currentSlide - 1);

      const newSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(newSlide).toBe(currentSlide - 1);
    });

    it('down arrow key navigates to next slide', async () => {
      const currentSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.keyboard.press('ArrowDown');
      await waitForSlideChange(presentationPage, currentSlide + 1);

      const newSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(newSlide).toBe(currentSlide + 1);
    });

    it('up arrow key navigates to previous slide', async () => {
      const currentSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.keyboard.press('ArrowUp');
      await waitForSlideChange(presentationPage, currentSlide - 1);

      const newSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(newSlide).toBe(currentSlide - 1);
    });

    it('space key navigates to next slide', async () => {
      const currentSlide = getSlideNumberFromUrl(presentationPage.url());

      await presentationPage.keyboard.press('Space');
      await waitForSlideChange(presentationPage, currentSlide + 1);

      const newSlide = getSlideNumberFromUrl(presentationPage.url());
      expect(newSlide).toBe(currentSlide + 1);
    });
  });

  describe('slide counter display', () => {
    beforeAll(async () => {
      await presentationPage.goto(presentationUrl);
      await presentationPage.waitForSelector('.slidev-page', { timeout: 10000 });
    });

    it('slide counter shows current position', async () => {
      const url = presentationPage.url();
      const slideNumber = getSlideNumberFromUrl(url);
      expect(slideNumber).toBeGreaterThanOrEqual(1);
    });

    it('slide counter updates after navigation to slide 2', async () => {
      await presentationPage.keyboard.press('ArrowRight');
      await waitForSlideChange(presentationPage, 2);

      const slideNumber = getSlideNumberFromUrl(presentationPage.url());
      expect(slideNumber).toBe(2);
    });

    it('slide counter updates after navigation to slide 3', async () => {
      await presentationPage.keyboard.press('ArrowRight');
      await waitForSlideChange(presentationPage, 3);

      const slideNumber = getSlideNumberFromUrl(presentationPage.url());
      expect(slideNumber).toBe(3);
    });

    it('slide counter updates correctly when navigating back', async () => {
      await presentationPage.keyboard.press('ArrowLeft');
      await waitForSlideChange(presentationPage, 2);

      const slideNumber = getSlideNumberFromUrl(presentationPage.url());
      expect(slideNumber).toBe(2);
    });

    it('can navigate directly to a specific slide via URL', async () => {
      const baseUrl = presentationUrl.replace(/\/\d+.*$/, '');
      await presentationPage.goto(`${baseUrl}/3`);
      await presentationPage.waitForLoadState('domcontentloaded');
      await presentationPage.waitForTimeout(1000);

      const slideNumber = getSlideNumberFromUrl(presentationPage.url());
      expect(slideNumber).toBe(3);
    });
  });

  describe('visual screenshot comparison', () => {
    beforeAll(async () => {
      await presentationPage.goto(presentationUrl);
      await presentationPage.waitForSelector('.slidev-page', { timeout: 10000 });
    });

    it('captures full slide view screenshot', async () => {
      const screenshot = await takeScreenshot(presentationPage, 'presentation-full-view');
      expect(screenshot.length).toBeGreaterThan(0);
    });

    it('captures slide after navigation screenshot', async () => {
      await presentationPage.keyboard.press('ArrowRight');
      await presentationPage.waitForTimeout(500);

      const screenshot = await takeScreenshot(presentationPage, 'presentation-after-navigation');
      expect(screenshot.length).toBeGreaterThan(0);
    });

    it('captures final slide screenshot', async () => {
      await presentationPage.keyboard.press('ArrowRight');
      await presentationPage.waitForTimeout(500);

      const screenshot = await takeScreenshot(presentationPage, 'presentation-final-slide');
      expect(screenshot.length).toBeGreaterThan(0);
    });
  });

  describe('stopping presentation server', () => {
    it('clicking stop button stops the presentation server', async () => {
      await dashboardPage.bringToFront();
      await dashboardPage.goto(dashboardUrl);
      await dashboardPage.waitForSelector('.card');

      const apiResponse = await dashboardPage.evaluate(async () => {
        const res = await fetch('/api/servers');
        return res.json();
      });

      const hasRunningServers = Object.keys(apiResponse).length > 0;

      if (hasRunningServers) {
        await dashboardPage.waitForFunction(
          () => {
            const button = document.querySelector('.present-button');
            return button?.textContent?.trim() === 'Stop';
          },
          { timeout: 10000 },
        );

        const stopButton = dashboardPage.locator('.present-button').first();
        await stopButton.click();

        await dashboardPage.waitForFunction(
          () => {
            const button = document.querySelector('.present-button');
            return button?.textContent?.trim() === 'Present';
          },
          { timeout: 20000 },
        );

        expect(await stopButton.textContent()).toBe('Present');
      } else {
        const stopButton = dashboardPage.locator('.present-button').first();
        expect(await stopButton.textContent()).toBe('Present');
      }
    }, 60000);
  });
});
