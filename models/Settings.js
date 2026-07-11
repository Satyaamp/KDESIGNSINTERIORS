const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'K.DESIGNS & INTERIORS'
  },
  logo: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' }
  },
  contactEmail: {
    type: String,
    default: 'kdesignsinteriors1@gmail.com'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  contactPhone: {
    type: String,
    default: '+9163540798445'
  },
  whatsappNumber: {
    type: String,
    default: '9163540798445'
  },
  address: {
    type: String,
    default: '45 , SILVER ARC COMPLEX  , PLOT NO 57 , SECTOR 8 , GANDHIDHAM -370201'
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  googleMapUrl: {
    type: String,
    default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3341.0775904409015!2d70.13660569999999!3d23.0647311!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3950b9578f0584df%3A0x4f40e9bedb39d814!2sK.%20Designs%20%26%20Interiors!5e1!3m2!1sen!2sin!4v1783704309663!5m2!1sen!2sin'
  },
  seo: {
    defaultMetaTitle: {
      type: String,
      default: 'K.DESIGNS & INTERIORS | Premium Architecture & Interior Design'
    },
    defaultMetaDescription: {
      type: String,
      default: 'Premium architecture & interior design services in Gandhidham, Adipur, Bhuj, Rajkot, Ahmedabad.'
    },
    defaultKeywords: {
      type: String,
      default: 'interior design, architect, home decor, villa design, commercial interior'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
