import fs from 'fs/promises';
import logger from './logger/logger.js';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import adsOpenBrowser from './ads/openBrowser.js';
import playBlumGame from './games/blum.js';
import playIcebergGame from './games/iceberg.js';
import playHamsterGame from './games/hamster.js';
import { getGeneralProfile, updateProfileProxy } from './ads/profiles.js';
import { sendMessageToUser, startPolling, stopPolling } from './bot/telegram.js';
import { shuffleArray } from './utils/shuffle.js';
import { getRandomNumberBetween, randomDelay } from './utils/delay.js';

(function scheduleTask() {
  const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
  logger.debug(`Fire on ${taskTime.getHours()}:${taskTime.getMinutes()}`);
  const job = schedule.scheduleJob(taskTime, async () => {
    await executeTask();
    job.cancel();
    scheduleTask();
  });
})();

async function executeTask() {
  logger.info('Start [execute] func', 'main');
  const result = await getGeneralProfile();
  if (!result.success) {
    logger.error(result.message);
    return;
  }
  const tgApps = await fs.readFile('./data/apps.json', 'utf8');
  try {
    await startPlayingGames(result.message, JSON.parse(tgApps));
  } catch (e) {
    logger.error(e, 'main');
  } finally {
    logger.info('Finish [execute] func', 'main');
    await startPolling();
    await sendMessageToUser(logger.logsAsReport());
    await stopPolling();
  }
}

async function startPlayingGames(userId, tgApps) {
  let iterationCounter = 1;
  const shuffledTgApps = shuffleArray(tgApps);
  logger.info(`Users queue: ${shuffledTgApps.map((app) => app.username).join(' > ')}`);
  for (const tgApp of shuffledTgApps) {
    if (tgApp.active) {
      logger.debug(`#${iterationCounter} ${tgApp.username} - in progress...`);
      const updateResult = await updateProfileProxy(userId, tgApp.proxy);
      if (updateResult.success) {
        logger.info(`Successfully updated proxy: ${JSON.stringify(updateResult.message)}`);
        const openResult = await adsOpenBrowser(userId);
        const browser = await puppeteer.connect({
          browserWSEndpoint: openResult?.data?.ws?.puppeteer,
        });
        for (const [appName, appUrl] of Object.entries(tgApp.games)) {
          if (appUrl) {
            await defineAndRunApplication(browser, appName, appUrl);
          } else {
            logger.warning(`There is no link to the [${appName}] app`);
          }
        }
        await randomDelay(4, 8, 's');
        await browser.close();
      } else {
        logger.error(updateResult.message);
      }
    } else {
      logger.debug(`#${iterationCounter} ${tgApp.username} - inactive`);
    }
    iterationCounter++;
  }
}

async function defineAndRunApplication(browser, appName, appUrl) {
  switch (appName) {
    case 'blum':
      await playBlumGame(browser, appUrl);
      break;
    case 'iceberg':
      await playIcebergGame(browser, appUrl);
      break;
    case 'hamster':
      await playHamsterGame(browser, appUrl);
      break;
    default:
      logger.warning(`[${appName}] don't supported yet`);
      break;
  }
}
