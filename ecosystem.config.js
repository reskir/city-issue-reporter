module.exports = {
    apps: [
        {
            name: 'hapi server',
            script: './server-app.js',
            node_args: '-r dotenv/config',
            instances: 1,
            autorestart: true,
            watch: true,
            watch: ['server.js', 'models.js'],
            ignoreWatch: ['node_modules'],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'telegram bot',
            script: './telegram-app.js',
            node_args: '-r dotenv/config',
            instances: 1,
            autorestart: true,
            watch: true,
            watch: ['index.js', 'src/commands', 'models.js'],
            ignoreWatch: ['node_modules'],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
}
