import Mongoose from 'mongoose'
import { TicketModel } from '../models'

export const getAllUserTickets = async user => {
    const id = user._id
    return await TicketModel.find({
        user: Mongoose.Types.ObjectId(id)
    })
}

export const updateTicket = async (plateNumber, params, callback) => {
    return await TicketModel.updateOne(
        { plateNumber: plateNumber },
        { ...params },
        function(err, res) {
            return callback(err, res)
        }
    )
}

export const getStatusMessage = ({
    plateNumber,
    time,
    address,
    date,
    status
}) => {
    return `Valstybinis numeris: ${plateNumber}\nLaikas: ${time}\nVieta: ${address}\nUžregistruotas: ${date}\nStatusas: ${status.toUpperCase()}`
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
