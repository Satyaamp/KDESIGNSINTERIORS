const Settings = require('../models/Settings');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');

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
    if (contactEmail) settings.contactEmail = contactEmail;
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
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
