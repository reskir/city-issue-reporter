require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const checkPhoto = require("./googleVisionApi");
const {
  carNumberOptions,
  locationOptions,
  getTextFromImage
} = require("./registerProlem/helpers");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.NODE_TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "/echo [whatever]"
bot.on(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  // send back the matched "whatever" to the chat
  bot.sendMessage(
    chatId,
    "Sveiki, \n šis botas gali užregistruoti KET pažeidimą, atsiųskite arba nufotgrafuokite pažeidėją"
  );
});

bot.onText(/\/start/, msg => {
  const opts = locationOptions(msg);
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Sveiki, \n šis botas gali užregistruoti KET pažeidimą, nufotgrafuokite automobilį ir atsiųskite nuotraukas"
  );
  //bot.sendMessage(msg.chat.id, "Kur įvyko KET parkavimo pažeidimas?", opts);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("text", msg => {
  const chatId = msg.chat.id;
  console.log(msg);
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, "👌");
});

bot.on("document", async ({ document, chat, message_id }) => {
  const chatId = chat.id;
  const file_id = document.file_id;

  return await getTextFromImage(bot, chatId, file_id, message_id, token);
});

bot.on("photo", async ({ chat, photo, message_id }) => {
  const chatId = chat.id;
  const file_id = photo[3].file_id; // this will take best quality image uploaded to telegram

  return await getTextFromImage(bot, chatId, file_id, message_id, token);
});
