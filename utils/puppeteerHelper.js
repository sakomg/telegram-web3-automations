import logger from '../logger/logger.js';

export const hasElement = async (page, selector) => {
  const elements = await page.$$(selector);
  return elements.length > 0;
};

export const clickButton = async (page, xpath, logTag) => {
  try {
    const element = await page.waitForSelector('xpath/' + xpath, { visible: true, timeout: 60000 });
    if (element) {
      await element.click();
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
