const Project = require('../models/Project');
const Blog = require('../models/Blog');
const ProjectCategory = require('../models/ProjectCategory');
const BlogCategory = require('../models/BlogCategory');
const { makeUniqueSlug } = require('../utils/slugify');
const { recordLog } = require('../utils/logger');

// @desc    Check if category is linked to any projects/blogs
// @route   GET /api/categories/check-linked
// @access  Private (Admin only)
const checkLinkedItems = async (req, res) => {
  try {
    const { type, id } = req.query;
    if (!type || !id) {
      return res.status(400).json({ success: false, message: 'Type and ID are required' });
    }

    let count = 0;
    if (type === 'projects') {
      count = await Project.countDocuments({ category: id, isDeleted: { $ne: true } });
    } else if (type === 'blogs') {
      count = await Blog.countDocuments({ category: id, isDeleted: { $ne: true } });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid category type' });
    }

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Transfer/Copy category between types
// @route   POST /api/categories/transfer
// @access  Private (Admin only)
const transferCategory = async (req, res) => {
  try {
    const { sourceId, sourceType, destinationType, mode, fallbackCategoryId } = req.body;

    if (!sourceId || !sourceType || !destinationType || !mode) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // 1. Resolve source category
    let sourceCategory = null;
    let SourceModel = sourceType === 'projects' ? ProjectCategory : BlogCategory;
    
    sourceCategory = await SourceModel.findById(sourceId);
    if (!sourceCategory) {
      return res.status(404).json({ success: false, message: 'Source category not found' });
    }

    // 2. Resolve destination model
    let DestModel = destinationType === 'projects' ? ProjectCategory : BlogCategory;

    // Check if target category with same name already exists
    let destCategory = await DestModel.findOne({ name: { $regex: new RegExp(`^${sourceCategory.name.trim()}$`, 'i') } });
    
    if (!destCategory) {
      // Create new category in destination
      const slug = await makeUniqueSlug(DestModel, sourceCategory.name);
      destCategory = await DestModel.create({
        name: sourceCategory.name,
        slug: slug,
        status: sourceCategory.status || 'Active'
      });
    }

    // 3. Handle moving (transfer and delete original)
    if (mode === 'move') {
      // Check linked items in source
      if (sourceType === 'projects') {
        const linkedCount = await Project.countDocuments({ category: sourceId });
        if (linkedCount > 0) {
          if (!fallbackCategoryId) {
            return res.status(400).json({ 
              success: false, 
              message: `This category is linked to ${linkedCount} projects. Please select a fallback category to reassign them.` 
            });
          }
          // Verify fallback category exists
          const fallbackCat = await ProjectCategory.findById(fallbackCategoryId);
          if (!fallbackCat) {
            return res.status(404).json({ success: false, message: 'Fallback reassignment category not found' });
          }
          // Reassign projects
          await Project.updateMany({ category: sourceId }, { category: fallbackCategoryId });
        }
        // Delete original category
        await sourceCategory.deleteOne();
      } else if (sourceType === 'blogs') {
        const linkedCount = await Blog.countDocuments({ category: sourceId });
        if (linkedCount > 0) {
          if (!fallbackCategoryId) {
            return res.status(400).json({ 
              success: false, 
              message: `This category is linked to ${linkedCount} blog posts. Please select a fallback category to reassign them.` 
            });
          }
          // Verify fallback category exists
          const fallbackCat = await BlogCategory.findById(fallbackCategoryId);
          if (!fallbackCat) {
            return res.status(404).json({ success: false, message: 'Fallback reassignment category not found' });
          }
          // Reassign blogs
          await Blog.updateMany({ category: sourceId }, { category: fallbackCategoryId });
        }
        // Delete original category
        await sourceCategory.deleteOne();
      }

      // Record Move Audit Log
      await recordLog({
        type: 'Activity',
        adminId: req.admin._id,
        username: req.admin.username,
        action: 'MOVE_CATEGORY',
        description: `Moved category "${sourceCategory.name}" from ${sourceType} to ${destinationType}`,
        metadata: {
          categoryName: sourceCategory.name,
          fromType: sourceType,
          toType: destinationType,
          mode: 'move'
        },
        req
      });

    } else {
      // Copy Mode: Just record log
      await recordLog({
        type: 'Activity',
        adminId: req.admin._id,
        username: req.admin.username,
        action: 'COPY_CATEGORY',
        description: `Copied category "${sourceCategory.name}" from ${sourceType} to ${destinationType}`,
        metadata: {
          categoryName: sourceCategory.name,
          fromType: sourceType,
          toType: destinationType,
          mode: 'copy'
        },
        req
      });
    }

    res.json({ 
      success: true, 
      message: mode === 'move' ? 'Category moved and converted successfully!' : 'Category copied and duplicated successfully!',
      sourceId,
      destId: destCategory._id,
      mode
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkLinkedItems,
  transferCategory
};
