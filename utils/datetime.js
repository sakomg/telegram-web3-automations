import { getRandomDelayBetween } from './delay.js';

export function generateExecutionTime(format = 'datetime') {
  const HOUR_IN_MS = 60 * 60 * 1000;
  const minDelay = 8 * HOUR_IN_MS;
  const maxDelay = 9 * HOUR_IN_MS;
  const randomDelay = getRandomDelayBetween(minDelay, maxDelay);
  const nextExecutionTime = new Date(Date.now() + randomDelay);

  const formatToValue = {
    datetime: nextExecutionTime,
    localString: nextExecutionTime.toString(),
    timestamp: nextExecutionTime.getTime(),
  };

  return formatToValue[format];
}

export function currentTime(format = 'string') {
  let tzOffset = new Date().getTimezoneOffset() * 60000;

  if (format === 'json') {
    return new Date(Date.now() - tzOffset).toISOString();
  }

  if (format === 'timestamp') {
    return new Date(Date.now() - tzOffset).getTime();
  }

  return new Date(Date.now() - tzOffset).toISOString().slice(0, -5).replace('T', ' ');
}