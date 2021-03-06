var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var MediaObject = new mongoose.Schema({
  _id: String,
  label: String,
  desc: String,
  type: String,
  owner: String,
  meta: {
    type: String,
    ref: 'Metadata'
  },
  created: {
    type: Date,
    default: Date.now
  },
  modified: {
    type: Date,
    default: Date.now
  },
  source: Schema.Types.Mixed,
  tags: [String],
  channel: String
}, {
  versionKey: false,
  collection: 'media'
});

MediaObject.pre('save', function(next) {
  this.modified = new Date();
  next();
});

module.exports = mongoose.model('Media', MediaObject);
