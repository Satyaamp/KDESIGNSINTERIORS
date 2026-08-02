const Service = require('../models/Service');
const Project = require('../models/Project');
const Blog = require('../models/Blog');
const Consultation = require('../models/Consultation');
const Contact = require('../models/Contact');
const TeamMember = require('../models/TeamMember');
const Testimonial = require('../models/Testimonial');
const { deleteImage } = require('../utils/cloudinaryHelper');

// @desc    Get all trash items across all models
// @route   GET /api/trash
// @access  Private (SuperAdmin only)
const getTrashItems = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only SuperAdmins can manage Recycle Bin.' });
    }

    const [services, projects, blogs, consultations, contacts, team, testimonials] = await Promise.all([
      Service.find({ isDeleted: true }),
      Project.find({ isDeleted: true }),
      Blog.find({ isDeleted: true }),
      Consultation.find({ isDeleted: true }),
      Contact.find({ isDeleted: true }),
      TeamMember.find({ isDeleted: true }),
      Testimonial.find({ isDeleted: true })
    ]);

    const unifiedList = [];

    services.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'services',
        typeName: 'Service',
        title: item.title,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: item.submittedBy || 'SuperAdmin',
        info: `Status: ${item.status}`
      });
    });

    projects.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'projects',
        typeName: 'Project',
        title: item.title,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: item.submittedBy || 'SuperAdmin',
        info: `Status: ${item.status}`
      });
    });

    blogs.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'blogs',
        typeName: 'Blog Post',
        title: item.title,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: item.submittedBy || 'SuperAdmin',
        info: `Status: ${item.status}`
      });
    });

    consultations.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'consultations',
        typeName: 'Appointment Request',
        title: `${item.name} (${item.projectType || 'N/A'})`,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: 'Public Client',
        info: `Created: ${new Date(item.createdAt).toLocaleDateString()}`
      });
    });

    contacts.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'contacts',
        typeName: 'Client Inquiry',
        title: `${item.name} - ${item.subject || 'Inquiry'}`,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: 'Public Client',
        info: `Created: ${new Date(item.createdAt).toLocaleDateString()}`
      });
    });

    team.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'team',
        typeName: 'Team Member',
        title: item.name,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: 'Admin',
        info: `Designation: ${item.designation}`
      });
    });

    testimonials.forEach(item => {
      unifiedList.push({
        id: item._id,
        type: 'testimonials',
        typeName: 'Testimonial',
        title: `${item.name} - Rating: ${item.rating}/5`,
        deletedAt: item.deletedAt || item.updatedAt,
        deletedBy: item.deletedBy || 'System',
        submittedBy: 'Admin',
        info: `Review: ${item.review.substring(0, 40)}...`
      });
    });

    // Sort by deletedAt descending
    unifiedList.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json({ success: true, trashItems: unifiedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore a soft-deleted item
// @route   POST /api/trash/restore/:type/:id
// @access  Private (SuperAdmin only)
const restoreTrashItem = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only SuperAdmins can manage Recycle Bin.' });
    }

    const { type, id } = req.params;

    let model;
    let typeName = '';

    if (type === 'services') { model = Service; typeName = 'Service'; }
    else if (type === 'projects') { model = Project; typeName = 'Project'; }
    else if (type === 'blogs') { model = Blog; typeName = 'Blog Post'; }
    else if (type === 'consultations') { model = Consultation; typeName = 'Appointment Request'; }
    else if (type === 'contacts') { model = Contact; typeName = 'Client Inquiry'; }
    else if (type === 'team') { model = TeamMember; typeName = 'Team Member'; }
    else if (type === 'testimonials') { model = Testimonial; typeName = 'Testimonial'; }
    else {
      return res.status(400).json({ success: false, message: 'Invalid resource type.' });
    }

    const item = await model.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    item.isDeleted = false;
    item.deletedAt = undefined;
    await item.save();

    // Log action
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: `RESTORE_${type.toUpperCase().slice(0, -1)}`,
      description: `Restored ${typeName.toLowerCase()}: "${item.title || item.name}"`,
      metadata: {
        itemId: item._id,
        itemName: item.title || item.name
      },
      req
    });

    res.json({ success: true, message: `${typeName} restored successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Permanently delete a soft-deleted item and clear linked images
// @route   DELETE /api/trash/permanent/:type/:id
// @access  Private (SuperAdmin only)
const purgeTrashItem = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only SuperAdmins can manage Recycle Bin.' });
    }

    const { type, id } = req.params;

    let model;
    let typeName = '';

    if (type === 'services') { model = Service; typeName = 'Service'; }
    else if (type === 'projects') { model = Project; typeName = 'Project'; }
    else if (type === 'blogs') { model = Blog; typeName = 'Blog Post'; }
    else if (type === 'consultations') { model = Consultation; typeName = 'Appointment Request'; }
    else if (type === 'contacts') { model = Contact; typeName = 'Client Inquiry'; }
    else if (type === 'team') { model = TeamMember; typeName = 'Team Member'; }
    else if (type === 'testimonials') { model = Testimonial; typeName = 'Testimonial'; }
    else {
      return res.status(400).json({ success: false, message: 'Invalid resource type.' });
    }

    const item = await model.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // Clean up images from Cloudinary if applicable!
    if (type === 'services') {
      if (item.images && item.images.length > 0) {
        for (const img of item.images) {
          if (img.public_id) await deleteImage(img.public_id);
        }
      } else if (item.image && item.image.public_id) {
        await deleteImage(item.image.public_id);
      }
    } else if (type === 'projects') {
      if (item.images && item.images.length > 0) {
        for (const img of item.images) {
          if (img.public_id) await deleteImage(img.public_id);
        }
      }
      if (item.floorPlans && item.floorPlans.length > 0) {
        for (const fp of item.floorPlans) {
          if (fp.public_id) await deleteImage(fp.public_id);
        }
      }
    } else if (type === 'blogs') {
      if (item.images && item.images.length > 0) {
        for (const img of item.images) {
          if (img.public_id) await deleteImage(img.public_id);
        }
      } else if (item.featuredImage && item.featuredImage.public_id) {
        await deleteImage(item.featuredImage.public_id);
      }
    } else if (type === 'team' || type === 'testimonials') {
      if (item.image && item.image.public_id) {
        await deleteImage(item.image.public_id);
      }
    }

    const itemName = item.title || item.name;
    await item.deleteOne();

    // Log action
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: `PURGE_${type.toUpperCase().slice(0, -1)}`,
      description: `Permanently deleted ${typeName.toLowerCase()}: "${itemName}"`,
      metadata: {
        itemId: item._id,
        itemName
      },
      req
    });

    res.json({ success: true, message: `${typeName} permanently purged from database.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTrashItems,
  restoreTrashItem,
  purgeTrashItem
};
