const hasElement = async (page, selector) => {
  const elements = await page.$$(selector);
  return elements.length > 0;
};

const preparePage = async (page) => {
  const client = await page.target().createCDPSession();
  await page.waitForNetworkIdle();
  await page.setJavaScriptEnabled(true);
  await page.setCacheEnabled(false);
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
};

export { hasElement, preparePage };
