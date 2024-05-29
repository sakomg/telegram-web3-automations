import { delay, randomDelay } from '../utils/delay.js';
import { clickButton, hasElement, waitForButton } from '../utils/puppeteerHelper.js';
import logger from '../logger/logger.js';

const playBlumGame = async (browser, appUrl) => {
  logger.debug('🎮 Blum');

  let intervalId = null;
  const page = await browser.newPage();
  await page.waitForNetworkIdle();

  try {
    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(2000);

    try {
      intervalId = setInterval(async () => {
        await checkIssueAndResetIfNeeded(page);
      }, 5000);
      await claimRewards(page);
    } catch (error) {
      logger.error(`An error occurred during gameplay: ${error}`, 'blum');
    } finally {
      if (intervalId != null) clearInterval(intervalId);
      await clearLocalStorage(page);
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, 'blum');
  }
};

const claimRewards = async (page) => {
  const claimButtonXpath = "//button[contains(., 'Claim')]";
  const startFarmingButtonXpath = "//button[contains(., 'Start farming')]";
  const farmingButtonXpath = "//button[contains(., 'Farming')]";

  if (await waitForButton(page, claimButtonXpath)) {
    logger.info('Claim button found.', 'blum');
    await clickButton(page, claimButtonXpath);
    await randomDelay(1800, 2500);

    const hasStartFarmingButton = await hasElement(page, 'div.farming-buttons-wrapper > div > button > div.label');
    if (!hasStartFarmingButton) {
      await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });
    }
    if (await waitForButton(page, startFarmingButtonXpath, 10000)) {
      logger.info("'Start farming' button appeared after claiming. Clicking it...", 'blum');
      await clickButton(page, startFarmingButtonXpath);
    } else {
      logger.warning("'Start farming' button did not appear after claiming.", 'blum');
    }
  } else if (await waitForButton(page, startFarmingButtonXpath)) {
    logger.info('Start farming button found. Clicking it...', 'blum');
    await clickButton(page, startFarmingButtonXpath);
  } else if (await waitForButton(page, farmingButtonXpath)) {
    logger.info('Already farming.', 'blum');
  } else {
    logger.warning('No actionable button found.', 'blum');
  }
};

const checkIssueAndResetIfNeeded = async (page) => {
  try {
    const hasError = await hasElement(page, '.error.page > .title');
    if (hasError) {
      const resetButtonSelector = '.error.page > .reset';
      const resetButton = await page.waitForSelector(resetButtonSelector);
      if (resetButton) {
        await resetButton.click();
        await randomDelay(3100, 3500);
        logger.info('Page reset after error', 'blum');
      } else {
        logger.warning('Reset button not found on error page', 'blum');
      }
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
    logger.info('Local storage cleared.', 'blum');
  } catch (error) {
    logger.error(`Error clearing local storage: ${error}`, 'blum');
  }
};

export default playBlumGame;
