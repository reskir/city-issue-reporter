require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const checkPhoto = require("./googleVisionApi");
const sqlite = require("sqlite-sync"); //requiring

const {
  carNumberOptions,
  locationOptions,
  getTextFromImage
} = require("./registerProlem/helpers");

const express = require("express");
const app = express();

app.listen(process.env.PORT || 3000, () =>
  console.log("Example app listening on port localhost:3000!")
);

sqlite.connect("pazeidejai.db");

sqlite.run(
  `CREATE TABLE IF NOT EXISTS parkers(
    id  INTEGER PRIMARY KEY AUTOINCREMENT, 
    key TEXT NOT NULL,
    from_id INTEGER,
    message_id INTEGER,
    imagePath TEXT,
    imageId TEXT
  );`,
  function(res) {
    if (res.error) throw res.error;
  }
);

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.NODE_TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

app.get("/", (req, res) => {
  res.send("<h3>App is running</h3>");
});

bot.onText(/\/ket (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(
    chatId,
    `
      👋, šis botas gali užregistruoti KET pažeidimą, 
      atsiųskite arba nufotgrafuokite pažeidėjo 🚗.
    `
  );
});

bot.onText(/\/start/, msg => {
  const opts = locationOptions(msg);
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Sveiki, \n šis botas gali užregistruoti KET pažeidimą, nufotgrafuokite automobilį ir atsiųskite nuotraukas"
  );
  bot.sendMessage(msg.chat.id, "Kur įvyko KET parkavimo pažeidimas?", opts);
});

bot.on("callback_query", msg => {
  console.log(sqlite.run("SELECT * from parkers"));
  bot.sendMessage(msg.message.chat.id, "/success");
});

bot;

bot.onText(/\/specify (.+)/, msg => {
  bot.sendMessage(msg.chat.id, "write car number");
});

bot.on("document", async ({ document, chat, message_id }) => {
  const chatId = chat.id;
  const file_id = document.file_id;

  return await getTextFromImage(bot, chatId, file_id, message_id, token);
});

bot.on("photo", async ({ chat, photo, message_id }) => {
  const chatId = chat.id;
  const file_id = photo[3].file_id; // this will take best quality image uploaded to telegram
  const result = await getTextFromImage(
    bot,
    chatId,
    file_id,
    message_id,
    token
  );
  console.log(photo);
  if (result.text.automobileNumbers) {
    if (isCarExists(result.text.automobileNumbers)) {
      bot.sendMessage(chatId, "Car exists!");
    } else {
      const opts = carNumberOptions(
        result.text.automobileNumbers,
        message_id,
        result.imagePath
      );
      bot.sendMessage(
        chatId,
        `Automobilio numeriai sutampa ${result.text.automobileNumbers} ?`,
        opts
      );
      sqlite.insert("parkers", {
        key: result.text.automobileNumbers,
        imagePath: photo[3].file_path,
        imageId: photo[3].file_id
      });
    }
  } else {
    bot.sendMessage(chatId, `Nurodykite automobilio registracijos numerį`);
  }
});

function isCarExists(key) {
  const data = sqlite.run("SELECT * FROM parkers WHERE key = ? LIMIT 1", [key]);
  if (data.length) {
    return true;
  }
  return false;
}

function addCar(key) {}
