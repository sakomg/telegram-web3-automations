import { hasElement } from '../utils/puppeteerHelper.js';
import { delay, randomDelay } from '../utils/delay.js';
import logger from '../logger/logger.js';

const playYescoinGame = async (browser, appUrl) => {
  logger.debug("🎮 i'm playing Yescoin");

  const page = await browser.newPage();
  await page.waitForNetworkIdle();
  await page.setJavaScriptEnabled(true);
  await page.setCacheEnabled(false);
  await page.goto(appUrl, { waitUntil: 'networkidle0' });
  await delay(1200);

  await processTabOnScreen(page);

  await page.close();
};

const processTabOnScreen = async (page) => {
  const taps = [
    { x: 100, y: 100 },
    { x: 200, y: 200 },
    { x: 300, y: 300 },
    { x: 400, y: 400 },
  ];

  while (true) {
    for (const tap of taps) {
      await page.mouse.click(tap.x, tap.y);
      // You can also use page.touchscreen.tap(tap.x, tap.y) if needed
    }
    await page.waitForTimeout(5000);
  }
};

export default playYescoinGame;
