import Mongoose from 'mongoose'
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
    time: String,
    photos: [PhotoSchema],
    status: {
        type: String,
        enum: [
            'laukiama patvirtinimo',
            'registruotas',
            'nagrinėjimas',
            'išnagrinėtas',
            'atmestas'
        ],
        default: 'registruotas'
    },
    comment: String,
    user: { type: Schema.ObjectId, ref: 'User' }
})

export const UserModel = Mongoose.model('User', UserSchema)
export const TicketModel = Mongoose.model('Ticket', TicketSchema)
