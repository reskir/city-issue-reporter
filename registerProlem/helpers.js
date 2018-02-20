const checkPhoto = require("../googleVisionApi");

const carNumberOptions = (text, message_id) => {
  return {
    reply_to_message_id: message_id,
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: [
        [
          {
            text: `✅ Taip - ${text}`,
            callback_data: text
          }
        ],
        [
          {
            text: " ❌ Ne, nurodysiu",
            callback_data: text
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

  return {
    text: await checkPhoto(
      `https://api.telegram.org/file/bot${token}/${imagePath}`
    ),
    imagePath: `https://api.telegram.org/file/bot${token}/${imagePath}`
  };
};

module.exports = { carNumberOptions, locationOptions, getTextFromImage };
