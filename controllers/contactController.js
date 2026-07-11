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

    // Fetch settings for recipient email
    const settings = await Settings.findOne();
    const recipientEmail = settings ? settings.contactEmail : 'kdesignsinteriors1@gmail.com';

    const emailSubject = `New Contact Form Inquiry: ${subject || 'General Inquiry'}`;
    const emailBody = `You have received a new contact inquiry:
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not specified'}
Subject: ${subject || 'General Inquiry'}
Message: ${message}`;

    await sendMail(recipientEmail, emailSubject, emailBody);

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
