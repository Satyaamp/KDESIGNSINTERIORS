const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    default: ''
  },
  projectType: {
    type: String,
    default: ''
  },
  projectSize: {
    type: String,
    default: ''
  },
  budget: {
    type: String,
    default: ''
  },
  timeline: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  floorPlan: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' }
  },
  images: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Completed'],
    default: 'Pending'
  },
  statusUpdatedBy: {
    type: String,
    default: ''
  },
  statusUpdatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);
