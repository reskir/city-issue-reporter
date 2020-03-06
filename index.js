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
    const valstybinis_numeris = ctx.message.text
        .replace('/ket', '')
        .toUpperCase()
    if (valstybinis_numeris) {
        const chatId = ctx.chat.id
        await CarModel.findOne(
            { plateNumber: valstybinis_numeris },
            async function(err, res) {
                if (res) {
                    const { plateNumber, photos = [], time } = res
                    if (photos.length) {
                        telegram.sendPhoto(
                            chatId,
                            photos[0].file_id,
                            plateNumber
                        )
                    }
                    // const opts = {
                    //     reply_markup: {
                    //         inline_keyboard: [
                    //             [
                    //                 {
                    //                     text: 'Atnaujinti lokaciją',
                    //                     request_location: true
                    //                 },
                    //                 {
                    //                     text: 'Ne',
                    //                     callback_data: 'C1'
                    //                 }
                    //             ]
                    //         ]
                    //     }
                    // }
                    // telegram.sendMessage(
                    //     chatId,
                    //     `Ar norite atnaujinti pažeidėjo ${plateNumber} duomenys?`,
                    //     opts
                    // )
                    ctx.reply(
                        `Automobilis ${plateNumber} jau registruotas ${time}`
                    )
                } else {
                    bot.context.valstybinis_numeris = valstybinis_numeris
                    const car = new CarModel({
                        plateNumber: valstybinis_numeris,
                        time: timeConverter(ctx.message.date)
                    })
                    await car.save(function(err, { id }) {
                        bot.context.pazeidimo_numeris = id
                    })
                    ctx.reply(
                        `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`
                    )
                    ctx.reply(
                        `Įkelkite kelias 📸 kuriuose matosi automobilio valstybinis numeris`
                    )
                }
            }
        )
    } else {
        ctx.reply(`rašykite "/ket VALSTYBINIS AUTOMOBILIO NUMERIS"`)
    }
})

bot.on('location', async ctx => {
    if (bot.context.valstybinis_numeris) {
        const { location } = ctx.message
        await CarModel.updateOne(
            { _id: bot.context.pazeidimo_numeris },
            { location }
        )
    } else {
        ctx.reply('Pradžiai įveskit /ket [automobilio valstybinis numeris]')
    }
})

bot.on('photo', async ctx => {
    if (bot.context.valstybinis_numeris) {
        const photos = ctx.message.photo
        const fileId = ctx.message.photo[photos.length - 1].file_id
        const link = await telegram.getFileLink(fileId)
        await CarModel.updateOne(
            { _id: bot.context.pazeidimo_numeris },
            { $push: { photos: { link, file_id: fileId } } }
        )
    } else {
        ctx.reply('Pradžiai įveskit /ket [automobilio valstybinis numeris]')
    }
})

bot.launch()
