const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Editor', 'Viewer'],
    default: 'Editor'
  },
  permissions: {
    type: [String],
    default: ['services', 'projects', 'categories', 'blogs', 'testimonials', 'team', 'consultations', 'contacts', 'settings']
  },
  name: {
    type: String,
    default: 'Admin Member'
  },
  email: {
    type: String,
    default: 'admin@kdesigns.com'
  },
  phone: {
    type: String,
    default: ''
  },
  profilePicture: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
