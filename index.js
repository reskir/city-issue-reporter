require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const checkPhoto = require("./googleVisionApi");
const sqlite = require("sqlite-sync"); //requiring
const get = require("lodash.get");

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
let uid;

sqlite.run(
  `CREATE TABLE IF NOT EXISTS parkers(
    id  INTEGER PRIMARY KEY AUTOINCREMENT, 
    key TEXT NOT NULL,
    from_id INTEGER,
    message_id INTEGER,
    firstName TEXT,
    lastName TEXT,
    telephone TEXT,
    imagePath TEXT,
    imageId TEXT,
    latitude INTEGER,
    longitude INTEGER
  );`,
  function(res) {
    if (res.error) throw res.error;
  }
);

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.NODE_TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, msg => {
  bot.sendMessage(
    msg.chat.id,
    `
      👋, šis botas gali užregistruoti KET pažeidimą.
      Įveskite /ket ir automobilio numerį ir botas pradės pažeidėjo registraciją, pvz. /ket ABC123
    `
  );
});

bot.onText(/\/ket (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  uid = resp.toUpperCase();
  sqlite.insert("parkers", {
    key: uid
  });
  bot.sendMessage(
    chatId,
    `
      Pažeidėjo numeris: ${uid}. Dabar pridėkite kelias nuotraukas.
    `
  );
});

// get photo
bot.on("photo", async msg => {
  const { message_id, chat, photo } = msg;
  const chatId = chat.id;
  const file_id = get(photo[3], "file_id"); // this will take best quality image uploaded to telegram
  const file_path = get(photo[3], "file_path");
  const result = await getTextFromImage(
    bot,
    chatId,
    file_id,
    message_id,
    token
  );

  sqlite.update(
    "parkers",
    {
      imageId: file_id,
      from_id: msg.from.id,
      imagePath: file_path
    },
    { key: uid }
  );

  bot.sendMessage(
    chatId,
    `Dabar nurodykite savo lokaciją`,
    locationOptions(msg)
  );

  // if (result.text.automobileNumbers) {
  //   if (isCarExists(result.text.automobileNumbers)) {
  //     bot.sendMessage(chatId, "Car exists!");
  //   } else {
  //     sqlite.update(
  //       "parkers",
  //       {
  //         imageId: file_id,
  //         from_id: msg.from.id,
  //         imagePath: file_path,
  //         firstName: chat.first_name,
  //         lastName: chat.last_name
  //       },
  //       (key = uid)
  //     );
  //     const opts = carNumberOptions(result.text.automobileNumbers, msg);
  //     bot.sendMessage(
  //       chatId,
  //       `Automobilio numeriai sutampa ${result.text.automobileNumbers} ?`,
  //       opts
  //     );
  //   }
  // } else {
  //   bot.sendMessage(chatId, `Nurodykite automobilio registracijos numerį`);
  // }
});

// bot.onText(/([a-zA-Z]{3}|[0-9]{3})/, msg => {
//   const opts = {
//     reply_to_message_id: msg.message_id,
//     reply_markup: {
//       remove_keyboard: true,
//       keyboard: [
//         [
//           {
//             text: "Nurodyti savo vietą",
//             request_location: true
//           }
//         ]
//       ]
//     }
//   };

//   bot.sendMessage(
//     msg.chat.id,
//     "Numeris įrašytas! Dabar nurodykite lokaciją",
//     opts
//   );
// });

// get user location
bot.on("location", msg => {
  sqlite.update(
    "parkers",
    {
      latitude: msg.location.latitude,
      longitude: msg.location.longitude
    },
    { key: uid }
  );

  const contactShare = {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      keyboard: [
        [
          {
            text:
              "Įdentifikuoti save (užtenka vardo, pavardės ir telefono numerio)",
            request_contact: true
          }
        ]
      ]
    }
  };
  bot.sendMessage(msg.chat.id, "Share your contact information", contactShare);
});

// get user contact
bot.on("contact", msg => {
  const { last_name, first_name, phone_number } = msg.contact;
  sqlite.update(
    "parkers",
    {
      telephone: phone_number,
      firstName: first_name,
      lastName: last_name
    },
    { key: uid }
  );
  const optRemove = {
    reply_markup: {
      remove_keyboard: true
    }
  };
  const photoId = sqlite.run(
    `SELECT imageId FROM parkers WHERE key = ? LIMIT 1`,
    [(key = uid)]
  );
  // console.log(photoId);
  console.log(photoId);
  bot.sendPhoto(msg.chat.id, photoId[0].imageId, {
    caption: `Automobilis valst. numeriu ${uid} – užregistruotas`
  });
  bot.sendMessage(
    msg.chat.id,
    "Ačiū, informacija įrašyta ir bus perduota nagrinėjimui!",
    optRemove
  );
});

bot.on("callback_query", msg => {
  bot.sendMessage(
    msg.message.chat.id,
    JSON.stringify(sqlite.run("SELECT * from parkers"))
  );
});

bot.onText(/\/specify (.+)/, msg => {
  bot.sendMessage(msg.chat.id, "Nurodykite automobilio numerius");
});

function isCarExists(key) {
  const data = sqlite.run("SELECT * FROM parkers WHERE key = ? LIMIT 1", [key]);
  if (data.length) {
    return true;
  }
  return false;
}

function addCar(key) {}

// bot.on("document", async ({ document, chat, message_id }) => {
//   const chatId = chat.id;
//   const file_id = document.file_id;
//   return await getTextFromImage(bot, chatId, file_id, message_id, token);
// });
