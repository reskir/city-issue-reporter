import Mongoose from 'mongoose'
import Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import Inert from '@hapi/inert'
import fs from 'fs'
import Path from 'path'
import fetch from 'node-fetch'
import { TicketModel, UserModel } from './models'
import { getStatusUpdateMessage, timeConverter } from './helpers/helpers'

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
        debug: { request: ['error'] }
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
                            args: [{ log: '*', response: '*', request: '*' }]
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
        path: '/files/{param*}',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler(request, h) {
            console.log(Path.join(__dirname, request.path))
            return h.file(Path.join(__dirname, request.path)).code(200)
        }
    })

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
            const users = await UserModel.find(
                {},
                { name: 1, surname: 1 }
            ).populate('tickets', '-photos -documents')
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
            const ticket = await TicketModel.findById(
                id,
                '-photos.buffer -photos.link'
            )
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
                const tickets = await TicketModel.find({}, '-photos -documents')
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
                ticket.updates.push({
                    status,
                    comment,
                    time: Date.now()
                })
                await ticket.save().catch(e => {
                    throw new Error(e)
                })
            } catch (e) {
                return Boom.badData(e)
            }
            const { photos, plateNumber } = ticket
            const message = getStatusUpdateMessage({
                plateNumber,
                status,
                comment
            })

            let endpoint
            let params
            if (photos.length) {
                const isDocument = photos[0].isDocument
                const fileId = photos[0].file_id
                if (isDocument) {
                    endpoint = 'sendDocument'
                    params = {
                        chat_id: userId,
                        document: fileId,
                        caption: message
                    }
                } else {
                    endpoint = 'sendPhoto'
                    params = {
                        chat_id: userId,
                        photo: fileId,
                        caption: message
                    }
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

    server.route({
        method: 'DELETE',
        path: '/deletePhoto/',
        config: {
            cors: {
                origin: ['*']
            }
        },
        handler: async (request, h) => {
            const { ticketId, photoId, filePath } = request.query
            const ticket = await TicketModel.findOne({ _id: ticketId })
            ticket.photos.pull(photoId)
            await ticket.save((err, res) => {
                if (!err) {
                    console.log(ticket.photos.length)
                    if (ticket.photos.length) {
                        fs.unlink(filePath, err => {
                            if (err) console.log(err)
                        })
                    } else {
                        fs.rmdir(
                            `files/${ticketId}`,
                            { recursive: true },
                            err => {
                                if (err) console.log(err)
                            }
                        )
                    }
                }
            })
            return h.response(ticket).code(200)
        }
    })

    await server.start()
    console.info(`Server started at ${server.info.uri}`)
}

start()
