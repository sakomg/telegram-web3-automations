import Logger from '@ptkdev/logger';

class LoggerWithReports extends Logger {
  #logMessages = [];
  #time = null;

  constructor(options) {
    super(options);
  }

  debug = (message, tag) => {
    super.debug(message, tag);
    this.#logMessages.push(`🐛 <b>[DEBUG]</b> ${message}`);
  };

  warning = (message, tag) => {
    super.warning(message, tag);
    this.#logMessages.push(`⚠️ <b>[WARN]</b> ${message}`);
  };

  error = (message, tag) => {
    super.error(message, tag);
    this.#logMessages.push(`❌ <b>[ERROR]</b> ${message}`);
  };

  fireTime = (message) => {
    this.#time = message;
  };

  logsAsReport = () => {
    const res = this.#logMessages.join('\r\n');

    return `${res} \r\n ${this.#time}`;
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
