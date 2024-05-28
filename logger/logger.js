import Logger from '@ptkdev/logger';

class LoggerWithReports extends Logger {
  #logMessages = [];

  constructor(options) {
    super(options);
  }

  debug = (message, tag) => {
    super.debug(message, tag);
    this.#logMessages.push(`🐛 <b>[DEBUG]</b> ${message}`);
  };

  info = (message, tag) => {
    super.info(message, tag);
    this.#logMessages.push(`🔎 <b>[INFO]</b> ${message}`);
  };

  warning = (message, tag) => {
    super.warning(message, tag);
    this.#logMessages.push(`⚠️ <b>[WARN]</b> ${message}`);
  };

  error = (message, tag) => {
    super.error(message, tag);
    this.#logMessages.push(`❌ <b>[ERROR]</b> ${message}`);
  };

  logsAsReport = () => {
    return this.#logMessages.join('\r\n');
  };
}

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

const logger = new LoggerWithReports(options);

export default logger;
