const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  country: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    default: 'regular'
  },
  resetToken: {
    type: String,
    required: false
  },
  resetExpire: {
    type: Date,
    required: false
  },
  about: {
    type: Mixed,
    required: false
  },
  isTester: {
    type: Boolean,
    required: false
  },
  isReplayVisible: {
    type: Boolean,
    required: false
  },
  isAnalyseAvailable: {
    type: Boolean,
    required: false
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
