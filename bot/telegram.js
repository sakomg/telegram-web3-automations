import TelegramBot from 'node-telegram-bot-api';

export default class TgClient {
  #bot;

  constructor(token) {
    this.#bot = new TelegramBot(token);
  }

  async sendMessageToUser(message, chatId, mode = 'HTML') {
    const MAX_LENGTH = 4096;

    if (message.length <= MAX_LENGTH) {
      await this.#bot.sendMessage(chatId, message, { parse_mode: mode });
    } else {
      let currentIndex = 0;
      let partIndex = 1;
      const totalParts = Math.ceil(message.length / MAX_LENGTH);

      while (currentIndex < message.length) {
        const nextChunk = message.substring(currentIndex, currentIndex + MAX_LENGTH);
        const partMessage = `Part ${partIndex} of ${totalParts}\n\n${nextChunk}`;
        await this.#bot.sendMessage(chatId, partMessage, { parse_mode: mode });
        currentIndex += MAX_LENGTH;
        partIndex++;
      }
    }
  }

  async sendAndPinMessage(message, chatId, mode = 'HTML') {
    const sentMessage = await this.#bot.sendMessage(chatId, message, { parse_mode: mode });
    if (sentMessage.message_id) {
      this.#bot.pinChatMessage(chatId, sentMessage.message_id, {
        disable_notification: false,
      });
    }
  }

  async sendCSV(buffer, chatId) {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const response = await this.#bot.sendDocument(
      chatId,
      buffer,
      {},
      {
        filename: `logs-${time}.csv`,
        contentType: 'text/csv',
      },
    );

    return response;
  }

  async startPolling() {
    await this.#bot.startPolling();
  }

  async stopPolling() {
    await this.#bot.stopPolling();
  }
}
