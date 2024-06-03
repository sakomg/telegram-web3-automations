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

export const clickDiv = async (page, selector, timeout = 20000) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    logger.info(`Div clicked with selector: ${selector}`);
    await randomDelay(1000, 2000);
    return true;
  } catch (error) {
    logger.error(`Timeout waiting for div with selector: ${selector}`);
    return false;
  }
};

export const waitForButton = async (page, xpath, timeout = 5000) => {
  try {
    await page.waitForSelector('xpath/' + xpath, { visible: true, timeout });
    return true;
  } catch (e) {
    return false;
  }
};

export const clickLinkWithHref = async (page, href) => {
  const xpath = `//a[@href="${href}"]`;
  const buttonFound = await waitForButton(page, xpath);
  if (buttonFound) {
    await clickButton(page, xpath);
    logger.info(`Clicked on link with href: ${href}`);
  } else {
    logger.warning(`Link with href ${href} not found.`);
  }
};

export const clearLocalStorage = async (page) => {
  try {
    await page.evaluate(() => {
      localStorage.clear();
    });
    logger.info('Local storage cleared.');
  } catch (error) {
    logger.error(`Error clearing local storage: ${error}`);
  }
};
