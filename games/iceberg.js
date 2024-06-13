import { delay, randomDelay } from '../utils/delay.js';
import { clickButton, clickLinkWithHref, waitForButton } from '../utils/puppeteerHelper.js';
import logger from '../logger/logger.js';
import { shuffleArray } from '../utils/shuffle.js';

const BLACK_LIST_TASKS = ['Invite 15 friends', 'Invite 10 friends', 'Invite 5 friends'];

const playIcebergGame = async (browser, appUrl) => {
  logger.debug('🌊 Iceberg');

  const page = await browser.newPage();
  await page.waitForNetworkIdle();

  page.on('popup', async (newPage) => {
    logger.info('New page opened. Closing it after 300ms delay');
    await delay(300);
    await newPage.close();
  });

  await page.goto(appUrl, { waitUntil: 'networkidle0' });
  try {
    await delay(1800);
    const initBalance = await extractBalance(page);
    logger.debug(`💰 Start ::: ${initBalance}`);
    await checkAndClaim(page);
    await delay(1200);
    await clickLinkWithHref(page, '/tasks');
    await completeTasks(page);
    await clickLinkWithHref(page, '/');
    await delay(2000);
    const actualBalance = await extractBalance(page);
    logger.debug(`💰 End ::: ${actualBalance}`);
    await delay(150000); // for test
  } catch (e) {
    logger.error(e, 'iceberg');
  } finally {
    await page.close();
  }
};

async function extractBalance(page) {
  const result = await page.evaluate(() => {
    const elements = document.querySelectorAll('h2.chakra-heading');
    const texts = Array.from(elements).map((element) => element.textContent.trim());
    return texts.join(' => ');
  });

  return result;
}

async function completeTasks(page) {
  const tasks = await extractTasks(page);
  logger.info('Total tasks to complete > ' + tasks.length);

  for (const task of shuffleArray(tasks)) {
    logger.info('Task > ' + task.title);
    await task.aElement.click();
    await randomDelay(3500, 5000);
  }

  logger.info('Performing tasks completed, random delay and claim all...');

  await randomDelay(7500, 10000);

  const collectButtons = await page.$$('.chakra-button.css-1wm9y8n');

  logger.info('Collect btns > ' + collectButtons.length);

  for (const btn of shuffleArray(collectButtons)) {
    await btn.click();
    await randomDelay(3500, 5000);
  }
}

const extractTasks = async (page) => {
  try {
    await page.waitForSelector('div.css-1kkt86i');

    const sections = await page.$$('div.css-1kkt86i');
    const tasksToComplete = [];

    for (const section of sections) {
      const sectionNameElement = await section.$('p.chakra-text.css-9pm0u3');
      const sectionName = sectionNameElement ? await (await sectionNameElement.getProperty('textContent')).jsonValue() : '';
      logger.info('Section Name >>> ' + sectionName);

      const taskElements = await section.$$('div.css-u68i74');

      for (const taskElement of taskElements) {
        const taskHeaderElement = await taskElement.$('p.chakra-text.css-1c1e297');
        const taskTitle = taskHeaderElement ? await (await taskHeaderElement.getProperty('textContent')).jsonValue() : 'N/A';
        logger.info('Task Title > ' + taskTitle);

        const aElement = await taskElement.$('a.chakra-link.css-19bzeh');
        if (aElement && !BLACK_LIST_TASKS.includes(taskTitle)) {
          tasksToComplete.push({
            title: taskTitle,
            aElement: aElement,
          });
        }
      }
    }

    return tasksToComplete;
  } catch (error) {
    logger.error('Error in extractTasks: ' + error);
    throw error;
  }
};

async function checkAndClaim(page) {
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
