var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Mix = new mongoose.Schema({
    label:  String,
    desc: String,
    type: String,
    // sort: { type: Number },
    owner: String,
    meta: Schema.Types.Mixed,
    content: String
}, { versionKey: false });

module.exports = mongoose.model('Mixes', Mix);