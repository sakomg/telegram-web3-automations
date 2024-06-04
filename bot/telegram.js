import TelegramBot from 'node-telegram-bot-api';

export default class TgClient {
  #bot;

  constructor(token) {
    this.#bot = new TelegramBot(token);
  }

  async sendMessageToUser(message, chatId, mode = 'HTML') {
    await this.#bot.sendMessage(chatId, message, { parse_mode: mode });
  }

  async startPolling() {
    await this.#bot.startPolling();
  }

  async stopPolling() {
    await this.#bot.stopPolling();
  }
}
