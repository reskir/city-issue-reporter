const dotenv = require('dotenv')
dotenv.config()

const Mongoose = require('mongoose')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const { UserModel, TicketModel } = require('./models')
const uuid = require('uuid')

Mongoose.connect('mongodb://localhost/', {
    dbName: 'ketpazeidimai',
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Now connected to MongoDB!'))
    .catch(err => console.error('Something went wrong', err))

const telegram = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN, { channelMode: false })

function timeConverter(UNIX_timestamp) {
    return new Date(UNIX_timestamp * 1000).toLocaleTimeString('lt-LT')
}

bot.command('start', async ctx => {
    const about = await telegram.getMe()
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
                                    `Welcome to ${about.username} ${first_name}!`
                                )
                                console.log(user)
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
                    const ticket = user.tickets.find(
                        ({ plateNumber }) => plateNumber === valstybinis_numeris
                    )
                    if (!ticket) {
                        const newTicket = new TicketModel({
                            plateNumber: valstybinis_numeris,
                            date: timeConverter(date),
                            user: Mongoose.Types.ObjectId(user._id)
                        })
                        await newTicket.save(function(err, res) {
                            user.tickets.push(res._id)
                            user.save()
                        })
                        ctx.reply(
                            `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`
                        )
                        ctx.reply(
                            `Įkelkite kelias 📸 kuriuose matosi automobilio valstybinis numeris`
                        )
                        bot.context.valstybinis_numeris = valstybinis_numeris
                    } else if (ticket) {
                        const { plateNumber, photos = [], time } = ticket
                        await ctx.reply(
                            `Automobilis ${plateNumber} jau šiandien registruotas ${time}`
                        )
                        if (photos.length) {
                            telegram.sendPhoto(
                                chatId,
                                photos[0].file_id,
                                plateNumber
                            )
                        }
                    }
                } else {
                    const ticket = new TicketModel({
                        plateNumber: valstybinis_numeris,
                        date: timeConverter(date)
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
        await TicketModel.updateOne(
            { plateNumber: bot.context.valstybinis_numeris },
            { location }
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
        await TicketModel.updateOne(
            { plateNumber: bot.context.valstybinis_numeris },
            { $push: { photos: { link, file_id: fileId } } }
        )
    } else {
        ctx.reply('Pradžiai įveskit /ket [automobilio valstybinis numeris]')
    }
})

bot.command('reports', async (ctx, next) => {
    const userId = ctx.message.from.id
    const user = await UserModel.findOne({
        userId: userId
    }).populate('tickets')
    if (user) {
        const tickets = user.tickets
        if (tickets.length) {
            tickets.forEach(({ photos, plateNumber }) => {
                if (photos.length) {
                    telegram.sendPhoto(
                        userId,
                        photos[0].file_id,
                        plateNumber,
                        true
                    )
                } else {
                    telegram.sendMessage(userId, `No photo: ${plateNumber}`)
                }
            })
        } else {
            ctx.reply('No reports for you sir')
        }
    } else {
        ctx.reply('Nothing to report here')
    }
})

bot.command('remove', async (ctx, next) => {
    const userId = ctx.message.from.id
    const user = await UserModel.findOne({ userId })
    if (user) {
        const id = user._id
        await TicketModel.deleteMany(
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
    }
})

bot.launch()
