const dotenv = require('dotenv')
dotenv.config()

const { Router, getCBData, getMessage } = require('telegraf-router')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const routes = [
    {
        path: 'start',
        action: async function StartScene({ ctx, params, router }) {
            await router.redirect('select-action', ctx)
            return true
        }
    },
    {
        path: 'select-action',
        children: [
            {
                path: '',
                action: async function StartScene({ ctx, params, router }) {
                    await ctx.reply('Please select action:', {
                        reply_markup: {
                            remove_keyboard: true,
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Register',
                                        callback_data: 'redirect:/form/register'
                                    }
                                ],
                                [
                                    {
                                        text: 'Login',
                                        callback_data: 'redirect:form/login'
                                    }
                                ]
                            ]
                        }
                    })
                    return true
                }
            }
        ]
    },
    {
        path: '/form',
        children: [
            {
                path: '/register',
                children: [
                    {
                        children: [
                            {
                                path: '',
                                action: async function RegisterScene({
                                    ctx,
                                    params,
                                    router
                                }) {
                                    await ctx.reply('Please type your name')
                                    return true
                                }
                            },
                            {
                                path: '/message',
                                action: async function MessageScene({
                                    ctx,
                                    params,
                                    router
                                }) {
                                    await ctx.reply(
                                        `Hi ${getMessage(ctx).text}!`
                                    )
                                    return true
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        path: 'cancel',
        action: async function CancelScene({ ctx, params, router }) {
            if (!ctx.session.user.fio || !ctx.session.user.phone) {
                await router.redirect('register', ctx)
                return true
            }
            await router.redirect('select-action', ctx)
            return true
        }
    }
]

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log('routerPath', ctx.session.routerPath)
    console.log('Response time %sms', ms)
})
new Router({
    bot,
    routes,
    errorCb: ({ ctx }) => {
        ctx.reply(`Error, support: @name`)
    }
})

bot.launch()
