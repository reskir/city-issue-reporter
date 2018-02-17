const checkPhoto = require("../googleVisionApi");

const carNumberOptions = (text, message_id) => {
  return {
    reply_to_message_id: message_id,
    reply_markup: {
      remove_keyboard: true,
      keyboard: [
        [
          {
            text: `✅ ${text}`
          }
        ],
        [
          {
            text: " ❌ Nurodyti"
          }
        ]
      ]
    }
  };
};

const locationOptions = msg => {
  return {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      remove_keyboard: true,
      keyboard: [
        [
          {
            text: "Toje vietoje kur esu dabar 👌"
          }
        ],
        [
          {
            text: "Pažymėti kitą vietą žemėlapyje 🗺"
          }
        ]
      ]
    }
  };
};

const getTextFromImage = async (bot, chatId, file_id, message_id, token) => {
  const imagePath = await bot.getFile(file_id).then(response => {
    return response.file_path;
  });

  const text = await checkPhoto(
    `https://api.telegram.org/file/bot${token}/${imagePath}`
  );

  if (text.automobileNumbers) {
    const opts = carNumberOptions(text.automobileNumbers, message_id);
    return bot.sendMessage(chatId, "Ar teisingi automolio numeriai?", opts);
  } else {
    return bot.sendMessage(chatId, text.textDetection);
  }
};

module.exports = { carNumberOptions, locationOptions, getTextFromImage };
