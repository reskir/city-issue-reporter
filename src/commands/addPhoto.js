import { TicketModel } from '../../models'
import sharp from 'sharp'
import request from 'request'
import fs from 'fs'
import fetch from 'node-fetch'

const { BOT_TOKEN } = process.env
const exif = require('exif-parser')

export async function addPhoto({ ctx, bot, telegram }) {
    const type = ctx.update.message?.document?.mime_type
    if (bot.context.uniqueId) {
        let fileURL
        let file_id
        let isDocument = false
        const chatId = ctx.update.message.chat.id
        if (type && type.includes('image')) {
            isDocument = true
            file_id = ctx.update.message.document.file_id
            const { file_path } = await telegram.getFile(file_id)
            fileURL = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`
        } else {
            const photos = ctx.message.photo
            file_id = ctx.message.photo[photos.length - 1].file_id
            fileURL = await telegram.getFileLink(file_id)
        }
        const ticket = await TicketModel.findOne({
            _id: bot.context.uniqueId
        })
        await request(
            { url: fileURL, encoding: null },
            async (err, resp, buffer) => {
                if (!fs.existsSync('files/')) {
                    fs.mkdirSync('files/')
                }
                if (!fs.existsSync(`files/${bot.context.uniqueId}`)) {
                    fs.mkdirSync(`files/${bot.context.uniqueId}`)
                }
                const path = `files/${bot.context.uniqueId}/${file_id}.jpg`
                await sharp(buffer)
                    .jpeg({
                        quality: 50,
                        progressive: true
                    })
                    .toFile(path)
                    .catch(e => console.log(e))
                await ticket.photos.push({
                    link: fileURL,
                    file_id,
                    path,
                    isDocument
                })
                const parser = exif.create(buffer)
                const result = parser.parse()
                const {
                    GPSLatitude: latitude,
                    GPSLongitude: longitude,
                    DateTimeOriginal: time
                } = result.tags
                let locationAdded = false
                if (latitude && longitude && !ticket?.location?.latitude) {
                    ticket.location = {
                        latitude,
                        longitude
                    }
                    ticket.time = new Date(time * 1000)
                    const url = `https://geocode.xyz/${latitude},${longitude}?json=1`
                    await fetch(url)
                        .then(response => {
                            return response.json()
                        })
                        .then(async data => {
                            if (data.staddress) {
                                const address = `${data.staddress}. ${data.stnumber}`
                                ticket.location.address = address
                                ctx.reply(
                                    `Adresas įrašytas ${bot.context.valstybinis_numeris}`
                                )
                            }
                        })

                    locationAdded = true
                }
                await ticket.save(async (err, res) => {
                    if (!err) {
                        ctx.reply(`✅ Nuotrauka įrašyta ${ticket.plateNumber}`)
                        if (locationAdded) {
                            ctx.reply(
                                `📌 Pridėta pranešimo lokacija ${ticket.plateNumber} `
                            )
                            await telegram.sendLocation(
                                chatId,
                                latitude,
                                longitude
                            )
                            ctx.reply(
                                `🕓 Pridėtas pranešimo laikas: ${new Date(
                                    time * 1000
                                ).toLocaleString('lt-LT', {
                                    timeZone: 'Europe/Vilnius'
                                })}`
                            )
                        }
                    } else {
                        ctx.reply(err)
                    }
                })
            }
        )
    } else {
        ctx.reply('Pradžiai įveskit /ket [automobilio valstybinis numeris]')
    }
}
