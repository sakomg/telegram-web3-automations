import Logger from '@ptkdev/logger';
import { stringify } from 'csv-stringify';

class LoggerWithReports extends Logger {
  #logMessages = [];

  constructor(options) {
    super(options);
  }

  debug = (message, tag) => {
    super.debug(message, tag);
    this.#logMessages.push(['DEBUG', message]);
  };

  warning = (message, tag) => {
    super.warning(message, tag);
    this.#logMessages.push(['WARN', message]);
  };

  error = (message, tag) => {
    super.error(message, tag);
    this.#logMessages.push(['ERROR', message]);
  };

  logsAsReport = () => {
    const logsAsString = this.#logMessages.map((log) => `⚙️ <b>[${log.at(0)}]</b> ${log.at(1)}`).join('\r\n');
    this.#logMessages = [];
    return logsAsString;
  };

  logsAsCSVBuffer = async () => {
    return new Promise((resolve, reject) => {
      stringify(this.#logMessages, { header: true, columns: ['Level', 'Message'] }, (err, output) => {
        if (err) {
          return reject(err);
        }
        const buffer = Buffer.from(output, 'utf8');
        resolve(buffer);
      });
    });
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
