require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const checkPhoto = require("./googleService");
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.NODE_TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "/echo [whatever]"
bot.on(/\/start (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  console.log(start);
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  // send back the matched "whatever" to the chat
  bot.sendMessage(
    chatId,
    "Sveiki, \n šis botas gali užregistruoti KET pažeidimą, nufotgrafuokite automobilį ir atsiųskite nuotraukas"
  );
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("text", msg => {
  const chatId = msg.chat.id;
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, "Received your text message!");
});

// bot.on('inline_query', (msg) => {
//   console.log(msg);
// })

bot.on("photo", async ({ photo, chat }) => {
  const chatId = chat.id;
  console.log(photo);
  const file_id = photo[3].file_id;
  const imagePath = await bot.getFile(file_id).then(response => {
    return response.file_path;
  });
  console.log(imagePath);
  const text = await checkPhoto(
    `https://api.telegram.org/file/bot${token}/${imagePath}`
  );
  bot.sendMessage(chatId, text.textDetection);
});
