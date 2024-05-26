import { hasElement, preparePage } from '../utils/puppeteerHelper.js';
import { delay, randomDelay } from '../utils/delay.js';
import logger from '../logger/logger.js';

const playBlumGame = async (browser, appUrl) => {
  logger.debug("🎮 i'm playing Blum");

  const origin = await browser.newPage();
  const page = await preparePage(origin);
  await page.goto(appUrl, { waitUntil: 'networkidle0' });
  await delay(1200);

  const intervalId = setInterval(() => {
    checkIssueAndResetIfNeeded(page);
  }, 5000);

  try {
    await claimAcrossFarm(page);
    await claimAcrossPlayingDropGame(page);
  } catch (error) {
    logger.error(`An error occurred during blum game: ${error}`, 'blum');
  } finally {
    clearInterval(intervalId);
    await page.close();
  }
};

const claimAcrossFarm = async (page) => {
  logger.info('> claimAcrossFarm', 'blum');

  const farmButtonLabelSelector = 'div.farming-buttons-wrapper > div > button > div.label > div > div:nth-child(1)';
  await page.waitForSelector(farmButtonLabelSelector);
  const farmButtonLabel = await page.$eval(farmButtonLabelSelector, (el) => el.innerText);
  logger.info('farmButtonLabel > ' + farmButtonLabel, 'blum');

  const farmButtonSelector = 'div.farming-buttons-wrapper > div > button';
  const farmButton = await page.waitForSelector(farmButtonSelector);

  if (farmButtonLabel.includes('Claim')) {
    await Promise.all([farmButton.click(), page.waitForNavigation()]);
    logger.info('clicked to claim', 'blum');
    await randomDelay(2100, 2500);
    await Promise.all([farmButton.click(), page.waitForNavigation()]);
    logger.info('clicked to start farming...', 'blum');
  } else if (farmButtonLabel.includes('Start farming')) {
    await Promise.all([farmButton.click(), page.waitForNavigation()]);
    logger.info('clicked to start farming...', 'blum');
  } else if (farmButtonLabel.includes('Farming')) {
    logger.info('has already been claimed...', 'blum');
  } else {
    logger.info('error in reading farm button label', 'blum');
  }
};

const claimAcrossPlayingDropGame = async (page) => {
  logger.info('> claimAcrossPlayingDropGame', 'blum');
};

const checkIssueAndResetIfNeeded = async (page) => {
  const hasError = await hasElement(page, '.error.page > .title');
  if (!hasError) {
    return;
  }

  const resetButtonSelector = '.error.page > .reset';
  const resetButton = await page.waitForSelector(resetButtonSelector);
  if (resetButton) {
    await Promise.all([page.waitForNavigation(), resetButton.click()]);
    await delay(1111);
  } else {
    logger.warning('reset button not found.', 'blum');
  }
};

export default playBlumGame;
