import Mongoose from 'mongoose'
const Schema = Mongoose.Schema

const PhotoSchema = new Schema({
    link: String,
    file_id: String,
    path: String,
    isDocument: {
        type: Boolean,
        default: false
    }
})

const StatusSchema = new Schema({
    status: {
        type: String,
        enum: [
            'laukiama patvirtinimo',
            'registruotas',
            'nagrinėjimas',
            'išnagrinėtas',
            'atmestas'
        ],
        default: 'laukiama patvirtinimo'
    },
    comment: {
        type: String
    }
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
        latitude: Number,
        longitude: Number,
        address: String
    },
    date: Date,
    time: String,
    photos: [PhotoSchema],
    currentStatus: StatusSchema,
    updates: [
        {
            status: String,
            comment: String,
            time: Date
        }
    ],
    comment: String,
    user: { type: Schema.ObjectId, ref: 'User' }
})

export const UserModel = Mongoose.model('User', UserSchema)
export const TicketModel = Mongoose.model('Ticket', TicketSchema)
