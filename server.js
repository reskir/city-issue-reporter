import Mongoose from 'mongoose'
import Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import Joi from '@hapi/joi'
import Inert from '@hapi/inert'
import Path from 'path'
import fetch from 'node-fetch'
import { TicketModel, UserModel } from './models'

Mongoose.connect(process.env.DB_URL, {
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Now connected to MongoDB!'))
    .catch(err => console.error('Something went wrong', err))

Mongoose.set('debug', true)

const start = async () => {
    const server = new Hapi.Server({ host: 'localhost', port: 3001 })
    await server.register(Inert)

    server.route({
        method: 'GET',
        path: '/{path*}',
        handler: {
            directory: {
                path: Path.join(__dirname, './ui/build'),
                listing: false,
                index: true
            }
        }
    })

    server.route({
        method: 'POST',
        path: '/getTicket',
        options: {
            validate: {
                payload: Joi.object().keys({
                    plateNumber: Joi.string().required(),
                    userId: Joi.string().required()
                }),
                failAction: (request, h, error) => {
                    return error.isJoi
                        ? h.response(error.details[0]).takeover()
                        : h.response(error).takeover()
                }
            }
        },
        handler: async (request, h) => {
            try {
                const { plateNumber, userId } = request.payload
                const user = await UserModel.findOne({
                    userId: userId
                }).populate('tickets')

                if (user) {
                    const tickets = user.tickets
                    const alreadyInclude = tickets.find(
                        ({ plateNumber: number }) => number === plateNumber
                    )

                    if (alreadyInclude) {
                        return h.response('Already included').code(500)
                    }
                    const ticket = new TicketModel({
                        plateNumber,
                        user: Mongoose.Types.ObjectId(user._id)
                    })
                    user.tickets.push(ticket._id)
                    await user.save()
                    const result = await ticket.save()
                    return h.response(result)
                }
                return h.response('Please specify user id').code(500)
            } catch (error) {
                return h.response(error).code(500)
            }
        }
    })

    server.route({
        method: 'GET',
        path: '/getTickets',
        config: {
            cors: {
                origin: ['http://localhost:3000', 'http://194.5.157.133:3000']
            }
        },
        handler: async (request, h) => {
            try {
                const tickets = await TicketModel.find()
                    .lean()
                    .exec()
                return h.response(tickets)
            } catch (error) {
                return h.response(error).code(500)
            }
        }
    })

    // server.route({
    //     method: 'GET',
    //     path: '/',
    //     config: {
    //         handler: async (request, h) => {
    //             const tickets = await TicketModel.find()
    //                 .lean()
    //                 .exec()
    //             const data = tickets.map(ticket => {
    //                 const date = new Date(ticket.date * 1000).toLocaleString(
    //                     'lt-LT',
    //                     {
    //                         timeZone: 'Europe/Vilnius',
    //                         hour: '2-digit',
    //                         minute: '2-digit',
    //                         hour12: false
    //                     }
    //                 )
    //                 if (ticket.location) {
    //                     const { longitude, latitude } = ticket.location

    //                     return {
    //                         ...ticket,
    //                         date,
    //                         locationURL: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    //                     }
    //                 }
    //                 return {
    //                     ...ticket,
    //                     date
    //                 }
    //             })
    //             return { tickets: data.reverse() }
    //         }
    //     }
    // })

    server.route({
        method: 'GET',
        path: '/person/{id}',
        handler: async (request, h) => {}
    })

    server.route({
        method: 'PUT',
        path: '/person/{id}',
        options: {
            validate: {}
        },
        handler: async (request, h) => {}
    })

    server.route({
        method: 'POST',
        path: '/updateStatus/',
        config: {
            cors: {
                origin: ['http://localhost:3000, http://194.5.157.133:3000']
            }
        },
        handler: async (request, h) => {
            const { ticketId, status, comment = '' } = request.query
            const ticket = await TicketModel.findOne({
                _id: Mongoose.Types.ObjectId(ticketId)
            }).populate('user')
            const userId = ticket.user.userId
            try {
                ticket.status = status
                ticket.comment = comment
                await ticket.save().catch(e => {
                    throw new Error(e)
                })
            } catch (e) {
                return Boom.badData(e)
            }
            const photos = ticket.photos
            const endpoint = photos.length ? 'sendPhoto' : 'sendMessage'
            const url = new URL(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/${endpoint}`
            )
            let params
            if (photos.length) {
                params = {
                    chat_id: userId,
                    photo: photos[0].file_id,
                    caption: `Statuso atnaujinimas: pranešimas ${ticket.plateNumber} ${status},\n${comment}`
                }
            } else {
                params = {
                    chat_id: userId,
                    text: `Statuso atnaujinimas: pranešimas ${ticket.plateNumber} ${status}\n${comment}`
                }
            }

            Object.keys(params).forEach(key =>
                url.searchParams.append(key, params[key])
            )

            await fetch(url)

            return h.response(ticket).code(200)
        }
    })

    server.route({
        method: 'DELETE',
        path: '/person/{id}',
        handler: async (request, h) => {}
    })

    server.route({
        method: 'GET',
        path: '/location/',
        handler: async (request, h) => {
            const query = request.query
            return {
                location: {
                    latitude: query.latitude,
                    longitude: query.longitude
                }
            }
        }
    })

    await server.start()
}

start()
