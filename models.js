const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const PhotoSchema = new Schema({
    link: String,
    file_id: String
})

const CarModel = Mongoose.model('car', {
    plateNumber: String,
    location: {
        latitude: String,
        longitude: String
    },
    photos: [PhotoSchema],
    time: String
})

module.exports = {
    CarModel
}
