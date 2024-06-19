import Logger from '@ptkdev/logger';

class LoggerWithReports extends Logger {
  #logMessages = [];
  #logCounter = 0;
  #user = '[Blank]';

  constructor(options) {
    super(options);
  }

  setUser = (user) => {
    this.#user = user;
  };

  debug = (message, tag) => {
    super.debug(message, tag);
    this.#logCounter++;
    this.#logMessages.push([this.#logCounter, this.#user, 'DEBUG', message]);
  };

  warning = (message, tag) => {
    super.warning(message, tag);
    this.#logCounter++;
    this.#logMessages.push([this.#logCounter, this.#user, 'WARN', message]);
  };

  error = (message, tag) => {
    super.error(message, tag);
    this.#logCounter++;
    this.#logMessages.push([this.#logCounter, this.#user, 'ERROR', message]);
  };

  logsAsReport = () => {
    const logsAsString = this.#logMessages.map((log) => `⚙️ <b>[${log[3]}]</b> ${log[4]}`).join('\r\n');
    this.#logMessages = [];
    return logsAsString;
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
