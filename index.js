const dotenv = require("dotenv");
dotenv.config();
const Telegraf = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(ctx => ctx.reply("Welcome!"));
bot.help(ctx => ctx.reply("Send me a sticker"));
bot.hears("hi", ctx => ctx.reply("Hey there"));
bot.on("message", ctx =>
  ctx.reply(`${ctx.update.message.from.first_name}: ${ctx.update.message.text}`)
);
bot.launch();
