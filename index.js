const dotenv = require('dotenv')
dotenv.config()

const Mongoose = require('mongoose')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const { CarModel } = require('./models')

Mongoose.connect('mongodb://localhost/ketpazeidimai')

const telegram = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN, { channelMode: false })

function timeConverter(UNIX_timestamp) {
    return new Date(UNIX_timestamp * 1000).toLocaleTimeString('lt-LT')
}

bot.command('start', async ctx => {
    const about = await telegram.getMe()
    return ctx.reply(`Welcome to ${about.username}!`)
})

bot.command('ket', async (ctx, next) => {
    const valstybinis_numeris = ctx.message.text.replace('/ket', '')
    if (valstybinis_numeris) {
        bot.context.valstybinis_numeris = valstybinis_numeris
        ctx.reply(`Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`)
        const car = new CarModel({
            plateNumber: valstybinis_numeris,
            time: timeConverter(ctx.message.date)
        })
        await car.save(function(err, { id }) {
            bot.context.pazeidimo_numeris = id
        })
        const chatId = ctx.chat.id
        telegram.sendMessage(
            chatId,
            `Įkelkite kelias nuotraukas kuriuose matosi automobilio valstybinis numeris`
        )
    } else {
        ctx.reply(`rašykite "/ket VALSTYBINIS AUTOMOBILIO NUMERIS"`)
    }
})

bot.on('location', async ctx => {
    const { location } = ctx.message
    console.log(location)
    await CarModel.updateOne(
        { _id: bot.context.pazeidimo_numeris },
        { location }
    )
    console.log(ctx.valstybinis_numeris)
    ctx.reply
})

bot.on('photo', async ctx => {
    const photos = ctx.message.photo
    const fileId = ctx.message.photo[photos.length - 1].file_id
    const link = await telegram.getFileLink(fileId)
    await CarModel.updateOne(
        { _id: bot.context.pazeidimo_numeris },
        { $push: { photos: { link } } }
    )
})

bot.launch()
