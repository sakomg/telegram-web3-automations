import { delay, getRandomNumberBetween, randomDelay } from '../utils/delay.js';
import { clearLocalStorage, clickButton, clickLinkWithHref, hasElement, waitForButton } from '../utils/puppeteerHelper.js';
import { shuffleArray } from '../utils/shuffle.js';
import logger from '../logger/logger.js';

// const MORSE_CODE = ['.', '-', '-', '.', ' ', '-', '-', '-', ' ', '-', '-', '-', ' ', '.', '-', '.', '.']; // 22.06
// const MORSE_CODE = ['.', '.', '.', ' ', '.', '-', '-', ' ', '.', '-', ' ', '.', '-', '-', '.']; // 23.06
// const MORSE_CODE = ['.', '-', ' ', '.', '-', '.', '.', ' ', '-']; // 24.06
const MORSE_CODE = ['.', '.', '-', '.', ' ', '-', '-', '-', ' ', '-', '-', ' ', '-', '-', '-']; // 25.06

const playHamsterGame = async (browser, appUrl) => {
  logger.debug('🐹 Hamster Kombat');

  const result = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
    ProfitPerHour: -1,
  };

  const page = await browser.newPage();
  await page.waitForNetworkIdle();

  try {
    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(8500);

    await repeatCheckAndReload(page, 3);

    const thanksButtonXpath = "//button[contains(., 'Thank you')]";
    const balanceSelector = 'div.user-balance-large > div > p';
    const profitPerHourSelector = 'div.price > div.price-value';

    if (await waitForButton(page, thanksButtonXpath, 3000)) {
      logger.info('> Thank you button found.');
      await clickButton(page, thanksButtonXpath);
      await randomDelay(1000, 2000);
    }

    let initialBalance = await extractValue(page, balanceSelector);
    logger.debug(`💰 Initial balance ${initialBalance}`);
    result.BalanceBefore = initialBalance;

    logger.info('Morse started');
    await morseTask(page);
    logger.info('Morse finished');

    await delay(2500);

    logger.info('Clicker start', 'hamster');
    await startRandomClick(page, 25, 100, 220);
    logger.info('Clicker stopped', 'hamster');
    await randomDelay(3, 5, 's');

    await clickLinkWithHref(page, '/clicker/mine');
    const tabsToFarm = ['Markets', 'PR&Team', 'Legal'];
    for (const tabName of shuffleArray(tabsToFarm)) {
      logger.info('> Tab to handle: ' + tabName);
      let balanceValue = await extractValue(page, balanceSelector);
      logger.info('>>> Actual balance: ' + balanceValue);
      await navigateToTab(page, tabName);
      await delay(1500);
      await processMineItems(page, balanceValue);
    }

    const balanceValueFinal = await extractValue(page, balanceSelector);
    const profitPerHourValue = await extractValue(page, profitPerHourSelector);

    result.BalanceAfter = balanceValueFinal;
    result.ProfitPerHour = profitPerHourValue;
    await randomDelay(2000, 3500);
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, 'hamster');
  } finally {
    await clearLocalStorage(page);
    await page.close();
  }

  return result;
};

async function repeatCheckAndReload(page, maxAttempts) {
  let reloadCount = 0;
  let reloadTimeouts = [7000, 9000, 15000];
  while (reloadCount < maxAttempts) {
    const timeout = reloadTimeouts[reloadCount];
    logger.info(`Reload checker: attempt ${reloadCount + 1}, timeout ${timeout}`);

    const shouldReload = await checkAndReload(page, timeout);

    logger.info(`Reload checker: should reload? ${shouldReload ? 'YES' : 'NO'}`);
    if (!shouldReload) {
      return;
    }

    reloadCount++;
  }

  throw new Error(`Maximum reload attempts (${maxAttempts}) reached.`);
}

async function checkAndReload(page, timeout) {
  const hasLoading = await hasElement(page, 'div.main > div.loading-launch');

  if (hasLoading) {
    await page.reload();
    await delay(timeout);
    return true;
  }

  return false;
}

async function extractValue(page, selector) {
  return await page.$eval(selector, (element) => {
    const text = element.textContent.trim().replace(/,/g, '');
    if (text.includes('K') || text.includes('k')) {
      return parseInt(parseFloat(text) * 1000);
    } else {
      return parseInt(text);
    }
  });
}

