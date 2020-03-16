import Mongoose from 'mongoose'
import Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import Joi from '@hapi/joi'
import Inert from '@hapi/inert'
import Path from 'path'
import fetch from 'node-fetch'
import { TicketModel, UserModel } from './models'
import { getStatusUpdateMessage } from './helpers/helpers'

Mongoose.connect(process.env.DB_URL, {
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Now connected to MongoDB!'))
    .catch(err => console.error('Something went wrong', err))

const start = async () => {
    const server = new Hapi.Server({
        port: 3001,
        debug: { request: ['error'] },
        routes: {
            files: {
                relativeTo: Path.join(__dirname, './ui/build/')
            }
        }
    })
    await server.register([
        Inert,
        {
            plugin: require('@hapi/good'),
            options: {
                ops: {
                    interval: 1000
                },
                reporters: {
                    myConsoleReporter: [
                        {
                            module: '@hapi/good-squeeze',
                            name: 'Squeeze',
                            args: [{ log: '*', response: '*', ops: '*' }]
                        },
                        {
                            module: '@hapi/good-console'
                        },
                        'stdout'
                    ]
                }
            }
        }
    ])

    server.route({
        method: 'GET',
        path: '/{param*}',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler(request, h) {
            if (request.path.includes('manifest')) {
                return h.file(
                    Path.join(__dirname, `./ui/build/${request.path}`)
                )
            }
            return h
                .file(Path.join(__dirname, './ui/build/index.html'))
                .code(200)
        }
    })

    server.route({
        method: 'GET',
        path: '/static/{param*}',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler: {
            directory: {
                path: Path.join(__dirname, './ui/build/static/')
            }
        }
    })

    server.route({
        method: 'GET',
        path: '/getUsers',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler: async (request, h) => {
            const users = await UserModel.find().populate('tickets')
            return h.response(users)
        }
    })

    server.route({
        method: 'GET',
        path: '/getTicket/{id}',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler: async (request, h) => {
            const id = request.params.id
            const ticket = await TicketModel.findById(id)
            return ticket
        }
    })

    server.route({
        method: 'GET',
        path: '/getTickets',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler: async (request, h) => {
            try {
                const tickets = await TicketModel.find({})
                return h.response(tickets)
            } catch (error) {
                return h.response(error).code(500)
            }
        }
    })

    server.route({
        method: 'POST',
        path: '/updateStatus/',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler: async (request, h) => {
            const { ticketId, status, comment = '' } = request.query
            const ticket = await TicketModel.findOne({
                _id: Mongoose.Types.ObjectId(ticketId)
            }).populate('user')
            const userId = ticket.user.userId
            try {
                ticket.currentStatus = {
                    status,
                    comment
                }
                await ticket.save().catch(e => {
                    throw new Error(e)
                })
            } catch (e) {
                return Boom.badData(e)
            }
            const { photos, plateNumber, documents } = ticket
            const message = getStatusUpdateMessage({
                plateNumber,
                status,
                comment
            })

            let endpoint
            let params
            if (photos.length) {
                endpoint = 'sendPhoto'
                params = {
                    chat_id: userId,
                    photo: photos[0].file_id,
                    caption: message
                }
            } else if (documents.length && !photos.length) {
                endpoint = 'sendDocument'
                params = {
                    chat_id: userId,
                    document: documents[0].file_id,
                    caption: message
                }
            } else {
                endpoint = 'sendMessage'
                params = {
                    chat_id: userId,
                    text: message
                }
            }

            const url = new URL(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/${endpoint}`
            )
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key])
            })
            await fetch(url)

            return h.response(ticket).code(200)
        }
    })

    await server.start()
    console.info(`Server started at ${server.info.uri}`)
}

start()
