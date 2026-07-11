const Consultation = require('../models/Consultation');
const { sendMail } = require('../utils/mailer');
const Settings = require('../models/Settings');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');

// @desc    Submit consultation booking
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res) => {
  try {
    const { name, email, phone, city, projectType, projectSize, budget, timeline, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }

    let floorPlanUpload = { url: '', public_id: '' };
    const imageUploads = [];

    // Handle file uploads if they exist
    if (req.files) {
      // Floor Plan Upload
      if (req.files.floorPlan) {
        const file = Array.isArray(req.files.floorPlan) ? req.files.floorPlan[0] : req.files.floorPlan;
        const uploaded = await uploadImage(file.path, 'consultations/floorplans');
        floorPlanUpload = {
          url: uploaded.url,
          public_id: uploaded.public_id
        };
      }

      // Reference Images Upload
      if (req.files.images) {
        const filesList = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const file of filesList) {
          const uploaded = await uploadImage(file.path, 'consultations/images');
          imageUploads.push({
            url: uploaded.url,
            public_id: uploaded.public_id
          });
        }
      }
    }

    const consultation = await Consultation.create({
      name,
      email,
      phone,
      city: city || '',
      projectType: projectType || '',
      projectSize: projectSize || '',
      budget: budget || '',
      timeline: timeline || '',
      message: message || '',
      floorPlan: floorPlanUpload,
      images: imageUploads
    });

    // Fetch settings for recipient email
    const settings = await Settings.findOne();
    const recipientEmail = settings ? settings.contactEmail : 'kdesignsinteriors1@gmail.com';

    // Send email notification to admin
    const emailSubject = `New Consultation Booking from ${name}`;
    const emailBody = `You have received a new consultation request:
Name: ${name}
Email: ${email}
Phone: ${phone}
City: ${city || 'Not specified'}
Project Type: ${projectType || 'Not specified'}
Project Size: ${projectSize || 'Not specified'} SQFT
Budget: ${budget || 'Not specified'}
Timeline: ${timeline || 'Not specified'}
Message: ${message || 'None'}
Floor Plan Link: ${floorPlanUpload.url || 'Not provided'}
Reference Images: ${imageUploads.length ? imageUploads.map(img => img.url).join('\n') : 'None'}`;

    try {
      await sendMail(recipientEmail, emailSubject, emailBody);
    } catch (mailError) {
      console.error('SMTP Mail send failed:', mailError);
    }

    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully!',
      consultation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all consultation requests
// @route   GET /api/consultations
// @access  Private (Admin only)
const getConsultations = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { projectType: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const consultations = await Consultation.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Consultation.countDocuments(filter);

    res.json({
      success: true,
      consultations,
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

// @desc    Update consultation status
// @route   PUT /api/consultations/:id
// @access  Private (Admin only)
const updateConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation request not found' });
    }

    const currentStatus = consultation.status;

    // Validate one-way state progression: Pending -> Contacted -> Completed
    if (currentStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot change status of a completed request.' });
    }
    if (currentStatus === 'Contacted' && status === 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot revert status back to Pending.' });
    }

    consultation.status = status;
    
    let signer = 'Admin';
    if (req.admin) {
      const name = req.admin.name || 'Admin';
      const username = req.admin.username || '';
      signer = username ? `${name} (${username})` : name;
    }
    consultation.statusUpdatedBy = signer;
    consultation.statusUpdatedAt = new Date();
    
    await consultation.save();
    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete consultation request
// @route   DELETE /api/consultations/:id
// @access  Private (Admin only)
const deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation request not found' });
    }
    // Delete files from Cloudinary
    if (consultation.floorPlan && consultation.floorPlan.public_id) {
      await deleteImage(consultation.floorPlan.public_id);
    }
    if (consultation.images && consultation.images.length) {
      for (const img of consultation.images) {
        await deleteImage(img.public_id);
      }
    }

    await consultation.deleteOne();
    res.json({ success: true, message: 'Consultation request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createConsultation,
  getConsultations,
  updateConsultationStatus,
  deleteConsultation
};
