module.exports = {
    apps: [
        {
            name: 'Server',
            script: './server-app.js',
            node_args: '-r dotenv/config',
            watch: true,
            kill_timeout: 3000,
            wait_ready: true,
            shutdown_with_message: true
        },
        {
            name: 'Telegram',
            script: './telegram-app.js',
            node_args: '-r dotenv/config',
            watch: true,
            kill_timeout: 3000,
            wait_ready: true,
            shutdown_with_message: true
        }
    ]
}
