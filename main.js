import fs from 'fs/promises';
import logger from './logger/logger.js';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import adsOpenBrowser from './ads/openBrowser.js';
import playBlumGame from './games/blum.js';
import playIcebergGame from './games/iceberg.js';
import playHamsterGame from './games/hamster.js';
import TgClient from './bot/telegram.js';
import { config } from 'dotenv';
import { getGeneralProfile, updateProfileProxy } from './ads/profiles.js';
import { shuffleArray } from './utils/shuffle.js';
import { getRandomNumberBetween, randomDelay } from './utils/delay.js';
import { formatTime } from './utils/datetime.js';

(function play() {
  config();
  if (process.env.INIT_RUN == 'true') executeTask();
  scheduleTask();
})();

function scheduleTask() {
  const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
  logger.fireTime(`🕒 NEXT FIRE ON ${formatTime(taskTime)} 🕒`);
  const job = schedule.scheduleJob(taskTime, async () => {
    executeTask();
    job.cancel();
    scheduleTask();
  });
}

async function executeTask() {
  logger.info('Fired [execute] task', 'main');
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
    logger.info('Finish [execute] task', 'main');
    const { TG_TOKEN, TG_RECEIVER_ID } = process.env;
    const t = new TgClient(TG_TOKEN);
    await t.startPolling();
    await t.sendMessageToUser(logger.logsAsReport(), TG_RECEIVER_ID);
    await t.stopPolling();
  }
}

async function startPlayingGames(userId, tgApps) {
  const shuffledTgApps = shuffleArray(tgApps);
  logger.info(`Users queue: ${shuffledTgApps.map((app) => app.username).join(' > ')}`);
  for (const tgApp of shuffledTgApps) {
    if (tgApp.active) {
      logger.debug(`👍 #${tgApp.id} ${tgApp.username}`);
      const updateResult = await updateProfileProxy(userId, tgApp.proxy);
      if (updateResult.success) {
        logger.info(`Successfully updated proxy: ${JSON.stringify(updateResult.message)}`);
        const openResult = await adsOpenBrowser(userId);
        const browser = await puppeteer.connect({
          browserWSEndpoint: openResult?.data?.ws?.puppeteer,
          defaultViewport: null,
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
      logger.debug(`👎 #${tgApp.id} ${tgApp.username}`);
    }
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
