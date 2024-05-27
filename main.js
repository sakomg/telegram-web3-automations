import { config } from 'dotenv';
import { getRandomDelayBetween } from './utils/delay.js';
import fs from 'fs/promises';
import logger from './logger/logger.js';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import adsMobileProfile from './ads/profiles.js';
import adsOpenBrowser from './ads/openBrowser.js';
import playBlumGame from './games/blum.js';
import playIcebergGame from './games/iceberg.js';

config();

const HOUR_IN_MS = 60 * 60 * 1000;
const minDelay = 8 * HOUR_IN_MS;
const maxDelay = 9 * HOUR_IN_MS;
const randomDelay = getRandomDelayBetween(minDelay, maxDelay);
const nextExecutionTime = new Date(Date.now() + randomDelay);

execute();
schedule.scheduleJob(nextExecutionTime, execute);
logger.info(`scheduled on ${nextExecutionTime.toString()}`);

async function execute() {
  logger.info('start <execute> func', 'main');
  const userId = await adsMobileProfile();
  const result = await adsOpenBrowser(userId);
  const browserPromise = puppeteer.connect({
    browserWSEndpoint: result?.data?.ws?.puppeteer,
  });
  const tgAppsPromise = fs.readFile('./data/apps.json', 'utf8');
  const [browser, tgApps] = await Promise.all([browserPromise, tgAppsPromise]);

  try {
    await startPlayingGames(browser, JSON.parse(tgApps));
  } catch (e) {
    logger.error(e, 'main');
  } finally {
    logger.info('finish <execute> func', 'main');
    await browser.close();
  }
}

async function startPlayingGames(browser, tgApps) {
  for (const tgApp of tgApps) {
    if (tgApp.active) {
      logger.info(`in progress [${tgApp.username}] user...`);
      for (const [appName, appUrl] of Object.entries(tgApp.games)) {
        if (appUrl) {
          await defineAndRunApplication(browser, appName, appUrl);
        } else {
          logger.warning(`there is no link to the [${appName}] app`);
        }
      }
    } else {
      logger.info(`skip inactive [${tgApp.username}] user...`);
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
    default:
      logger.warning(`[${appName}] don't supported yet`);
      break;
  }
}
