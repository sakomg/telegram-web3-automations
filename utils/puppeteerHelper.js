export const hasElement = async (page, selector) => {
  const elements = await page.$$(selector);
  return elements.length > 0;
};
