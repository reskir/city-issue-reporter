const Mongoose = require('mongoose')
const Hapi = require('@hapi/hapi')
const Joi = require('@hapi/joi')
const Path = require('path')
const Hoek = require('@hapi/hoek')
const { CarModel } = require('./models')

Mongoose.connect('mongodb://localhost/ketpazeidimai')

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
        path: '/car',
        options: {
            validate: {
                payload: Joi.object().keys({
                    plateNumber: Joi.string().required()
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
                const car = new CarModel(request.payload)
                const result = await car.save()
                return h.response(result)
            } catch (error) {
                return h.response(error).code(500)
            }
        }
    })

    server.route({
        method: 'GET',
        path: '/cars',
        handler: async (request, h) => {
            try {
                const cars = await CarModel.find()
                    .lean()
                    .exec()
                return h.response(cars)
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
                const cars = await CarModel.find()
                    .lean()
                    .exec()
                const data = cars.map(car => {
                    if (car.location) {
                        const { longitude, latitude } = car.location
                        return {
                            ...car,
                            locationURL: `/location/?longitude=${longitude}&latitude=${latitude}`
                        }
                    }
                    return {
                        ...car
                    }
                })
                return h.view('index', { cars: data.reverse() })
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
