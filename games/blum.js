import { hasElement } from '../utils/puppeteerHelper.js';
import { delay, randomDelay } from '../utils/delay.js';
import logger from '../logger/logger.js';

const playBlumGame = async (browser, appUrl) => {
  logger.debug('🎮 Blum');

  const page = await browser.newPage();
  await page.waitForNetworkIdle();

  try {
    await page.goto(appUrl, { waitUntil: 'networkidle0' });
    await delay(1200);

    const intervalId = setInterval(async () => {
      await checkIssueAndResetIfNeeded(page);
    }, 5000);

    try {
      await claimAcrossFarm(page);
    } catch (error) {
      logger.error(`An error occurred during blum gaming: ${error}`, 'blum');
    } finally {
      await clearLocalStorage(page);
      clearInterval(intervalId);
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, 'blum');
  }
};

const claimAcrossFarm = async (page) => {
  logger.info('> claimAcrossFarm', 'blum');

  const farmButtonLabelSelector = 'div.farming-buttons-wrapper > div > button > div.label > div > div:nth-child(1)';
  const farmButtonSelector = 'div.farming-buttons-wrapper > div > button';

  try {
    await page.waitForSelector(farmButtonLabelSelector);
    const farmButtonLabel = await page.$eval(farmButtonLabelSelector, (el) => el.innerText);
    logger.info('farmButtonLabel > ' + farmButtonLabel, 'blum');

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
      logger.warning('Unknown farm button label state', 'blum');
    }
  } catch (error) {
    logger.error(`Error in claimAcrossFarm: ${error}`, 'blum');
  }
};
const checkIssueAndResetIfNeeded = async (page) => {
  try {
    const hasError = await hasElement(page, '.error.page > .title');
    if (!hasError) {
      return;
    }

    const resetButtonSelector = '.error.page > .reset';
    const resetButton = await page.waitForSelector(resetButtonSelector);
    if (resetButton) {
      await Promise.all([resetButton.click(), page.waitForNavigation({ waitUntil: 'networkidle0' })]);
      await delay(1111);
      logger.info('Page reset after error', 'blum');
    } else {
      logger.warning('Reset button not found on error page', 'blum');
    }
  } catch (error) {
    logger.error(`Error in checkIssueAndResetIfNeeded: ${error}`, 'blum');
  }
};

const clearLocalStorage = async (page) => {
  try {
    await page.evaluate(() => {
      localStorage.clear();
    });
    logger.info('Local storage cleared', 'blum');
  } catch (error) {
    logger.error(`Error clearing local storage: ${error}`, 'blum');
  }
};

export default playBlumGame;
