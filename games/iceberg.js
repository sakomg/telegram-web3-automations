import { delay, getRandomDelayBetween, randomDelay } from '../utils/delay.js';
import logger from '../logger/logger.js';

const playIcebergGame = async (browser, appUrl) => {
  logger.debug("🎮 i'm playing Iceberg");

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
    logger.info('collect button found.', 'iceberg');
    await clickButton(page, collectButtonXpath);
    await randomDelay(1234, 1456);

    if (await waitForButton(page, startFarmingButtonXpath)) {
      logger.info("'start farming' button appeared after collecting. Clicking it...", 'iceberg');
      await clickButton(page, startFarmingButtonXpath);
    } else {
      logger.warning("'start farming' button did not appear after collecting.", 'iceberg');
    }
    return;
  }

  if (await waitForButton(page, startFarmingButtonXpath)) {
    logger.info('start farming button found.', 'iceberg');
    await clickButton(page, startFarmingButtonXpath);
    return;
  }

  if (await waitForButton(page, getAfterButtonXpath)) {
    logger.info('get after button found but it is disabled.', 'iceberg');
    return;
  }

  logger.warning('no actionable button found.', 'iceberg');
}

async function clickButton(page, xpath) {
  try {
    const element = await page.waitForSelector('xpath/' + xpath, { visible: true, timeout: 6000 });
    if (element) {
      await element.click();
    }
  } catch (error) {
    logger.error(`timeout waiting for button with XPath: ${xpath}`, 'iceberg');
  }
}

async function waitForButton(page, xpath, timeout = getRandomDelayBetween(1000, 2000)) {
  try {
    await page.waitForSelector('xpath/' + xpath, { visible: true, timeout });
    return true;
  } catch (e) {
    return false;
  }
}

export default playIcebergGame;
