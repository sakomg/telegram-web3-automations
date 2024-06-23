import { delay, randomDelay } from '../utils/delay.js';
import { clearLocalStorage, clickButton, hasElement, waitForButton } from '../utils/puppeteerHelper.js';
import logger from '../logger/logger.js';

const playBlumGame = async (browser, appUrl) => {
  logger.debug('🎮 Blum');

  const result = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
    Tickets: -1,
  };

  const page = await browser.newPage();
  await page.waitForNetworkIdle();

  try {
    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(7000);

    let intiBalance = '[None]';
    intiBalance = await extractBalance(page);

    if (intiBalance === '[None]') {
      const delayValue = 8000;
      logger.info(`Additional delay ${delayValue / 1000}s`);
      await delay(delayValue);
      intiBalance = await extractBalance(page);
      logger.debug(`💰 Balance ${intiBalance} (attempt 2)`);
    }

    result.BalanceBefore = intiBalance;

    try {
      const continueButtonXpath = "//button[contains(., 'Continue')]";
      if (await waitForButton(page, continueButtonXpath)) {
        logger.info('Daily rewards step', 'blum');
        await clickButton(page, continueButtonXpath);
        await randomDelay(2, 4, 's');
      }

      await claimRewards(page);
      const [currentBalance, currentTickets] = await Promise.all([extractBalance(page), extractTickets(page)]);
      result.BalanceAfter = currentBalance;
      result.Tickets = currentTickets;
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error}`, 'blum');
    } finally {
      await clearLocalStorage(page);
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, 'blum');
  }

  return result;
};

const claimRewards = async (page) => {
  const claimButtonXpath = "//button[contains(., 'Claim')]";
  const startFarmingButtonXpath = "//button[contains(., 'Start farming')]";
  const farmingButtonXpath = "//button[contains(., 'Farming')]";

  if (await waitForButton(page, claimButtonXpath)) {
    logger.info('Claim button found.', 'blum');
    await clickButton(page, claimButtonXpath);
    await randomDelay(2000, 2500);

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

const extractBalance = async (page) => {
  const value = await page.evaluate(() => {
    const elements = document.querySelectorAll('.kit-counter-animation.value .el-char');
    let result = '';
    elements.forEach((el) => {
      result += el.textContent;
    });
    return result;
  });

  return value || '[None]';
};

const extractTickets = async (page) => {
  const extractedValue = await page.evaluate(() => {
    const element = document.querySelector('.title-with-balance .pass');
    return element ? element.textContent.trim().replace(/\D/g, '') : null;
  });

  return extractedValue || '[None]';
};

export default playBlumGame;
