const dotenv = require('dotenv')
dotenv.config()

const fetch = require('node-fetch')
const Mongoose = require('mongoose')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const { UserModel, TicketModel } = require('./models')
const uuid = require('uuid')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const actions = require('./actions')
const {
    getAllUserTickets,
    updateTicket,
    findUserById
} = require('./helpers/helpers')

function timeConverter(UNIX_timestamp) {
    return new Date(UNIX_timestamp * 1000)
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

// Mongoose.set('debug', true)
const telegram = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN, { channelMode: false })
// bot.use(Telegraf.log())

bot.command('start', async ctx => {
    const { id, first_name, last_name } = ctx.message.from
    await UserModel.findOne(
        {
            userId: id
        },
        async function(err, user) {
            if (err) {
                ctx.reply(err)
            } else {
                if (!user) {
                    await UserModel.create(
                        {
                            userId: id,
                            name: first_name,
                            surname: last_name,
                            tickets: []
                        },
                        function(err, user) {
                            if (!err) {
                                ctx.reply(
                                    `Welcome to KET_PAZEIDIMAI bot ${first_name}!`
                                )
                            }
                        }
                    )
                } else {
                    ctx.reply(`Welcome back ${first_name}!`)
                }
            }
        }
    )
})

bot.command('ket', async (ctx, next) => {
    const { id, first_name, last_name } = ctx.message.from
    const { date } = ctx.message
    const valstybinis_numeris = ctx.message.text
        .replace('/ket ', '')
        .toUpperCase()

    if (valstybinis_numeris) {
        const chatId = ctx.chat.id
        await UserModel.findOne({
            userId: chatId.toString()
        })
            .populate('tickets')
            .exec(async function(err, user) {
                if (user) {
                    const newTicket = new TicketModel({
                        plateNumber: valstybinis_numeris,
                        date: timeConverter(date),
                        user: Mongoose.Types.ObjectId(user._id),
                        status: 'laukiama patvirtinimo'
                    })
                    user.tickets.push(newTicket._id)
                    await user.save()
                    await newTicket.save()
                    ctx.reply(
                        `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`
                    )
                    ctx.reply(
                        `Įkelkite kelias 📸 kuriuose matosi automobilio valstybinis numeris`
                    )
                    bot.context.valstybinis_numeris = valstybinis_numeris
                } else {
                    const ticket = new TicketModel({
                        plateNumber: valstybinis_numeris,
                        date
                    })
                    ticket.save(async function(err, res) {
                        const user = new UserModel({
                            userId: id,
                            name: first_name,
                            surname: last_name,
                            tickets: [Mongoose.Types.ObjectId(ticket._id)]
                        })
                        bot.context.valstybinis_numeris = valstybinis_numeris
                        await user.save(function(err, res) {
                            if (!err) {
                                ticket.user = Mongoose.Types.ObjectId(res._id)
                                ticket.save()
                                bot.context.pazeidimo_numeris = id
                                ctx.reply(
                                    `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`
                                )
                                ctx.reply(
                                    `Įkelkite kelias 📸 kuriuose matosi automobilio valstybinis numeris`
                                )
                            } else {
                                ctx.reply(err)
                            }
                        })
                    })
                }
            })
    } else {
        ctx.reply(`rašykite "/ket VALSTYBINIS AUTOMOBILIO NUMERIS"`)
    }
})

