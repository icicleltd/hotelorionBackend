
const mongoose = require('mongoose');
const {Schema} = mongoose;

const roomTypesSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    facilities: {
        type: [String],
    }
})