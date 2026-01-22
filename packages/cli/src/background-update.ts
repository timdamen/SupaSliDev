import pc from 'picocolors';
import {
  CLI_VERSION,
  PACKAGE_NAME,
  fetchLatestVersion,
  compareVersions,
  checkForUpdatesCached,
} from './version.js';

export function startBackgroundUpdateCheck(): void {
  const cached = checkForUpdatesCached();
  if (cached.updateAvailable && cached.latestVersion) {
    scheduleNotification(cached.latestVersion);
    return;
  }

  fetchLatestVersion().then((latestVersion) => {
    if (latestVersion && compareVersions(CLI_VERSION, latestVersion)) {
      scheduleNotification(latestVersion);
    }
  });
}

function scheduleNotification(latestVersion: string): void {
  process.on('beforeExit', () => {
    printUpdateNotification(latestVersion);
  });
}

function printUpdateNotification(latestVersion: string): void {
  const boxWidth = 50;
  const border = '─'.repeat(boxWidth);

  console.log('');
  console.log(pc.yellow(border));
  console.log(pc.yellow(`  Update available: ${pc.dim(CLI_VERSION)} → ${pc.green(latestVersion)}`));
  console.log(pc.yellow(`  Run ${pc.cyan(`npm install -g ${PACKAGE_NAME}`)} to update`));
  console.log(pc.yellow(border));
}
