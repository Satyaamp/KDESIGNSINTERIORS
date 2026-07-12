const Log = require('../models/Log');

// @desc    Get system logs
// @route   GET /api/logs
// @access  Private (SuperAdmin or view_logs permission)
const getLogs = async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    // Authorization Check:
    // Strictly only SuperAdmin can view system logs
    const isSuperAdmin = req.admin && req.admin.role === 'SuperAdmin';
    
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only SuperAdmin can access system logs.'
      });
    }

    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    } else {
      // Default to last 7 days for performance optimization
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: sevenDaysAgo };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const logs = await Log.find(query)
      .populate('admin', 'name username role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get media files from Cloudinary folder-wise
// @route   GET /api/media
// @access  Private (SuperAdmin only)
const getMedia = async (req, res) => {
  try {
    const isSuperAdmin = req.admin && req.admin.role === 'SuperAdmin';
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only SuperAdmin can access media explorer.'
      });
    }

    const { folder = 'services' } = req.query;
    const { isCloudinaryConfigured } = require('../utils/cloudinaryHelper');
    
    if (!isCloudinaryConfigured) {
      return res.json({
        success: true,
        mode: 'local',
        resources: [],
        message: 'Cloudinary not configured. Fallback mode active.'
      });
    }

    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 100
    });

    res.json({
      success: true,
      mode: 'cloudinary',
      resources: (result.resources || []).map(item => ({
        public_id: item.public_id,
        url: item.secure_url,
        format: item.format,
        bytes: item.bytes,
        created_at: item.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all system logs from the database (SuperAdmin only)
// @route   DELETE /api/logs
// @access  Private (SuperAdmin only)
const clearAllLogs = async (req, res) => {
  try {
    const isSuperAdmin = req.admin && req.admin.role === 'SuperAdmin';
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only SuperAdmin can clear system logs.'
      });
    }

    // Delete all records from the Log collection
    await Log.deleteMany({});

    // Write a fresh audit log record of the clear operation
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'CLEAR_LOGS',
      description: 'Permanently cleared all system logs from the database.',
      metadata: { clearedBy: req.admin.username },
      req
    });

    res.json({ success: true, message: 'All system logs have been permanently cleared from the database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLogs, getMedia, clearAllLogs };
