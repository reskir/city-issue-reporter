const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const PhotoSchema = new Schema({
    link: String,
    file_id: String
})

const UserSchema = new Schema({
    userId: String,
    name: String,
    surname: String,
    tickets: [{ type: Schema.ObjectId, ref: 'Ticket' }]
})

const TicketSchema = new Schema({
    plateNumber: String,
    location: {
        latitude: String,
        longitude: String,
        address: String
    },
    date: Date,
    photos: [PhotoSchema],
    user: { type: Schema.ObjectId, ref: 'User' }
})

module.exports = {
    UserModel: Mongoose.model('User', UserSchema),
    TicketModel: Mongoose.model('Ticket', TicketSchema)
}
