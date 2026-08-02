const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' }
  },
  images: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String
  },
  approvalStatus: {
    type: String,
    enum: ['Approved', 'Pending Approval', 'Rejected'],
    default: 'Approved'
  },
  submittedBy: {
    type: String,
    default: 'SuperAdmin'
  },
  submittedByRole: {
    type: String,
    default: 'SuperAdmin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
