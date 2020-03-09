const dotenv = require('dotenv')
dotenv.config()
const Mongoose = require('mongoose')
const Hapi = require('@hapi/hapi')
const Joi = require('@hapi/joi')
const Path = require('path')
const Hoek = require('@hapi/hoek')
const { TicketModel, UserModel } = require('./models')

Mongoose.connect('mongodb://localhost/', {
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Now connected to MongoDB!'))
    .catch(err => console.error('Something went wrong', err))

const start = async () => {
    const server = new Hapi.Server({ host: 'localhost', port: 3000 })

    await server.register(require('@hapi/vision'))

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates'
    })

    await server.start()

    server.route({
        method: 'POST',
        path: '/ticket',
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
        path: '/tickets',
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

    server.route({
        method: 'GET',
        path: '/',
        config: {
            handler: async (request, h) => {
                const tickets = await TicketModel.find()
                    .lean()
                    .exec()
                const data = tickets.map(ticket => {
                    const date = new Date(ticket.date * 1000).toLocaleString(
                        'lt-LT',
                        {
                            timeZone: 'Europe/Vilnius',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        }
                    )
                    if (ticket.location) {
                        const { longitude, latitude } = ticket.location

                        return {
                            ...ticket,
                            date,
                            locationURL: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
                        }
                    }
                    return {
                        ...ticket,
                        date
                    }
                })
                return h.view('index', { tickets: data.reverse() })
            }
        }
    })

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
}

start()
