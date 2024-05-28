import fs from 'fs/promises';
import logger from './logger/logger.js';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import adsOpenBrowser from './ads/openBrowser.js';
import playBlumGame from './games/blum.js';
import playIcebergGame from './games/iceberg.js';
import { generateExecutionTime } from './utils/datetime.js';
import { getGeneralProfile, updateProfileProxy } from './ads/profiles.js';
import { sendMessageToUser } from './bot/telegram.js';

execute();
schedule.scheduleJob(generateExecutionTime(), execute);
logger.info(`scheduled, first call in ${generateExecutionTime('localString')}`);

async function execute() {
  logger.info('start [execute] func', 'main');
  const userId = await getGeneralProfile();
  const tgApps = await fs.readFile('./data/apps.json', 'utf8');
  try {
    await startPlayingGames(userId, JSON.parse(tgApps));
  } catch (e) {
    logger.error(e, 'main');
  } finally {
    logger.info('finish [execute] func', 'main');
    sendMessageToUser(logger.logsAsReport());
  }
}

async function startPlayingGames(userId, tgApps) {
  let iterationCounter = 1;
  for (const tgApp of tgApps) {
    if (tgApp.active) {
      logger.info(`(${iterationCounter}) [${tgApp.username}] - in progress`);
      const updateResult = await updateProfileProxy('jic44wo', tgApp.proxy);
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
        await browser.close();
      } else {
        logger.error(updateResult.message);
      }
    } else {
      logger.info(`(${iterationCounter}) [${tgApp.username}] - inactive`);
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
    default:
      logger.warning(`[${appName}] don't supported yet`);
      break;
  }
}
