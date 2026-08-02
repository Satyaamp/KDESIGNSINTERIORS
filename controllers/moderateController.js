const Service = require('../models/Service');
const Project = require('../models/Project');
const Blog = require('../models/Blog');

// @desc    Moderate content items (Approve/Reject)
// @route   PUT /api/moderate/:resource/:id
// @access  Private (SuperAdmin only)
const moderateResource = async (req, res) => {
  try {
    const { resource, id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid moderation status. Must be Approved or Rejected.' });
    }

    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only SuperAdmins can moderate content.' });
    }

    let model;
    let resourceName = '';
    if (resource === 'services') {
      model = Service;
      resourceName = 'Service';
    } else if (resource === 'projects') {
      model = Project;
      resourceName = 'Project';
    } else if (resource === 'blogs') {
      model = Blog;
      resourceName = 'Blog';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid resource type.' });
    }

    const doc = await model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!doc) {
      return res.status(404).json({ success: false, message: `${resourceName} not found.` });
    }

    doc.approvalStatus = status;
    await doc.save();

    // Log the moderation action
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: `${status.toUpperCase()}_${resource.toUpperCase().slice(0, -1)}`,
      description: `${status} ${resourceName.toLowerCase()}: "${doc.title}"`,
      metadata: {
        docId: doc._id,
        docTitle: doc.title,
        moderator: req.admin.username
      },
      req
    });

    res.json({ success: true, message: `${resourceName} moderation status updated to ${status}.`, doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  moderateResource
};