async function processMineItems(page, initialBalance) {
  let balance = initialBalance;
  const goAheadXpath = "//button[contains(., 'Go ahead')]";

  while (true) {
    const cards = [];
    const cardSelectors = '.upgrade-list > .upgrade-item:not(.is-disabled)';
    const cardElements = await page.$$(cardSelectors);
    logger.info('Active cards: ' + cardElements.length);

    if (cardElements.length === 0) {
      logger.info('No more clickable cards found.');
      break;
    }

    for (const element of cardElements) {
      const insufficientElement = await element.$('.upgrade-item-detail .price.is-grayscale');
      if (insufficientElement) {
        logger.info('Insufficient balance to click on this card, so just skip');
        continue;
      }
      const cardValueElement = await element.$('.upgrade-item-detail .price-value');
      const cardValue = await cardValueElement.evaluate((node) => {
        const text = node.textContent.trim().replace(/,/g, '');
        if (text.includes('K')) {
          return parseInt(parseFloat(text) * 1000);
        } else {
          return parseInt(text);
        }
      });
      cards.push({ element: element, value: cardValue });
    }

    cards.sort((a, b) => a.value - b.value);

    let currentTotal = 0;
    const cardsToClick = [];
    for (const card of cards) {
      if (currentTotal + card.value <= balance) {
        cardsToClick.push(card);
        currentTotal += card.value;
      } else {
        logger.info('Total value of cards to click: ' + currentTotal);
        break;
      }
    }

    if (cardsToClick.length === 0) {
      logger.info('Insufficient balance to click any more cards.');
      break;
    }

    logger.info('Cards which will click: ' + cardsToClick.length);

    for (const card of shuffleArray(cardsToClick)) {
      try {
        if (card.element) {
          await randomDelay(1500, 2000);
          await card.element.evaluate((element) => element.scrollIntoView());
          const box = await card.element.boundingBox();
          if (box) {
            await card.element.click({ clickCount: 1 });
          } else {
            logger.warning('Element is not visible or interactable.');
          }
          if (await waitForButton(page, goAheadXpath, 4000)) {
            await clickButton(page, goAheadXpath);
          }
          balance -= card.value;
        } else {
          logger.info('Not found card with value: ' + card.value);
        }
      } catch (e) {
        logger.info('Error in clicking card: ' + e);
      } finally {
        await randomDelay(2000, 3000);
      }
    }
  }

  return balance;
}

async function navigateToTab(page, tabName) {
  const tabXPath = `//div[contains(@class, 'tabs-item') and text()='${tabName}']`;

  const tabElement = await page.waitForSelector('xpath/' + tabXPath, { visible: true, timeout: 5000 });
  if (tabElement) {
    await tabElement.click();
  }
}

async function startRandomClick(page, energyThreshold, minInterval, maxInterval) {
  let elapsedTime = 0;
  let maxDuration = getRandomNumberBetween(1.1 * 60 * 1000, 1.3 * 60 * 1000);
  logger.info('Clicker duration: ' + (maxDuration / 60000).toFixed(2));

  const runLoop = async () => {
    await new Promise((resolve) => {
      setTimeout(async () => {
        elapsedTime += maxInterval;
        await checkEnergyAndClick(page, energyThreshold);
        resolve();
      }, getRandomNumberBetween(minInterval, maxInterval));
    });

    if (elapsedTime < maxDuration) {
      await runLoop();
    } else {
      elapsedTime = 0;
      maxDuration = getRandomNumberBetween(2 * 60 * 1000, 3 * 60 * 1000);
    }
  };

  await runLoop();
}

async function checkEnergyAndClick(page, energyThreshold) {
  const energySelector = '.user-tap-energy p';
  const buttonSelector = '.user-tap-button';
  const energyText = await page.$eval(energySelector, (el) => el.textContent);
  const energy = parseInt(energyText.split(' / ')[0]);

  if (energy > energyThreshold) {
    const button = await page.$(buttonSelector);
    const buttonBox = await button.boundingBox();
    const x = buttonBox.x + buttonBox.width / 2;
    const y = buttonBox.y + buttonBox.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
  }
}

async function morseTask(page) {
  await page.evaluate(() => {
    const attractionItem = document.querySelector('.user-attraction-item:nth-child(2)');

    if (attractionItem) {
      attractionItem.click();
    } else {
      logger.info('Attraction item not found');
    }
  });

  await delay(3000);

  const energySelector = '.user-tap-energy p';
  const buttonSelector = '.user-tap-button';
  const energyText = await page.$eval(energySelector, (el) => el.textContent);
  const energy = parseInt(energyText.split(' / ')[0]);
  const takeThePrizeXpath = "//button[contains(., 'Take')]";

  if (energy > 300) {
    const button = await page.$(buttonSelector);
    const buttonBox = await button.boundingBox();
    const x = buttonBox.x + buttonBox.width / 2;
    const y = buttonBox.y + buttonBox.height / 2;

    const shortClickDuration = 200;
    const longClickDuration = 600;
    const clickInterval = 400;
    const letterInterval = 800;

    for (let i = 0; i < 2; i++) {
      for (const symbol of MORSE_CODE) {
        if (symbol === '.') {
          await performClick(page, x, y, shortClickDuration);
        } else if (symbol === '-') {
          await performClick(page, x, y, longClickDuration);
        } else if (symbol === ' ') {
          await delay(letterInterval);
        }
        await delay(clickInterval);
      }

      if (await waitForButton(page, takeThePrizeXpath, 4000)) {
        await clickButton(page, takeThePrizeXpath);
      }

      await delay(3000);
    }
  }
}

async function performClick(page, x, y, duration) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await delay(duration);
  await page.mouse.up();
}

export default playHamsterGame;
