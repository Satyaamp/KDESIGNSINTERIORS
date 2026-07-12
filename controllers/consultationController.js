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

    // Fetch settings for recipient details
    const settings = await Settings.findOne();
    const recipientEmail = settings ? settings.contactEmail : 'kdesignsinteriors1@gmail.com';
    const recipientPhone = settings ? settings.contactPhone : '+9163540798445';

    // Send email notification to admin
    const emailSubject = `New Consultation Booking from ${name}`;
    const emailBody = `You have received a new consultation request:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCity: ${city || 'Not specified'}\nProject Type: ${projectType || 'Not specified'}\nProject Size: ${projectSize || 'Not specified'} SQFT\nBudget: ${budget || 'Not specified'}\nTimeline: ${timeline || 'Not specified'}\nMessage: ${message || 'None'}\nFloor Plan Link: ${floorPlanUpload.url || 'Not provided'}\nReference Images: ${imageUploads.length ? imageUploads.map(img => img.url).join('\n') : 'None'}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #1e1b18; padding: 24px; text-align: center; border-bottom: 2px solid #C5A880;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 1px; font-weight: 600; text-transform: uppercase;">New Consultation Request</h2>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Client Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 130px; color: #1e1b18;">Client Name:</td><td style="color: #4b5563;">${name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Email:</td><td style="color: #4b5563;"><a href="mailto:${email}" style="color: #C5A880; text-decoration: none;">${email}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Phone:</td><td style="color: #4b5563;"><a href="tel:${phone}" style="color: #C5A880; text-decoration: none;">${phone}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Location / City:</td><td style="color: #4b5563;">${city || 'Not specified'}</td></tr>
          </table>

          <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Project Specifications</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 130px; color: #1e1b18;">Project Type:</td><td style="color: #4b5563;">${projectType || 'Not specified'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Project Size:</td><td style="color: #4b5563;">${projectSize || 'Not specified'} SQFT</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Budget Limit:</td><td style="color: #4b5563;">${budget || 'Not specified'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Timeline:</td><td style="color: #4b5563;">${timeline || 'Not specified'}</td></tr>
          </table>

          <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Client Message</h3>
          <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; font-size: 14px; border: 1px solid #f3f4f6; color: #4b5563; margin-bottom: 20px;">
            ${message || 'No additional message provided.'}
          </div>

          ${floorPlanUpload.url ? `
            <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Floor Plan Attachment</h3>
            <div style="margin-bottom: 20px; text-align: center;">
              <a href="${floorPlanUpload.url}" target="_blank">
                <img src="${floorPlanUpload.url}" style="max-width: 100%; max-height: 200px; border-radius: 6px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              </a>
              <span style="display: block; font-size: 12px; color: #9ca3af; margin-top: 4px;">Click image to view high-resolution</span>
            </div>
          ` : ''}

          ${imageUploads.length ? `
            <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Reference Images (${imageUploads.length})</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${imageUploads.map(img => `
                <a href="${img.url}" target="_blank" style="display: inline-block;">
                  <img src="${img.url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Generated automatically by K.DESIGNS & INTERIORS System Administration
        </div>
      </div>
    `;

    try {
      // 1. Send email notification to admin (in background)
      sendMail(recipientEmail, emailSubject, emailBody, emailHtml)
        .catch(err => console.error('Admin consultation email dispatch failed:', err));

      // 2. Send premium confirmation email to customer/client (in background)
      const customerSubject = `Consultation Booking Received - K.DESIGNS & INTERIORS`;
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #1e1b18; padding: 24px; text-align: center; border-bottom: 2px solid #C5A880;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; font-weight: 600;">K.DESIGNS & INTERIORS</h2>
          </div>
          <div style="padding: 24px; color: #374151; line-height: 1.6;">
            <h3 style="color: #1e1b18; margin-top: 0; font-size: 18px;">Thank You, ${name}!</h3>
            <p>We have successfully received your request for a personalized interior design consultation. Our executive team will review your project requirements and reach out to you shortly.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <h4 style="color: #C5A880; margin-bottom: 12px; font-size: 15px;">Your Booking Summary:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 120px; color: #1e1b18;">Project Type:</td><td style="color: #6b7280;">${projectType || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Size:</td><td style="color: #6b7280;">${projectSize || 'Not specified'} SQFT</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Budget:</td><td style="color: #6b7280;">${budget || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Timeline:</td><td style="color: #6b7280;">${timeline || 'Not specified'}</td></tr>
            </table>
            <div style="margin-top: 25px; padding: 15px; background-color: #f9fafb; border-radius: 6px; border-left: 3px solid #C5A880; font-size: 12px; color: #6b7280; line-height: 1.5; text-align: left;">
              <strong style="color: #1e1b18; display: block; margin-bottom: 4px;">Automated Booking Confirmation</strong>
              This is an automatic confirmation receipt. If you need any assistance or want to make changes, please feel free to reply directly to this email, contact us at <strong>${recipientEmail}</strong>, or call us at <strong>${recipientPhone}</strong>.
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} K.DESIGNS & INTERIORS. All Rights Reserved.
          </div>
        </div>
      `;
      const customerText = `Dear ${name},\n\nThank you for booking a consultation with K.DESIGNS & INTERIORS!\nWe have received your request and will contact you shortly.\n\nProject Type: ${projectType || 'Not specified'}\nBudget: ${budget || 'Not specified'}\nTimeline: ${timeline || 'Not specified'}\n\nWarm regards,\nK.DESIGNS & INTERIORS`;

      sendMail(email, customerSubject, customerText, customerHtml)
        .catch(err => console.error('Customer consultation email dispatch failed:', err));
    } catch (mailError) {
      console.error('SMTP Mail trigger failed:', mailError);
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

    // Record activity log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'UPDATE_CONSULTATION',
      description: `Updated status of consultation request from '${consultation.name}' to '${status}'`,
      metadata: {
        consultationId: consultation._id,
        clientName: consultation.name,
        email: consultation.email,
        oldStatus: currentStatus,
        newStatus: status
      },
      req
    });

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

    // Record activity log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'DELETE_CONSULTATION',
      description: `Deleted consultation request from '${consultation.name}'`,
      metadata: {
        consultationId: consultation._id,
        clientName: consultation.name,
        email: consultation.email,
        projectType: consultation.projectType
      },
      req
    });

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
