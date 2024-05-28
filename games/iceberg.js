import { delay, randomDelay } from '../utils/delay.js';
import { clickButton, waitForButton } from '../utils/puppeteerHelper.js';
import logger from '../logger/logger.js';

const playIcebergGame = async (browser, appUrl) => {
  logger.debug('🎮 Iceberg');

  const page = await browser.newPage();
  await page.waitForNetworkIdle();

  await page.goto(appUrl, { waitUntil: 'networkidle0' });
  try {
    await delay(1800);
    await checkAndClickButton(page);
    await delay(1200);
  } catch (e) {
    logger.error(e, 'iceberg');
  } finally {
    await page.close();
  }
};

async function checkAndClickButton(page) {
  const collectButtonXpath = "//button[contains(., 'Collect')]";
  const startFarmingButtonXpath = "//button[contains(., 'Start farming')]";
  const getAfterButtonXpath = "//button[contains(., 'Get after') and @disabled]";

  if (await waitForButton(page, collectButtonXpath)) {
    logger.info('Collect button found.', 'iceberg');
    await clickButton(page, collectButtonXpath);
    await randomDelay(1234, 1456);

    if (await waitForButton(page, startFarmingButtonXpath)) {
      logger.info("'Start farming' button appeared after collecting. Clicking it...", 'iceberg');
      await clickButton(page, startFarmingButtonXpath);
    } else {
      logger.warning("'Start farming' button did not appear after collecting.", 'iceberg');
    }
    return;
  }

  if (await waitForButton(page, startFarmingButtonXpath)) {
    logger.info('Start farming button found.', 'iceberg');
    await clickButton(page, startFarmingButtonXpath);
    return;
  }

  if (await waitForButton(page, getAfterButtonXpath)) {
    logger.info("'Get after...' button found but it is disabled.", 'iceberg');
    return;
  }

  logger.warning('No actionable button found.', 'iceberg');
}

export default playIcebergGame;
