'use strict'
const dotenv = require('dotenv')
dotenv.config()
const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const url = 'mongodb://127.0.0.1:27017/'

// Database Name
const dbName = 'ket_pazeidimai'

// Create a new MongoClient
const client = new MongoClient(url)
const telegram = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN, { channelMode: false })

client.connect(function(err, database) {
    assert.equal(null, err)
    console.log('Connected successfully to server')

    const db = client.db(dbName)
    const messages = db.collection('messages')

    bot.start(ctx => ctx.reply('Welcome!'))
    // bot.help(ctx => ctx.reply('Send me a sticker'))

    bot.command('ket', async (ctx, next) => {
        const valstybinis_numeris = ctx.message.text.replace('/ket', '')
        if (valstybinis_numeris) {
            bot.context.valstybinis_numeris = valstybinis_numeris
            ctx.reply(
                `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}, pridekitė porą nuotraukų kuriuose matosi pažeidimas ir valstybinis numeris`
            )
            messages.insertOne({
                auto_valstybinis_numeris: valstybinis_numeris,
                vartotojas: `${ctx.message.chat.first_name} ${ctx.message.chat.last_name}`
            })
        }
    })

    bot.on('location', ctx => {
        const { location } = ctx.message
        messages.updateOne(
            { auto_valstybinis_numeris: ctx.valstybinis_numeris },
            {
                $set: {
                    location: location
                }
            }
        )
    })

    bot.on('photo', async ctx => {
        const fileId = ctx.message.photo[2].file_id
        const link = await telegram.getFileLink(fileId)
        messages.updateOne(
            { auto_valstybinis_numeris: ctx.valstybinis_numeris },
            {
                $push: {
                    photo: {
                        link
                    }
                }
            }
        )
    })

    bot.launch()
})
