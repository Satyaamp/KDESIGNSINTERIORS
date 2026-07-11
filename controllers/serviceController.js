const Service = require('../models/Service');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');
const { makeUniqueSlug } = require('../utils/slugify');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else if (req.query.admin !== 'true') {
      filter.status = 'Active';
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    const total = await Service.countDocuments(filter);
    
    res.json({
      success: true,
      services,
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

// @desc    Get service by slug
// @route   GET /api/services/slug/:slug
// @access  Public
const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin only)
const createService = async (req, res) => {
  try {
    const { title, description, status, metaTitle, metaDescription, keywords } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    
    const imageUploads = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const img = await uploadImage(file.path, 'services');
        imageUploads.push(img);
      }
    }
    
    const primaryImage = imageUploads.length > 0 ? imageUploads[0] : { url: '', public_id: '' };
    const slug = await makeUniqueSlug(Service, title);
    
    const service = await Service.create({
      title,
      slug,
      description,
      images: imageUploads,
      image: primaryImage,
      status: status || 'Active',
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || description.substring(0, 160),
        keywords: keywords || ''
      }
    });
    
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin only)
const updateService = async (req, res) => {
  try {
    const { title, description, status, metaTitle, metaDescription, keywords } = req.body;
    
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    if (title && title !== service.title) {
      service.title = title;
      service.slug = await makeUniqueSlug(Service, title);
    }
    
    if (description) service.description = description;
    if (status) service.status = status;
    
    // Handle existing images management
    const { keepExistingImages } = req.body;
    let keptImageIds = [];
    if (keepExistingImages) {
      try {
        keptImageIds = typeof keepExistingImages === 'string' ? JSON.parse(keepExistingImages) : keepExistingImages;
      } catch (e) {
        keptImageIds = keepExistingImages.split(',');
      }
    } else {
      // If not sent, default to keeping all current images
      keptImageIds = (service.images || []).map(img => img.public_id);
      // Fallback for old documents that only had single 'image'
      if (keptImageIds.length === 0 && service.image && service.image.public_id) {
        keptImageIds.push(service.image.public_id);
      }
    }

    // Identify which current images need to be deleted from Cloudinary
    const currentImages = service.images && service.images.length > 0
      ? service.images
      : (service.image && service.image.public_id ? [service.image] : []);

    const imagesToDelete = currentImages.filter(img => !keptImageIds.includes(img.public_id));
    for (const img of imagesToDelete) {
      if (img.public_id) {
        await deleteImage(img.public_id);
      }
    }

    // Base of updated images list
    const updatedImages = currentImages.filter(img => keptImageIds.includes(img.public_id));

    // Upload and append new files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const img = await uploadImage(file.path, 'services');
        updatedImages.push(img);
      }
    }

    service.images = updatedImages;
    service.image = updatedImages.length > 0 ? updatedImages[0] : { url: '', public_id: '' };
    
    service.seo = {
      metaTitle: metaTitle || service.seo.metaTitle || service.title,
      metaDescription: metaDescription || service.seo.metaDescription || service.description.substring(0, 160),
      keywords: keywords || service.seo.keywords || ''
    };
    
    await service.save();
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    // Delete all images in the gallery from Cloudinary
    if (service.images && service.images.length > 0) {
      for (const img of service.images) {
        if (img.public_id) {
          await deleteImage(img.public_id);
        }
      }
    } else if (service.image && service.image.public_id) {
      // Fallback for single image documents
      await deleteImage(service.image.public_id);
    }
    
    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServices,
  getServiceBySlug,
  createService,
  updateService,
  deleteService
};
