import playBlumGame from './blum';
import playHamsterGame from './hamster';
import playIcebergGame from './iceberg';

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
