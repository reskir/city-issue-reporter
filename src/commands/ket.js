import Mongoose from 'mongoose'
import { TicketModel, UserModel } from '../../models'
import { timeConverter } from '../../helpers/helpers'

export const registerKet = async ({ ctx, bot }) => {
    const { id, first_name, last_name } = ctx.message.from
    const { date } = ctx.message
    const message = ctx.message.text
    const plateNumber = message.replace('/ket', '').replace(' ', '')
    const valstybinis_numeris = plateNumber.toUpperCase()
    if (valstybinis_numeris) {
        const chatId = ctx.chat.id
        await UserModel.findOne({
            userId: chatId.toString()
        })
            .populate('tickets')
            .exec(async function(err, user) {
                if (user) {
                    const newTicket = new TicketModel({
                        plateNumber: valstybinis_numeris,
                        date: timeConverter(date * 1000),
                        user: Mongoose.Types.ObjectId(user._id),
                        currentStatus: {
                            status: 'laukiama patvirtinimo',
                            comment: ''
                        }
                    })
                    bot.context.uniqueId = newTicket._id
                    user.tickets.push(newTicket._id)
                    await user.save()
                    await newTicket.save()
                    ctx.reply(
                        `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`
                    )
                    ctx.reply(
                        `Įkelkite kelias 📸 kuriuose matosi automobilio valstybinis numeris`
                    )
                    bot.context.valstybinis_numeris = valstybinis_numeris
                } else {
                    const ticket = new TicketModel({
                        plateNumber: valstybinis_numeris,
                        date
                    })
                    ticket.save(async function(err, res) {
                        const user = new UserModel({
                            userId: id,
                            name: first_name,
                            surname: last_name,
                            tickets: [Mongoose.Types.ObjectId(ticket._id)]
                        })
                        bot.context.valstybinis_numeris = valstybinis_numeris
                        return await user.save(function(err, res) {
                            if (!err) {
                                ticket.user = Mongoose.Types.ObjectId(res._id)
                                ticket.save()
                                bot.context.pazeidimo_numeris = id
                                ctx.reply(
                                    `Pradedame registruoti KET pažeidimą ${valstybinis_numeris}`
                                )
                                ctx.reply(
                                    `Įkelkite kelias 📸 kuriuose matosi automobilio valstybinis numeris`
                                )
                            } else {
                                return ctx.reply(err)
                            }
                        })
                    })
                }
            })
    } else {
        return ctx.reply(`rašykite "/ket VALSTYBINIS AUTOMOBILIO NUMERIS"`)
    }
}
