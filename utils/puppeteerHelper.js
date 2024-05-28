import logger from '../logger/logger.js';
import { randomDelay } from './delay.js';

export const hasElement = async (page, selector) => {
  const elements = await page.$$(selector);
  return elements.length > 0;
};

export const clickButton = async (page, xpath, logTag) => {
  try {
    const element = await page.waitForSelector('xpath/' + xpath, { visible: true, timeout: 60000 });
    if (element) {
      element.click();
      logger.info(`Button clicked with XPath: ${xpath}`);
      await randomDelay(1500, 2500);
      return true;
    }
  } catch (error) {
    logger.error(`Timeout waiting for button with XPath: ${xpath}`, logTag ?? 'helper');
  }
  return false;
};

export const waitForButton = async (page, xpath, timeout = 5000) => {
  try {
    await page.waitForSelector('xpath/' + xpath, { visible: true, timeout });
    return true;
  } catch (e) {
    return false;
  }
};
