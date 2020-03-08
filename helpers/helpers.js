const Mongoose = require('mongoose')
const { TicketModel } = require('../models')

const getAllUserTickets = async user => {
    const id = user._id
    return await TicketModel.find({
        user: Mongoose.Types.ObjectId(id)
    })
}

const updateTicket = async (plateNumber, params, callback) => {
    return await TicketModel.updateOne(
        { plateNumber: plateNumber },
        { ...params },
        function(err, res) {
            return callback(err, res)
        }
    )
}

const findUserById = async userId => {
    return await UserModel.findOne({ userId })
}

module.exports = {
    getAllUserTickets,
    updateTicket,
    findUserById
}
