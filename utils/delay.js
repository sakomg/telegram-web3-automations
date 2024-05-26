function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function randomDelay(minDelay, maxDelay) {
  const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
  const nmb = Math.floor(randomDelay);
  await delay(nmb);
}

function getRandomDelayBetween(minDelay, maxDelay) {
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

export { delay, randomDelay, getRandomDelayBetween };
