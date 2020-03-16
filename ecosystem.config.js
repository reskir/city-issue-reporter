module.exports = {
    apps: [
        {
            name: 'hapi server',
            script: './server-app.js',
            node_args: '-r dotenv/config',
            instances: 1,
            autorestart: true,
            watch: true,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                watch: true,
                ignoreWatch: ['node_modules']
            },
            env_production: {
                NODE_ENV: 'production',
                watch: false
            }
        },
        {
            name: 'telegram bot',
            script: './telegram-app.js',
            node_args: '-r dotenv/config',
            instances: 1,
            autorestart: true,
            watch: true,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                watch: ['src', 'helpers', 'index.js'],
                ignoreWatch: ['node_modules']
            },
            env_production: {
                NODE_ENV: 'production',
                watch: false
            }
        }
    ]
}
