const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Activity', 'Error', 'Login', 'Logout'],
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  adminUsername: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Log', logSchema);
