import 'dotenv/config';
import fs from 'node:fs/promises';
import logger from './logger/logger.js';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import adsOpenBrowser from './ads/openBrowser.js';
import playBlumGame from './games/blum.js';
import playIcebergGame from './games/iceberg.js';
import playHamsterGame from './games/hamster.js';
import TgClient from './bot/telegram.js';
import ReportGenerator from './reports/report.js';
import { getGeneralProfile, updateProfileProxy } from './ads/profiles.js';
import { shuffleArray } from './utils/shuffle.js';
import { getRandomNumberBetween, randomDelay } from './utils/delay.js';
import { formatTime } from './utils/datetime.js';

class ExecuteContainer {
  #initRun = process.env.INIT_RUN;
  #processedAccounts = new Set();
  #telegram = {
    client: null,
    token: process.env.TG_TOKEN,
    receiverId: process.env.TG_RECEIVER_ID,
  };

  constructor() {
    this.#telegram.client = new TgClient(this.#telegram.token);
  }

  play() {
    this.#initRun == 'true' ? this.executeTask() : this.scheduleTask();
  }

  scheduleTask() {
    const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
    this.#telegram.client.sendAndPinMessage(`🕒 NEXT FIRE ON <b>${formatTime(taskTime)}</b> 🕒`, this.#telegram.receiverId);
    const job = schedule.scheduleJob(taskTime, async () => {
      this.executeTask();
      job.cancel();
    });
  }

  async executeTask() {
    const result = await getGeneralProfile();
    if (!result.success) {
      logger.error(result.message);
      return;
    }
    try {
      const [_, tgApps] = await Promise.all([this.#telegram.client.startPolling(), fs.readFile('./data/apps.json', 'utf8')]);
      const tgApplications = JSON.parse(tgApps);
      const reportData = [];
      const totalResultGames = await this.startPlayingGames(result.message, tgApplications);
      reportData.push(...totalResultGames);
      const summaryText = this.prepareBriefSummaryText();
      await this.#telegram.client.sendMessage(summaryText, this.#telegram.receiverId);

      if (this.#processedAccounts.size == tgApplications.length) {
        logger.debug(`Success processed all accounts (${tgApplications.length}), scheduling process...`);
        const groupedGames = this.groupValuesByGame(reportData);
        await this.sendReports(groupedGames);
        this.#processedAccounts.clear();
        this.scheduleTask();
      } else {
        logger.debug(`Only ${this.#processedAccounts.size} accounts processed, run other again.`);
        this.executeTask();
      }
    } catch (e) {
      console.log(e);
      await this.#telegram.client.sendMessage(`😫 ${e}`, this.#telegram.receiverId);
    } finally {
      await this.#telegram.client.stopPolling();
    }
  }

  async startPlayingGames(profileUserId, tgApps) {
    const totalResultGames = [];

    for (const tgApp of shuffleArray(tgApps)) {
      if (this.#processedAccounts.has(tgApp.id)) {
        continue;
      }
      const rawResultGames = await this.playGamesByAccount(profileUserId, tgApp);
      if (rawResultGames.length) {
        const resultGames = this.prepareResultGames(rawResultGames, tgApp);
        totalResultGames.push(...resultGames);
        this.#processedAccounts.add(tgApp.id);
      }
    }

    return totalResultGames;
  }

  async playGamesByAccount(profileUserId, tgApp) {
    let resultGames = [];

    if (!tgApp.active) {
      logger.debug(`👎 #${tgApp.id}`);
      return resultGames;
    }

    logger.debug(`👍 #${tgApp.id}`);

    const updateResult = await updateProfileProxy(profileUserId, tgApp.proxy);

    if (!updateResult.success) {
      logger.error(updateResult.message);
      return resultGames;
    }

    logger.info(`Successfully updated proxy: ${JSON.stringify(updateResult.message)}`);

    let browser = undefined;
    const maxRetries = 3;
    const wsEndpoint = await this.establishWsEndpoint(profileUserId, maxRetries);

    if (!wsEndpoint) {
      logger.error(`Failed to open browser: WebSocket endpoint is not defined after ${maxRetries} attempts`);
    }

    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: null,
      });
    } catch (e) {
      logger.error(`Cannot connect to ${wsEndpoint}. ${e}`);
      return resultGames;
    }

    for (const [appName, appUrl] of Object.entries(tgApp.games)) {
      if (appUrl) {
        const resultGame = await this.runApp(browser, appName, appUrl);
        resultGames.push({
          game: appName,
          data: resultGame,
        });
      } else {
        logger.warning(`There is no link to the [${appName}] app`);
      }
    }
    await randomDelay(4, 8, 's');

    await browser.close();

    return resultGames;
  }

  async runApp(browser, appName, appUrl) {
    const nameToFunc = {
      blum: playBlumGame,
      iceberg: playIcebergGame,
      hamster: playHamsterGame,
    };

    const func = await nameToFunc[appName];

    if (!func) {
      throw new Error(`[${appName}] don't supported yet`);
    }

    return await func(browser, appUrl);
  }

  async establishWsEndpoint(profileUserId, maxRetries) {
    let openResult = undefined;
    let wsEndpoint = undefined;
    let retryCount = 0;

    while (retryCount < maxRetries && !wsEndpoint) {
      try {
        openResult = await adsOpenBrowser(profileUserId);
        if (openResult == null) {
          throw new Error('Cannot open ads power');
        }
        wsEndpoint = openResult?.data?.ws?.puppeteer;
        if (!wsEndpoint) {
          throw new Error('WebSocket endpoint not found');
        }
      } catch (error) {
        logger.error(`Attempt ${retryCount + 1} failed: ${error.message}`);
        retryCount++;
        await randomDelay(4, 8, 's');
      }
    }

    return wsEndpoint;
  }

  async sendReports(groupedGames) {
    const reportInstance = new ReportGenerator();
    for (const game in groupedGames) {
      const data = groupedGames[game];
      const report = reportInstance.generateReport(game, data);
      await this.#telegram.client.sendCSVDocument(report, this.#telegram.receiverId, game);
    }
  }

  prepareResultGames(resultGames, tgApp) {
    const result = [];

    if (!Array.isArray(resultGames)) {
      throw new Error('Variable <resultGame> must be array');
    }

    resultGames.forEach((item) => {
      const gameResultWithPerson = {
        ...item.data,
        Account: tgApp.id,
        User: tgApp.username,
      };

      result.push({
        game: item.game,
        data: gameResultWithPerson,
      });
    });

    return result;
  }

  prepareBriefSummaryText() {
    let summaryText = '🎮 Game Results Summary:\r\n\r\n';

    summaryText += `- Processed accounts (${this.#processedAccounts.size}): ${Array.from(this.#processedAccounts).join(' | ')}`;
    summaryText += '\r\n\r\n- 📂 Detailed reports are being sent as CSV files.';

    return summaryText.trim();
  }

  groupValuesByGame(inputArray) {
    const result = {};

    inputArray.forEach((item) => {
      const { game, data } = item;

      if (!result[game]) {
        result[game] = [];
      }

      result[game].push(data);
    });

    for (const game in result) {
      result[game] = result[game].map((element, index) => {
        return {
          ...element,
          Number: index + 1,
        };
      });
    }

    return result;
  }
}

new ExecuteContainer().play();
