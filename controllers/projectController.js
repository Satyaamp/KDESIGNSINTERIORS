const Project = require('../models/Project');
const ProjectCategory = require('../models/ProjectCategory');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');
const { makeUniqueSlug } = require('../utils/slugify');

// --- Project Category CRUD ---

// @desc    Get all project categories
// @route   GET /api/project-categories
// @access  Public
const getProjectCategories = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    } else if (req.query.admin !== 'true') {
      filter.status = 'Active';
    }
    const categories = await ProjectCategory.find(filter).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create project category
// @route   POST /api/project-categories
// @access  Private (Admin only)
const createProjectCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const slug = await makeUniqueSlug(ProjectCategory, name);
    const category = await ProjectCategory.create({ name, slug, status: status || 'Active' });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project category
// @route   PUT /api/project-categories/:id
// @access  Private (Admin only)
const updateProjectCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const category = await ProjectCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (name && name !== category.name) {
      category.name = name;
      category.slug = await makeUniqueSlug(ProjectCategory, name);
    }
    if (status) category.status = status;
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project category
// @route   DELETE /api/project-categories/:id
// @access  Private (Admin only)
const deleteProjectCategory = async (req, res) => {
  try {
    const category = await ProjectCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const projectCount = await Project.countDocuments({ category: category._id });
    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category because it has projects associated with it.'
      });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Project CRUD ---

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12, status, location } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else if (req.query.admin !== 'true') {
      filter.status = 'Active';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (location) {
      filter.location = { $regex: new RegExp('^' + location + '$', 'i') };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const projects = await Project.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    const total = await Project.countDocuments(filter);
    
    res.json({
      success: true,
      projects,
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

// @desc    Get project by slug
// @route   GET /api/projects/slug/:slug
// @access  Public
const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin only)
const createProject = async (req, res) => {
  try {
    const { title, description, category, videoUrl, testimonials, status, metaTitle, metaDescription, keywords, location, completionDate } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required' });
    }
    
    const imageUploads = [];
    const floorPlanUploads = [];
    
    if (req.files) {
      if (req.files.images) {
        for (const file of req.files.images) {
          const img = await uploadImage(file.path, 'projects');
          imageUploads.push(img);
        }
      }
      if (req.files.floorPlans) {
        for (const file of req.files.floorPlans) {
          const fp = await uploadImage(file.path, 'floorplans');
          floorPlanUploads.push(fp);
        }
      }
    }
    
    const slug = await makeUniqueSlug(Project, title);
    
    const project = await Project.create({
      title,
      slug,
      description,
      category,
      images: imageUploads,
      videoUrl: videoUrl || '',
      location: location || '',
      completionDate: completionDate || '',
      floorPlans: floorPlanUploads,
      status: status || 'Active',
      testimonials: testimonials || '',
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || description.substring(0, 160),
        keywords: keywords || ''
      }
    });
    
    // Record project creation log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'CREATE_PROJECT',
      description: `Created project: "${project.title}"`,
      metadata: {
        projectId: project._id,
        projectTitle: project.title,
        category: project.category,
        status: project.status
      },
      req
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
const updateProject = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      videoUrl, 
      testimonials, 
      status, 
      metaTitle, 
      metaDescription, 
      keywords,
      keepExistingImages, // JSON string or array of public_ids
      keepExistingFloorPlans, // JSON string or array of public_ids
      location,
      completionDate
    } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const oldTitle = project.title;
    const oldDescription = project.description;
    const oldCategory = project.category;
    const oldLocation = project.location;
    const oldStatus = project.status;
    const oldImagesCount = (project.images || []).length;
    const oldFloorPlansCount = (project.floorPlans || []).length;

    if (title && title !== project.title) {
      project.title = title;
      project.slug = await makeUniqueSlug(Project, title);
    }
    
    if (description) project.description = description;
    if (category) project.category = category;
    if (videoUrl !== undefined) project.videoUrl = videoUrl;
    if (location !== undefined) project.location = location;
    if (completionDate !== undefined) project.completionDate = completionDate;
    if (testimonials !== undefined) project.testimonials = testimonials;
    if (status) project.status = status;
    
    // Parse kept images and floor plans
    let keptImageIds = [];
    if (keepExistingImages) {
      try {
        keptImageIds = typeof keepExistingImages === 'string' ? JSON.parse(keepExistingImages) : keepExistingImages;
      } catch (e) {
        keptImageIds = keepExistingImages.split(',');
      }
    } else {
      // If client didn't supply details, keep all existing (to avoid accidental deletion)
      keptImageIds = project.images.map(img => img.public_id);
    }

    let keptFpIds = [];
    if (keepExistingFloorPlans) {
      try {
        keptFpIds = typeof keepExistingFloorPlans === 'string' ? JSON.parse(keepExistingFloorPlans) : keepExistingFloorPlans;
      } catch (e) {
        keptFpIds = keepExistingFloorPlans.split(',');
      }
    } else {
      keptFpIds = project.floorPlans.map(fp => fp.public_id);
    }
    
    // Delete removed images from Cloudinary
    const imagesToDelete = project.images.filter(img => !keptImageIds.includes(img.public_id));
    for (const img of imagesToDelete) {
      await deleteImage(img.public_id);
    }

    // Delete removed floor plans from Cloudinary
    const fpsToDelete = project.floorPlans.filter(fp => !keptFpIds.includes(fp.public_id));
    for (const fp of fpsToDelete) {
      await deleteImage(fp.public_id);
    }

    // Append new uploaded images & floor plans
    const updatedImages = project.images.filter(img => keptImageIds.includes(img.public_id));
    const updatedFloorPlans = project.floorPlans.filter(fp => keptFpIds.includes(fp.public_id));

    if (req.files && req.files.images) {
      const filesList = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const file of filesList) {
        const img = await uploadImage(file.path, 'projects');
        updatedImages.push(img);
      }
    }

    if (req.files && req.files.floorPlans) {
      const filesList = Array.isArray(req.files.floorPlans) ? req.files.floorPlans : [req.files.floorPlans];
      for (const file of filesList) {
        const fp = await uploadImage(file.path, 'floorplans');
        updatedFloorPlans.push(fp);
      }
    }
    
    project.images = updatedImages;
    project.floorPlans = updatedFloorPlans;
    
    project.seo = {
      metaTitle: metaTitle || project.seo.metaTitle || project.title,
      metaDescription: metaDescription || project.seo.metaDescription || project.description.substring(0, 160),
      keywords: keywords || project.seo.keywords || ''
    };
    
    await project.save();

    const updatedFields = {};
    if (title && title !== oldTitle) updatedFields.title = { old: oldTitle, new: title };
    if (description && description !== oldDescription) updatedFields.description = { old: oldDescription.substring(0, 50) + '...', new: description.substring(0, 50) + '...' };
    if (category && category !== oldCategory) updatedFields.category = { old: oldCategory, new: category };
    if (location !== undefined && location !== oldLocation) updatedFields.location = { old: oldLocation, new: location };
    if (status && status !== oldStatus) updatedFields.status = { old: oldStatus, new: status };
    if (project.images.length !== oldImagesCount) updatedFields.imagesCount = { old: oldImagesCount, new: project.images.length };
    if (project.floorPlans.length !== oldFloorPlansCount) updatedFields.floorPlansCount = { old: oldFloorPlansCount, new: project.floorPlans.length };

    // Record project update log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'UPDATE_PROJECT',
      description: `Updated project: "${project.title}"`,
      metadata: {
        projectId: project._id,
        projectTitle: project.title,
        updatedFields
      },
      req
    });

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    for (const img of project.images) {
      await deleteImage(img.public_id);
    }
    for (const fp of project.floorPlans) {
      await deleteImage(fp.public_id);
    }
    
    await project.deleteOne();

    // Record project deletion log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'DELETE_PROJECT',
      description: `Deleted project: "${project.title}"`,
      metadata: {
        projectId: project._id,
        projectTitle: project.title
      },
      req
    });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProjectCategories,
  createProjectCategory,
  updateProjectCategory,
  deleteProjectCategory,
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject
};
