import Hapi from '@hapi/hapi'
import { graphqlHapi } from 'apollo-server-hapi'

const HOST = 'localhost'
const PORT = 3000

async function StartServer() {
    const server = new Hapi.server({
        host: HOST,
        port: PORT
    })

    await server.register({
        plugin: graphqlHapi,
        options: {
            path: '/graphql',
            graphqlOptions: {
                schema: myGraphQLSchema
            },
            route: {
                cors: true
            }
        }
    })

    try {
        await server.start()
    } catch (err) {
        console.log(`Error while starting server: ${err.message}`)
    }

    console.log(`Server running at: ${server.info.uri}`)
}

StartServer()
