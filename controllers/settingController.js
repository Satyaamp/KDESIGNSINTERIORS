const Settings = require('../models/Settings');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');
const { sendMail } = require('../utils/mailer');

// @desc    Get website settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateSettings = async (req, res) => {
  try {
    const {
      siteName,
      contactEmail,
      contactPhone,
      whatsappNumber,
      address,
      googleMapUrl,
      facebook,
      instagram,
      linkedin,
      youtube,
      defaultMetaTitle,
      defaultMetaDescription,
      defaultKeywords
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (siteName) settings.siteName = siteName;
    if (contactEmail && contactEmail !== settings.contactEmail) {
      settings.contactEmail = contactEmail;
      settings.isEmailVerified = false;
    }
    if (contactPhone) settings.contactPhone = contactPhone;
    if (whatsappNumber) settings.whatsappNumber = whatsappNumber;
    if (address) settings.address = address;
    if (googleMapUrl !== undefined) settings.googleMapUrl = googleMapUrl;

    settings.socialLinks = {
      facebook: facebook !== undefined ? facebook : settings.socialLinks.facebook,
      instagram: instagram !== undefined ? instagram : settings.socialLinks.instagram,
      linkedin: linkedin !== undefined ? linkedin : settings.socialLinks.linkedin,
      youtube: youtube !== undefined ? youtube : settings.socialLinks.youtube
    };

    settings.seo = {
      defaultMetaTitle: defaultMetaTitle !== undefined ? defaultMetaTitle : settings.seo.defaultMetaTitle,
      defaultMetaDescription: defaultMetaDescription !== undefined ? defaultMetaDescription : settings.seo.defaultMetaDescription,
      defaultKeywords: defaultKeywords !== undefined ? defaultKeywords : settings.seo.defaultKeywords
    };

    if (req.file) {
      if (settings.logo && settings.logo.public_id) {
        await deleteImage(settings.logo.public_id);
      }
      settings.logo = await uploadImage(req.file.path, 'branding');
    }

    await settings.save();

    // Record log settings update
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'UPDATE_SETTINGS',
      description: `Updated system configurations`,
      req
    });

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to verify a new settings email
// @route   POST /api/settings/send-otp
// @access  Private (Admin only)
const sendEmailVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in global memory map with 10 minutes expiry
    global.tempEmailOtp = global.tempEmailOtp || {};
    global.tempEmailOtp[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000
    };

    // Send the email containing the OTP
    const emailSubject = `Email Verification OTP - K.DESIGNS & INTERIORS`;
    const emailBody = `Dear Administrator,\n\nYour OTP to verify and update the Public Email Address in your System Settings is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.\n\nWarm regards,\nK.DESIGNS & INTERIORS`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #1e1b18; padding: 20px; text-align: center; border-bottom: 2px solid #C5A880;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 1px; font-weight: 600;">K.DESIGNS & INTERIORS</h2>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px;">Verify Public Email Change</h3>
          <p>You requested to update the public notification email address in System Settings. Please use the following One-Time Password (OTP) to complete verification:</p>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #C5A880;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">This OTP is valid for 10 minutes. If you did not initiate this change, no action is required.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 12px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} K.DESIGNS & INTERIORS.
        </div>
      </div>
    `;

    await sendMail(email, emailSubject, emailBody, emailHtml);

    // Record OTP sent
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'SEND_OTP',
      description: `Sent email verification OTP to '${email}'`,
      req
    });

    res.json({ success: true, message: 'Verification OTP sent successfully!' });
  } catch (error) {
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Error',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'SEND_OTP_FAILED',
      description: `Failed to send email verification OTP to '${email}': ${error.message}`,
      metadata: { error: error.message },
      req
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and update the settings email directly
// @route   POST /api/settings/verify-otp
// @access  Private (Admin only)
const verifyEmailVerificationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const storedEntry = global.tempEmailOtp ? global.tempEmailOtp[email] : null;
    const { recordLog } = require('../utils/logger');
    if (!storedEntry) {
      await recordLog({
        type: 'Error',
        adminId: req.admin._id,
        username: req.admin.username,
        action: 'OTP_VERIFICATION_FAILED',
        description: `OTP verification failed for '${email}': No OTP requested`,
        req
      });
      return res.status(400).json({ success: false, message: 'No OTP requested for this email address.' });
    }

    if (Date.now() > storedEntry.expires) {
      delete global.tempEmailOtp[email];
      await recordLog({
        type: 'Error',
        adminId: req.admin._id,
        username: req.admin.username,
        action: 'OTP_VERIFICATION_FAILED',
        description: `OTP verification failed for '${email}': OTP has expired`,
        req
      });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (storedEntry.otp !== otp.trim()) {
      await recordLog({
        type: 'Error',
        adminId: req.admin._id,
        username: req.admin.username,
        action: 'OTP_VERIFICATION_FAILED',
        description: `OTP verification failed for '${email}': Invalid OTP code`,
        req
      });
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    // Success! Update email directly in Settings collection
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.contactEmail = email;
    settings.isEmailVerified = true;
    await settings.save();

    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'VERIFY_OTP_SUCCESS',
      description: `Successfully verified and updated public notification email to '${email}'`,
      req
    });

    // Clear temp memory entry
    delete global.tempEmailOtp[email];

    res.json({ success: true, message: 'Email address verified and updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp
};
