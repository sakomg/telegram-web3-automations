import { config } from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

config();
const { TG_TOKEN, TG_RECEIVER_ID } = process.env;
const bot = new TelegramBot(TG_TOKEN);

export async function sendMessageToUser(message, chatId = TG_RECEIVER_ID, mode = 'HTML') {
  await bot.sendMessage(chatId, message, { parse_mode: mode });
}

export async function startPolling() {
  await bot.startPolling();
}

export async function stopPolling() {
  await bot.stopPolling();
}
