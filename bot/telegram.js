import { config } from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

config();
const { TG_TOKEN, TG_RECEIVER_ID } = process.env;
const bot = new TelegramBot(TG_TOKEN, { polling: true });

export async function sendMessageToUser(message, chatId = TG_RECEIVER_ID, mode = 'HTML') {
  await bot.sendMessage(chatId, message, { parse_mode: mode });
}
