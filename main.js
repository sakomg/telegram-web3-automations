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

config();

class ExecuteContainer {
  #initRun = process.env.INIT_RUN;
  #telegram = {
    client: null,
    token: process.env.TG_TOKEN,
    receiverId: process.env.TG_RECEIVER_ID,
  };

  constructor() {
    this.#telegram.client = new TgClient(this.#telegram.token);
  }

  play() {
    if (this.#initRun == 'true') this.executeTask();
    this.scheduleTask();
  }

  scheduleTask() {
    const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
    this.#telegram.client.sendAndPinMessage(`🕒 NEXT FIRE ON <b>${formatTime(taskTime)}</b> 🕒`, this.#telegram.receiverId);
    const job = schedule.scheduleJob(taskTime, async () => {
      this.executeTask();
      job.cancel();
      this.scheduleTask();
    });
  }

  async executeTask() {
    logger.info('Fired [execute] task', 'main');
    const result = await getGeneralProfile();
    if (!result.success) {
      logger.error(result.message);
      return;
    }
    try {
      const [_, tgApps] = await Promise.all([this.#telegram.client.startPolling(), fs.readFile('./data/apps.json', 'utf8')]);
      await this.startPlayingGames(result.message, JSON.parse(tgApps));
    } catch (e) {
      logger.error(e, 'main');
    } finally {
      logger.info('Finish [execute] task', 'main');
      await this.#telegram.client.stopPolling();
    }
  }

  async startPlayingGames(userId, tgApps) {
    const shuffledTgApps = shuffleArray(tgApps);
    logger.info(`Users queue: ${shuffledTgApps.map((app) => app.username).join(' > ')}`);
    for (const tgApp of shuffledTgApps) {
      if (tgApp.active) {
        logger.debug(`👍 #${tgApp.id}`);
        const updateResult = await updateProfileProxy(userId, tgApp.proxy);
        if (updateResult.success) {
          logger.info(`Successfully updated proxy: ${JSON.stringify(updateResult.message)}`);

          let openResult;
          let wsEndpoint;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries && !wsEndpoint) {
            try {
              openResult = await adsOpenBrowser(userId);
              wsEndpoint = openResult?.data?.ws?.puppeteer;
              if (!wsEndpoint) {
                throw new Error('WebSocket endpoint not found');
              }
            } catch (error) {
              logger.error(`Attempt ${retryCount + 1} failed: ${error.message}`);
              retryCount++;
              await randomDelay(1, 3, 's');
            }
          }

          if (wsEndpoint) {
            const browser = await puppeteer.connect({
              browserWSEndpoint: wsEndpoint,
              defaultViewport: null,
            });
            for (const [appName, appUrl] of Object.entries(tgApp.games)) {
              if (appUrl) {
                await this.defineAndRunApplication(browser, appName, appUrl);
              } else {
                logger.warning(`There is no link to the [${appName}] app`);
              }
            }
            await randomDelay(4, 8, 's');
            await browser.close();
          } else {
            logger.error(`Failed to open browser: WebSocket endpoint is not defined after ${maxRetries} attempts`);
          }
        } else {
          logger.error(updateResult.message);
        }
      } else {
        logger.debug(`👎 #${tgApp.id}`);
      }
      await this.#telegram.client.sendMessageToUser(logger.logsAsReport(), this.#telegram.receiverId);
    }
  }

  async defineAndRunApplication(browser, appName, appUrl) {
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
}

new ExecuteContainer().play();
