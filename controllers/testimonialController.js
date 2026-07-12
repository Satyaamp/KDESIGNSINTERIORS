const Testimonial = require('../models/Testimonial');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
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
        { name: { $regex: search, $options: 'i' } },
        { review: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    const total = await Testimonial.countDocuments(filter);
    
    res.json({
      success: true,
      testimonials,
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

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Private (Admin only)
const createTestimonial = async (req, res) => {
  try {
    const { name, designation, review, rating, status } = req.body;
    
    if (!name || !review) {
      return res.status(400).json({ success: false, message: 'Name and review content are required' });
    }
    
    let imageData = { url: '', public_id: '' };
    if (req.file) {
      imageData = await uploadImage(req.file.path, 'testimonials');
    }
    
    const testimonial = await Testimonial.create({
      name,
      designation: designation || 'Client',
      review,
      rating: rating ? parseInt(rating) : 5,
      image: imageData,
      status: status || 'Active'
    });
    
    // Record create testimonial log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'CREATE_TESTIMONIAL',
      description: `Added client testimonial for: "${testimonial.name}"`,
      metadata: {
        testimonialId: testimonial._id,
        clientName: testimonial.name,
        status: testimonial.status
      },
      req
    });

    res.status(201).json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin only)
const updateTestimonial = async (req, res) => {
  try {
    const { name, designation, review, rating, status } = req.body;
    
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    const oldName = testimonial.name;
    const oldDesignation = testimonial.designation;
    const oldReview = testimonial.review;
    const oldRating = testimonial.rating;
    const oldStatus = testimonial.status;
    const oldImage = testimonial.image ? testimonial.image.url : '';
    
    if (name) testimonial.name = name;
    if (designation) testimonial.designation = designation;
    if (review) testimonial.review = review;
    if (rating) testimonial.rating = parseInt(rating);
    if (status) testimonial.status = status;
    
    if (req.file) {
      if (testimonial.image && testimonial.image.public_id) {
        await deleteImage(testimonial.image.public_id);
      }
      testimonial.image = await uploadImage(req.file.path, 'testimonials');
    }
    
    await testimonial.save();

    const updatedFields = {};
    if (name && name !== oldName) updatedFields.name = { old: oldName, new: name };
    if (designation && designation !== oldDesignation) updatedFields.designation = { old: oldDesignation, new: designation };
    if (review && review !== oldReview) updatedFields.review = { old: oldReview.substring(0, 50) + '...', new: review.substring(0, 50) + '...' };
    if (rating && parseInt(rating) !== oldRating) updatedFields.rating = { old: oldRating, new: parseInt(rating) };
    if (status && status !== oldStatus) updatedFields.status = { old: oldStatus, new: status };
    if (req.file) updatedFields.image = { old: oldImage ? 'Previous Image' : 'None', new: 'Newly Uploaded Image' };

    // Record update testimonial log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'UPDATE_TESTIMONIAL',
      description: `Updated testimonial details for: "${testimonial.name}"`,
      metadata: {
        testimonialId: testimonial._id,
        clientName: testimonial.name,
        updatedFields
      },
      req
    });

    res.json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin only)
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    if (testimonial.image && testimonial.image.public_id) {
      await deleteImage(testimonial.image.public_id);
    }
    
    await testimonial.deleteOne();

    // Record delete testimonial log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'DELETE_TESTIMONIAL',
      description: `Deleted testimonial for: "${testimonial.name}"`,
      metadata: {
        testimonialId: testimonial._id,
        clientName: testimonial.name
      },
      req
    });

    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
