const checkPhoto = require("../googleVisionApi");

const carNumberOptions = (text, msg) => {
  return {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      remove_keyboard: true,
      one_time_keyboard: true,
      keyboard: [
        [
          {
            text: text,
            callback_data: msg
          }
        ],
        [
          {
            text: " ❌ Ne, nurodysiu"
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
      keyboard: [
        [
          {
            text: "Nurodykite savo vietą",
            request_location: true
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