bot.on('location', async ctx => {
    if (bot.context.valstybinis_numeris) {
        const { location } = ctx.message
        await updateTicket(
            bot.context.valstybinis_numeris,
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
                                bot.context.valstybinis_numeris,
                                { location: { ...location, address } },
                                async (err, res) => {
                                    if (!err && res.ok === 1) {
                                        ctx.reply(
                                            `Lokacija įrašyta ${bot.context.valstybinis_numeris}, 📍${address}`
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

bot.on('photo', async ctx => {
    const chatId = ctx.chat.id
    if (bot.context.valstybinis_numeris) {
        const photos = ctx.message.photo
        const fileId = ctx.message.photo[photos.length - 1].file_id
        const link = await telegram.getFileLink(fileId)
        await updateTicket(
            bot.context.valstybinis_numeris,
            { $addToSet: { photos: { link, file_id: fileId } } },
            (err, res) => {
                if (!err && res.ok === 1) {
                    ctx.reply(
                        `✅ Nuotrauka įrašyta ${bot.context.valstybinis_numeris}`
                    )
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
                    photos,
                    plateNumber,
                    time = 'Nėra',
                    date,
                    location: { address = 'Nėra' },
                    status
                }) => {
                    if (photos.length) {
                        await ctx.replyWithPhoto(
                            photos[0].file_id,
                            Extra.load({
                                caption: `Valstybinis numeris:${plateNumber}\nLaikas: ${time}\nVieta: ${address}\nUžregistruotas: ${date}\nStatusas: ${status.toUpperCase()}`
                            })
                                .markdown()
                                .markup(m => {
                                    if (status === 'laukiama patvirtinimo') {
                                        return m.inlineKeyboard([
                                            m.callbackButton(
                                                `♻️ Pakeisti ${plateNumber}`,
                                                `UPDATE REPORT ${plateNumber}`
                                            ),
                                            m.callbackButton(
                                                '❌ Pašalinti',
                                                `REMOVE REPORT ${plateNumber}`
                                            )
                                        ])
                                    }
                                })
                        )
                    } else {
                        await ctx.reply(
                            `Valstybinis numeris:${plateNumber}\nLaikas: ${time}\nVieta: ${address}\nUžregistruotas: ${date}\nStatusas: ${status.toUpperCase()}`,
                            status === 'laukiama patvirtinimo'
                                ? Extra.markup(
                                      Markup.inlineKeyboard([
                                          Markup.callbackButton(
                                              `♻️ Pakeisti ${plateNumber}`,
                                              `UPDATE REPORT ${plateNumber}`
                                          ),
                                          Markup.callbackButton(
                                              '❌ Pašalinti',
                                              `REMOVE REPORT ${plateNumber}`
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
            const user = await UserModel.findOne({ userId })
            const id = user._id
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
    const plateNumber = ctx.update.callback_query.data.replace(
        'UPDATE REPORT ',
        ''
    )
    const userId = ctx.update.callback_query.message.chat.id
    const user = await UserModel.findOne({ userId }).populate('tickets')
    const isAlreadyRegistered = user.tickets.find(
        ({ plateNumber: number }) => number === plateNumber
    )
    const isStatusWaiting = user.tickets.find(
        ({ status }) => status === 'laukiama patvirtinimo'
    )
    if (isAlreadyRegistered && isStatusWaiting) {
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
    const plateNumber = ctx.update.callback_query.data.replace(
        'REMOVE REPORT ',
        ''
    )
    const userId = ctx.update.callback_query.message.chat.id
    const user = await UserModel.findOne({ userId }).populate('tickets')
    const isAlreadyRegistered = user.tickets.find(
        ({ plateNumber: number }) => number === plateNumber
    )

    const isStatusWaiting = user.tickets.find(
        ({ status }) => status === 'laukiama patvirtinimo'
    )

    if (user && isStatusWaiting) {
        await TicketModel.deleteOne(
            {
                plateNumber,
                user: Mongoose.Types.ObjectId(user._id)
            },
            async function(err, res) {
                if (!err && isAlreadyRegistered && isStatusWaiting) {
                    user.tickets = user.tickets.filter(
                        ({ plateNumber: number }) => number !== plateNumber
                    )
                    user.save()
                    const messageId =
                        ctx.update.callback_query.message.message_id
                    ctx.deleteMessage(messageId)
                    ctx.reply(`${plateNumber} sėkmingai pašalintas ✅`)
                } else if (!isAlreadyRegistered && !err) {
                    ctx.reply(
                        `🔍 Pranešimas apie ${plateNumber} nerastas. Turbut jis jau buvo pašalintas?`
                    )
                } else {
                    ctx.reply(err)
                }
            }
        )
    } else if (!isStatusWaiting) {
        ctx.reply(`Pranešimas ${plateNumber} negali būti keičiamas.`)
    }
})

bot.hears(/(\d{2})+\:+(\d{2})/, async ctx => {
    if (bot.context.valstybinis_numeris) {
        const time = ctx.update.message.text
        const userId = ctx.update.message.chat.id
        await updateTicket(
            bot.context.valstybinis_numeris,
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
})

bot.launch()
