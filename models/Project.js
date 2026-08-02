const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectCategory',
    required: true
  },
  images: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  videoUrl: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  completionDate: {
    type: String,
    default: ''
  },
  floorPlans: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  testimonials: {
    type: String,
    default: ''
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
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
