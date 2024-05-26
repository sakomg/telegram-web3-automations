import Logger from '@ptkdev/logger';

const options = {
  language: 'en',
  colors: true,
  debug: true,
  info: true,
  warning: true,
  error: true,
  sponsor: true,
  type: 'log',
  rotate: {
    size: '10M',
    encoding: 'utf8',
  },
};

const logger = new Logger(options);

export default logger;
