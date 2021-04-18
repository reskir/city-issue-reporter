import fetch from 'node-fetch'
import Mongoose from 'mongoose'
import { Telegraf, Telegram } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import { UserModel } from './models'
import request from 'request'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const { BOT_TOKEN } = process.env

if (!BOT_TOKEN) {
    console.error(
        'Seems like you forgot to pass Telegram Bot Token. I can not proceed...'
    )
    process.exit(1)
}

const telegram = new Telegram(BOT_TOKEN)
const bot = new Telegraf(BOT_TOKEN, { channelMode: false })

bot.use(new LocalSession({ database: 'example_db.json' }).middleware())

const addIssues = async () => {
    try {
        const response = await fetch(
            'https://api-tvarkau.vilnius.lt/api/v2/problems/types?city_id=1&order=asc'
        )
        const { data: issues } = await response.json()
        bot.context.issues = issues
    } catch (err) {
        console.log(err)
    }
}

Mongoose.connect(process.env.DB_URL, {
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Now connected to MongoDB!')
        await addIssues()
    })
    .catch((err) => console.error('Something went wrong', err))

bot.command('start', async (ctx) => {
    const { id, first_name, last_name } = ctx.message.from
    const user = await UserModel.findOne({
        userId: id,
    })
    if (!user) {
        UserModel.create(
            {
                userId: id,
                name: first_name,
                surname: last_name,
                tickets: [],
            },
            function (err) {
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

bot.command('login', async (ctx) => {
    ctx.reply('Login')
    const response = await fetch(
        'https://api-tvarkau.vilnius.lt/api/v2/login/url/'
    )
    const { data } = await response.json()
    ctx.reply(data?.loginUrl)
})

bot.command('token', async (ctx) => {
    try {
        const message = ctx?.message?.text
        if (message) {
            const token = message.replace('/token', '').replace(' ', '')
            const userId = ctx.message.from.id
            const user = await UserModel.findOne({
                userId: userId,
            })
            if (user && token) {
                user.token = token
                user.save()
                ctx.reply('token added!')
            }
        }
    } catch (err) {
        ctx.reply(JSON.stringify(err))
    }
})

bot.command('reset', (ctx) => {
    if (ctx?.session?.issue) {
        ctx.replyWithMarkdown(
            `Removing session from database: \`${JSON.stringify(
                ctx.session.issue
            )}\``
        )
        // Setting session to null, undefined or empty object/array will trigger removing it from database
        ctx.session = null
    }
})

bot.command('userId', async (ctx) => {
    const message = ctx?.message?.text
    if (message) {
        const vilniusId = message.replace('/userId', '').replace(' ', '')
        const userId = ctx.message.from.id
        const user = await UserModel.findOne({
            userId: userId,
        })

        if (user && vilniusId) {
            user.vilniusId = vilniusId
            user.save()
            ctx.reply('user id saved!')
        }
    }
})

bot.command('issue', async (ctx) => {
    const { reply, issues } = ctx
    try {
        const keyboardOptions = []
        for (const issue of issues) {
            keyboardOptions.push([
                {
                    text: issue?.name,
                    callback_data: JSON.stringify({
                        issueId: issue?.id,
                    }),
                },
            ])
        }

        ctx.reply('Pasirinkite problemos tipa', {
            reply_markup: {
                remove_keyboard: true,
                inline_keyboard: keyboardOptions,
            },
        })
    } catch (err) {
        reply(JSON.stringify(err))
    }
})

bot.command('current', (ctx) => {
    const { issue } = ctx.session
    if (issue) {
        ctx.reply(`Pasirinkta problema: ${issue}`)
        if (ctx.session.text) {
            ctx.reply(`Problemos aprašymas: ${ctx.session.text}`)
        }
        if (ctx.session?.images) {
            const images = ctx.session?.images
            for (const image of images) {
                if (image) {
                    request(
                        { url: image, encoding: null },
                        (err, resp, buffer) => {
                            if (resp) {
                                ctx.replyWithPhoto(buffer)
                            }
                        }
                    )
                }
            }
        }
    } else {
        ctx.reply('Problema nepasirinkta, /issue')
    }
})

bot.command('text', async (ctx) => {
    const message = ctx.message.text
    const text = message.replace('/text', '').replace(' ', '')

    if (ctx.session.issue && !text) {
        ctx.reply(
            `Įveskite problemos (${ctx.session.issue}) aprašymą /text [aprašymas]`
        )
    } else if (!ctx.session.issue) {
        ctx.reply('Nepasirinkote problemos, įrašykite /issue')
    } else if (ctx.session.issue && text) {
        ctx.session.text = text
        ctx.reply('aprašymas įrašytas')
    }
})

bot.command('photo', async (ctx) => {
    ctx.reply('įkelkite nuotraukas')
})

bot.on('callback_query', async (ctx) => {
    const data = JSON.parse(ctx?.update?.callback_query?.data)
    if (data) {
        const issue = ctx?.issues.find(({ id }) => id === data?.issueId)
        ctx.session.issue = issue.name
        ctx.session.issueId = data?.issueId
        ctx.reply(`Pasirinkote: ${issue.name}`)
    }
})

bot.command('info', async (ctx) => {
    const userId = ctx.message.from.id
    const user = await UserModel.findOne({
        userId: userId,
    })
    ctx.reply(`Vilniaus miesto profilio ID: ${user.vilniusId}`)
    ctx.reply(`Vartotojo vardas: ${user.name}`)
    ctx.reply(`Užregistuota pranešimų: ${user.tickets?.length}`)
})

bot.command('tickets', async (ctx) => {
    const user = await UserModel.findOne({
        userId: userId,
    })
})

bot.on(['document', 'photo'], async (ctx) => {
    if (ctx.session.issue) {
        const file_id = ctx.update.message.document.file_id
        const { file_path } = await telegram.getFile(file_id)
        const fileURL = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`

        if (!ctx.session?.images) {
            ctx.session.images = [fileURL]
        } else {
            ctx.session.images.push(fileURL)
        }
    }
})

bot.launch()

process.on('SIGINT', function () {
    Mongoose.disconnect(function (err) {
        console.log('DB disconnected!')
        process.exit(err ? 1 : 0)
    })
})
