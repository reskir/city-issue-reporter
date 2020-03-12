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

export const findUserById = async userId => {
    return await UserModel.findOne({ userId })
}
