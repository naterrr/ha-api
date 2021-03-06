var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
  _id: String,
  meta: Schema.Types.Mixed,
  email: String
}, {
  versionKey: false,
  collection: 'accounts'
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Accounts', Account);
