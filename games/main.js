import playBlumGame from './blum.js';
import playHamsterGame from './hamster.js';
import playIcebergGame from './iceberg.js';

export default async function playGame(appName, browser, appUrl) {
  const gameFunctions = {
    blum: playBlumGame,
    iceberg: playIcebergGame,
    hamster: playHamsterGame,
  };

  const func = gameFunctions[appName];
  if (!func) {
    throw new Error(`[${appName}] is not supported yet`);
  }

  return await func(browser, appUrl);
}
