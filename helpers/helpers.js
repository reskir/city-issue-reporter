import Mongoose from 'mongoose'
import { TicketModel } from '../models'

export function timeConverter(date) {
    return new Date(date).toLocaleString('lt-LT', {
        timeZone: 'Europe/Vilnius'
    })
}

export const getAllUserTickets = async user => {
    const id = user._id
    return await TicketModel.find({
        user: Mongoose.Types.ObjectId(id)
    })
}

export const updateTicket = async (id, params, callback) => {
    return await TicketModel.updateOne({ _id: id }, { ...params }, function(
        err,
        res
    ) {
        return callback(err, res)
    })
}

export const getStatusMessage = ({
    plateNumber,
    time,
    address,
    date,
    status
}) => {
    const data = timeConverter(time || date)
    const registered = timeConverter(date)
    return `Valstybinis numeris: ${plateNumber}\nLaikas: ${data}\nVieta: ${address}\nUžregistruotas: ${registered}\nStatusas: ${status.toUpperCase()}`
}

export const getStatusUpdateMessage = ({ plateNumber, status, comment }) => {
    const displayComment = comment ? true : false
    return `Pranešimas ${plateNumber}\nStatusas: ${status.toUpperCase()}\n${
        displayComment ? `Komentaras: ${comment}` : ''
    }`
}

export const findUserById = async userId => {
    return await UserModel.findOne({ userId })
}
