import fetch from 'node-fetch'
import Mongoose from 'mongoose'
import Telegraf from 'telegraf'
import Telegram from 'telegraf/telegram'
import { UserModel, TicketModel } from './models'
import Markup from 'telegraf/markup'
import Extra from 'telegraf/extra'
import {
    getAllUserTickets,
    updateTicket,
    getStatusMessage
} from './helpers/helpers'
import { registerKet } from './src/commands/ket'
import { addPhoto } from './src/commands/addPhoto'
import fs from 'fs'

const { BOT_TOKEN } = process.env

if (!BOT_TOKEN) {
    console.error(
        'Seems like you forgot to pass Telegram Bot Token. I can not proceed...'
    )
    process.exit(1)
}

Mongoose.connect(process.env.DB_URL, {
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Now connected to MongoDB!'))
    .catch(err => console.error('Something went wrong', err))

const telegram = new Telegram(BOT_TOKEN)
const bot = new Telegraf(BOT_TOKEN, { channelMode: false })

bot.command('start', async ctx => {
    const { id, first_name, last_name } = ctx.message.from
    const user = await UserModel.findOne({
        userId: id
    })
    if (!user) {
        UserModel.create(
            {
                userId: id,
                name: first_name,
                surname: last_name,
                tickets: []
            },
            function(err) {
                if (!err) {
                    ctx.reply(
                        `Sveiki, pradėkite registuoti KET pažeidimą su /ket [valstybinis numeris] komanda. Atmintinė kaip teisingai pranešti apie pažeidimą 👉 https://tvarkaumiesta.lt/pagalba/atmintine.pdf`
                    )
                } else {
                    ctx.reply(err.message)
                }
            }
        )
    } else {
        ctx.reply(
            `Sveiki, pradėkite registuoti KET pažeidimą su /ket [valstybinis numeris] komanda. Atmintinė kaip teisingai pranešti apie pažeidimą 👉 https://tvarkaumiesta.lt/pagalba/atmintine.pdf`
        )
    }
})

bot.command('ket', async (ctx, next) => {
    return await registerKet({ ctx, bot })
})

bot.on(['document', 'photo'], async ctx => {
    await addPhoto({ ctx, bot, telegram })
})

bot.on('location', async ctx => {
    if (bot.context.uniqueId) {
        const { location } = ctx.message
        await updateTicket(
            bot.context.uniqueId,
            { location: location },
            async (err, res) => {
                if (!err && res.ok === 1) {
                    const { latitude, longitude } = location
                    const url = `https://geocode.xyz/${latitude},${longitude}?json=1`
                    await fetch(url)
                        .then(response => {
                            return response.json()
                        })
                        .then(async data => {
                            const address = `${data.staddress}. ${data.stnumber}`
                            await updateTicket(
                                bot.context.uniqueId,
                                { location: { ...location, address } },
                                async (err, res) => {
                                    if (!err && res.ok === 1) {
                                        ctx.reply(
                                            `Lokacija įrašyta ${bot.context.valstybinis_numeris}`
                                        )
                                    } else if (err) {
                                        ctx.reply(err)
                                    }
                                }
                            )
                        })
                        .catch(err => ctx.reply(err))
                } else if (err) {
                    console.log(err)
                }
            }
        )
    } else {
        ctx.reply('Pradžiai įveskit /ket [automobilio valstybinis numeris]')
    }
})

bot.command('reports', async ctx => {
    const userId = ctx.message.from.id
    const user = await UserModel.findOne({
        userId: userId
    })
    if (user) {
        const tickets = await getAllUserTickets(user)
        if (tickets.length) {
            tickets.forEach(
                async ({
                    _id,
                    photos,
                    plateNumber,
                    time,
                    date,
                    location: { address = 'Nėra' },
                    currentStatus: { status }
                }) => {
                    if (photos.length) {
                        const isDocument = photos[0].isDocument
                        const replyOption = isDocument
                            ? 'replyWithDocument'
                            : 'replyWithPhoto'
                        await ctx[replyOption](
                            photos[0].file_id,
                            Extra.load({
                                caption: getStatusMessage({
                                    plateNumber,
                                    time,
                                    address,
                                    date,
                                    status
                                })
                            })
                                .markdown()
                                .markup(m => {
                                    if (status === 'laukiama patvirtinimo') {
                                        return m.inlineKeyboard([
                                            m.callbackButton(
                                                `♻️ Pakeisti ${plateNumber}`,
                                                `UPDATE REPORT ${_id}`
                                            ),
                                            m.callbackButton(
                                                '❌ Pašalinti',
                                                `REMOVE REPORT ${_id}`
                                            )
                                        ])
                                    }
                                })
                        ).catch(e => ctx.reply(e))
                    } else {
                        await ctx.reply(
                            getStatusMessage({
                                plateNumber,
                                time,
                                address,
                                date,
                                status
                            }),
                            status === 'laukiama patvirtinimo'
                                ? Extra.markup(
                                      Markup.inlineKeyboard([
                                          Markup.callbackButton(
                                              `♻️ Pakeisti ${plateNumber}`,
                                              `UPDATE REPORT ${_id}`
                                          ),
                                          Markup.callbackButton(
                                              '❌ Pašalinti',
                                              `REMOVE REPORT ${_id}`
                                          )
                                      ])
                                  )
                                : null
                        )
                    }
                }
            )
        } else {
            ctx.reply(
                '🔍 Pranešimų nerasta, pradėkime registruoti pranešima su /ket [AUTOMOBILIO VALSTYBINIS NUMERIS] komanda'
            )
        }
    } else {
        ctx.reply('Vartotojas nerastas.')
    }
})

bot.command('remove', async (ctx, next) => {
    const userId = ctx.message.from.id
    const user = await UserModel.findOne({ userId })

    if (user) {
        const tickets = await getAllUserTickets(user)

        if (tickets.length) {
            return ctx.replyWithHTML(
                `<b> Remove all ${tickets.length} reports?</b>`,
                Extra.markup(
                    Markup.inlineKeyboard([
                        Markup.callbackButton(
                            `Panaikinti visus ${tickets.length} pranšimus`,
                            'Remove all reports'
                        ),
                        Markup.callbackButton('Ne', 'No')
                    ]).oneTime()
                )
            )
        } else {
            return ctx.reply('Pranešimų nėra.')
        }
    }
})

bot.action('No', async ctx => {
    await ctx.answerCbQuery()
    await ctx.reply('Gerai 👌')
})

bot.action('Remove all reports', async ctx => {
    return ctx
        .answerCbQuery()
        .then(async res => {
            const userId = ctx.update.callback_query.message.chat.id
            const user = await UserModel.findOne({ userId }).populate('tickets')
            const id = user._id
            const tickets = user.tickets
            tickets.forEach(async ({ _id }) => {
                await fs.rmdir(`files/${_id}`, { recursive: true }, err =>
                    console.log(err)
                )
            })
            return await TicketModel.deleteMany(
                {
                    user: Mongoose.Types.ObjectId(id)
                },
                function(err, res) {
                    if (!err) {
                        user.tickets = []
                        user.save()
                        ctx.reply(`Removed all ${res.deletedCount} report(s)!`)
                    } else {
                        ctx.reply(err)
                    }
                }
            )
        })
        .catch(err => ctx.reply(err))
})

bot.action(/\UPDATE REPORT +.*/, async ctx => {
    const id = ctx.update.callback_query.data.replace('UPDATE REPORT ', '')
    const userId = ctx.update.callback_query.message.chat.id
    const user = await UserModel.findOne({ userId }).populate('tickets')
    const isAlreadyRegistered = user.tickets.find(
        ({ _id }) => _id.toString() === id
    )
    const isStatusWaiting = user.tickets.find(
        ({ currentStatus: { status } }) => status === 'laukiama patvirtinimo'
    )
    const { plateNumber } = isAlreadyRegistered
    if (isAlreadyRegistered && isStatusWaiting) {
        bot.context.uniqueId = id
        bot.context.valstybinis_numeris = plateNumber
        ctx.reply(
            `✅ Galite atnaujinti (pridėti lokaciją, nuotraukas) ${plateNumber}`
        )
    } else if (!isStatusWaiting) {
        ctx.reply(`Pranešimas ${plateNumber} negali būti keičiamas.`)
    } else {
        ctx.reply(`🔍 Pranešimas ${plateNumber} nerastas.`)
    }
})

bot.action(/\REMOVE REPORT +.*/, async ctx => {
    const id = ctx.update.callback_query.data.replace('REMOVE REPORT ', '')
    const userId = ctx.update.callback_query.message.chat.id
    const user = await UserModel.findOne({ userId }).populate('tickets')
    const isAlreadyRegistered = user.tickets.find(
        ({ _id }) => _id.toString() === id
    )

    const isStatusWaiting = user.tickets.find(
        ({ currentStatus: { status } }) => status === 'laukiama patvirtinimo'
    )
    if (user && isStatusWaiting) {
        await TicketModel.deleteOne(
            {
                _id: id,
                user: Mongoose.Types.ObjectId(user._id)
            },
            async function(err, res) {
                if (!err && isAlreadyRegistered && isStatusWaiting) {
                    const { plateNumber } = isAlreadyRegistered
                    await fs.rmdir(`files/${id}`, { recursive: true }, err =>
                        console.log(err)
                    )

                    user.tickets = user.tickets.filter(
                        ({ _id }) => _id.toString() !== id
                    )
                    user.save()
                    const messageId =
                        ctx.update.callback_query.message.message_id
                    ctx.deleteMessage(messageId)
                    ctx.reply(`${plateNumber} sėkmingai pašalintas ✅`)
                } else if (!isAlreadyRegistered && !err) {
                    ctx.reply(
                        `🔍 Pranešimas nerastas. Turbut jis jau buvo pašalintas?`
                    )
                } else {
                    ctx.reply(err)
                }
            }
        )
    } else if (!isStatusWaiting) {
        ctx.reply(`Pranešimas negali būti keičiamas.`)
    }
})

bot.hears(
    [
        /(\d{1,2})+\:+(\d{1,2})/,
        /\d{4}.\d{1,2}.\d{1,2}/,
        /\d{4}.\d{1,2}.\d{1,2} \d{1,2}.\d{1,2}/
    ],
    async ctx => {
        if (bot.context.uniqueId) {
            const time = ctx.update.message.text
            await updateTicket(
                bot.context.uniqueId,
                { time: time },
                async (err, res) => {
                    if (!err && res) {
                        ctx.reply(
                            `Laikas atnaujintas ${time} 🕜 ${bot.context.valstybinis_numeris}`
                        )
                    }
                    if (err) {
                        ctx.reply(err)
                    }
                }
            )
        } else {
            ctx.reply('Valstybinio numerio nėra')
        }
    }
)

bot.launch()

process.on('SIGINT', function() {
    Mongoose.disconnect(function(err) {
        console.log('DB disconnected!')
        process.exit(err ? 1 : 0)
    })
})
