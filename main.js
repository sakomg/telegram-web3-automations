import 'dotenv/config';
import fs from 'node:fs/promises';
import logger from './logger/logger.js';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import playGame from './games/main.js';
import TgClient from './bot/telegram.js';
import ReportGenerator from './reports/report.js';
import { getGeneralProfile, updateProfileProxy, adsOpenBrowser } from './ads/api.js';
import { shuffleArray } from './utils/shuffle.js';
import { getRandomNumberBetween, randomDelay } from './utils/delay.js';
import { formatTime } from './utils/datetime.js';

class ExecuteContainer {
  #initRun = process.env.INIT_RUN === 'true';
  #processedAccounts = new Set();
  #reports = [];
  #telegram;

  constructor() {
    this.#validateEnv();
    this.#telegram = {
      client: new TgClient(process.env.TG_TOKEN),
      receiverId: process.env.TG_RECEIVER_ID,
    };
  }

  play() {
    this.#initRun ? this.executeTask() : this.scheduleTask();
  }

  scheduleTask() {
    const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
    this.#telegram.client.sendAndPinMessage(`🕒 NEXT FIRE ON <b>${formatTime(taskTime)}</b> 🕒`, this.#telegram.receiverId);
    const job = schedule.scheduleJob(taskTime, async () => {
      await this.executeTask();
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
      const totalResultGames = await this.startPlayingGames(result.message, tgApplications);
      this.#reports.push(...totalResultGames);
      const summaryText = this.prepareBriefSummaryText();
      await this.#telegram.client.sendMessage(summaryText, this.#telegram.receiverId);

      if (this.#processedAccounts.size === tgApplications.length) {
        logger.debug(`Success processed all accounts (${tgApplications.length}), scheduling process...`);
        const groupedGames = this.groupValuesByGame(this.#reports);
        await this.sendReports(groupedGames);
        this.clearAndScheduleTask();
      } else {
        logger.debug(`Only ${this.#processedAccounts.size} accounts processed, run others again.`);
        await this.executeTask();
      }
    } catch (e) {
      logger.error(e);
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
    if (!tgApp.active) {
      logger.debug(`👎 #${tgApp.id}`);
      return [];
    }

    logger.debug(`👍 #${tgApp.id}`);

    const updateResult = await updateProfileProxy(profileUserId, tgApp.proxy);
    if (!updateResult.success) {
      logger.error(updateResult.message);
      return [];
    }

    logger.info(`Successfully updated proxy: ${JSON.stringify(updateResult.message)}`);

    const wsEndpoint = await this.establishWsEndpoint(profileUserId, 3);
    if (!wsEndpoint) {
      logger.error(`Failed to open browser: WebSocket endpoint is not defined after 3 attempts`);
      return [];
    }

    let browser = null;

    try {
      browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    } catch (e) {
      logger.error(`Cannot connect to ws: ${wsEndpoint}`);
      logger.error(e);
      return [];
    }

    const resultGames = [];
    for (const [appName, appUrl] of Object.entries(tgApp.games)) {
      if (appUrl) {
        const resultGame = await playGame(appName, browser, appUrl);
        resultGames.push({ game: appName, data: resultGame });
      } else {
        logger.warn(`There is no link to the [${appName}] app`);
      }
    }
    await randomDelay(4, 8, 's');
    await browser.close();
    return resultGames;
  }

  async establishWsEndpoint(profileUserId, maxRetries) {
    let wsEndpoint;
    for (let attempt = 1; attempt <= maxRetries && !wsEndpoint; attempt++) {
      try {
        const openResult = await adsOpenBrowser(profileUserId);
        wsEndpoint = openResult?.data?.ws?.puppeteer;
        if (!wsEndpoint) {
          throw new Error('WebSocket endpoint not found');
        }
      } catch (error) {
        logger.error(`Attempt ${attempt} failed: ${error.message}`);
        await randomDelay(4, 8, 's');
      }
    }
    return wsEndpoint;
  }

  async sendReports(groupedGames) {
    const reportInstance = new ReportGenerator();
    for (const [game, data] of Object.entries(groupedGames)) {
      const report = reportInstance.generateReport(game, data);
      await this.#telegram.client.sendCSVDocument(report, this.#telegram.receiverId, game);
    }
  }

  prepareResultGames(resultGames, tgApp) {
    return resultGames.map((item) => ({
      game: item.game,
      data: {
        ...item.data,
        Account: tgApp.id,
        User: tgApp.username,
      },
    }));
  }

  prepareBriefSummaryText() {
    return `🎮 Game Results Summary:\r\n\r\n- Processed accounts (${this.#processedAccounts.size}): ${Array.from(
      this.#processedAccounts,
    ).join(' | ')}\r\n\r\n- 📂 Detailed reports are being sent as CSV files.`.trim();
  }

  groupValuesByGame(inputArray) {
    const grouped = inputArray.reduce((acc, { game, data }) => {
      if (!acc[game]) acc[game] = [];
      acc[game].push(data);
      return acc;
    }, {});

    Object.keys(grouped).forEach((game) => {
      grouped[game] = grouped[game].map((element, index) => ({ ...element, Number: index + 1 }));
    });

    return grouped;
  }

  clearAndScheduleTask() {
    this.#reports = [];
    this.#processedAccounts.clear();
    this.scheduleTask();
  }

  #validateEnv() {
    if (!process.env.TG_TOKEN || !process.env.TG_RECEIVER_ID) {
      throw new Error('Environment variables TG_TOKEN and TG_RECEIVER_ID must be set');
    }
  }
}

new ExecuteContainer().play();
