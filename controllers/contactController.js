const Contact = require('../models/Contact');
const { sendMail } = require('../utils/mailer');
const Settings = require('../models/Settings');

// @desc    Submit contact request
// @route   POST /api/contacts
// @access  Public
const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const contact = await Contact.create({
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message
    });

    // Fetch settings for recipient details
    const settings = await Settings.findOne();
    const recipientEmail = settings ? settings.contactEmail : 'kdesignsinteriors1@gmail.com';
    const recipientPhone = settings ? settings.contactPhone : '+9163540798445';

    const emailSubject = `New Contact Form Inquiry: ${subject || 'General Inquiry'}`;
    const emailBody = `You have received a new contact inquiry:\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not specified'}\nSubject: ${subject || 'General Inquiry'}\nMessage: ${message}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #1e1b18; padding: 24px; text-align: center; border-bottom: 2px solid #C5A880;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 1px; font-weight: 600; text-transform: uppercase;">New Contact Inquiry</h2>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Inquiry Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 130px; color: #1e1b18;">Name:</td><td style="color: #4b5563;">${name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Email:</td><td style="color: #4b5563;"><a href="mailto:${email}" style="color: #C5A880; text-decoration: none;">${email}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Phone:</td><td style="color: #4b5563;"><a href="tel:${phone || ''}" style="color: #C5A880; text-decoration: none;">${phone || 'Not specified'}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #1e1b18;">Subject:</td><td style="color: #4b5563;">${subject || 'General Inquiry'}</td></tr>
          </table>

          <h3 style="color: #1e1b18; margin-top: 0; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Message Content</h3>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; font-size: 14px; border: 1px solid #f3f4f6; color: #4b5563;">
            ${message}
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Generated automatically by K.DESIGNS & INTERIORS System Administration
        </div>
      </div>
    `;

    try {
      // 1. Send alert to admin (in background)
      sendMail(recipientEmail, emailSubject, emailBody, emailHtml)
        .catch(err => console.error('Admin contact email dispatch failed:', err));

      // 2. Send email confirmation to the customer (in background)
      const customerSubject = `Inquiry Received - K.DESIGNS & INTERIORS`;
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #1e1b18; padding: 24px; text-align: center; border-bottom: 2px solid #C5A880;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; font-weight: 600;">K.DESIGNS & INTERIORS</h2>
          </div>
          <div style="padding: 24px; color: #374151; line-height: 1.6;">
            <h3 style="color: #1e1b18; margin-top: 0; font-size: 18px;">Hello, ${name}!</h3>
            <p>Thank you for reaching out to us. We have received your inquiry regarding "<strong>${subject || 'General Inquiry'}</strong>".</p>
            <p>Our team is currently reviewing your message and will get back to you as soon as possible.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; font-size: 14px; border: 1px solid #f3f4f6; color: #4b5563;">
              <strong style="color: #1e1b18; display: block; margin-bottom: 8px;">Your Message Preview:</strong>
              ${message}
            </div>
            <div style="margin-top: 25px; padding: 15px; background-color: #f9fafb; border-radius: 6px; border-left: 3px solid #C5A880; font-size: 12px; color: #6b7280; line-height: 1.5; text-align: left;">
              <strong style="color: #1e1b18; display: block; margin-bottom: 4px;">Automated Inquiry Confirmation</strong>
              This is an automatic confirmation receipt. If you need any assistance or want to add further details, please feel free to reply directly to this email, contact us at <strong>${recipientEmail}</strong>, or call us at <strong>${recipientPhone}</strong>.
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} K.DESIGNS & INTERIORS. All Rights Reserved.
          </div>
        </div>
      `;
      const customerText = `Dear ${name},\n\nThank you for reaching out to K.DESIGNS & INTERIORS!\nWe have received your message regarding: ${subject || 'General Inquiry'}.\nOur team will review your message and respond shortly.\n\nWarm regards,\nK.DESIGNS & INTERIORS`;

      sendMail(email, customerSubject, customerText, customerHtml)
        .catch(err => console.error('Customer contact email dispatch failed:', err));
    } catch (mailError) {
      console.error('SMTP Mail trigger failed:', mailError);
    }

    res.status(201).json({
      success: true,
      message: 'Your query has been sent successfully!',
      contact
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all contact inquiries
// @route   GET /api/contacts
// @access  Private (Admin only)
const getContacts = async (req, res) => {
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
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      contacts,
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

// @desc    Update contact status
// @route   PUT /api/contacts/:id
// @access  Private (Admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact request not found' });
    }

    if (status) {
      const currentStatus = contact.status;

      // Validate one-way state progression: Pending -> Read -> Replied
      if (currentStatus === 'Replied' && status !== currentStatus) {
        return res.status(400).json({ success: false, message: 'Cannot change status of a replied inquiry.' });
      }
      if (currentStatus === 'Read' && status === 'Pending') {
        return res.status(400).json({ success: false, message: 'Cannot revert status back to Pending.' });
      }

      let signer = 'Admin';
      if (req.admin) {
        const name = req.admin.name || 'Admin';
        const username = req.admin.username || '';
        signer = username ? `${name} (${username})` : name;
      }

      contact.status = status;
      contact.statusUpdatedBy = signer;
      contact.statusUpdatedAt = new Date();
    }

    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }

    await contact.save();
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact request
// @route   DELETE /api/contacts/:id
// @access  Private (Admin only)
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact request not found' });
    }
    await contact.deleteOne();
    res.json({ success: true, message: 'Contact request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createContact,
  getContacts,
  updateContactStatus,
  deleteContact
};
