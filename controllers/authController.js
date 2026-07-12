const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_k_designs_key_123!';

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password'
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        profilePicture: admin.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/auth/profile
// @access  Private (Admin only)
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    res.json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private (Admin only)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all fields'
      });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password'
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update admin own profile
// @route   PUT /api/auth/profile
// @access  Private (Admin only)
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone !== undefined) admin.phone = phone;

    // Handle Profile Photo upload
    const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');
    if (req.file) {
      if (admin.profilePicture && admin.profilePicture.public_id) {
        await deleteImage(admin.profilePicture.public_id);
      }
      admin.profilePicture = await uploadImage(req.file.path, 'admins');
    }

    await admin.save();
    res.json({ success: true, message: 'Profile updated successfully', admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all admins
// @route   GET /api/auth/admins
// @access  Private (SuperAdmin only)
const getAdmins = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Requires SuperAdmin role' });
    }
    const admins = await Admin.find().select('-password');
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create sub-admin account
// @route   POST /api/auth/admins
// @access  Private (SuperAdmin only)
const createAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Requires SuperAdmin role' });
    }
    const { username, password, role, name, email, phone, permissions } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Parse permissions if sent as string JSON
    let permissionsArray = permissions;
    if (typeof permissions === 'string') {
      try {
        permissionsArray = JSON.parse(permissions);
      } catch (e) {
        permissionsArray = permissions.split(',').map(p => p.trim());
      }
    }

    const newAdmin = await Admin.create({
      username,
      password: hashedPassword,
      role: role || 'Editor',
      name: name || 'Admin Member',
      email: email || 'admin@kdesigns.com',
      phone: phone || '',
      permissions: permissionsArray || ['services', 'projects', 'categories', 'blogs', 'testimonials', 'team', 'consultations', 'contacts', 'settings']
    });
    res.status(201).json({ success: true, admin: newAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update admin account details and permissions
// @route   PUT /api/auth/admins/:id
// @access  Private (SuperAdmin only)
const updateAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Requires SuperAdmin role' });
    }
    const { username, password, role, name, email, phone, permissions } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    if (username) {
      const existing = await Admin.findOne({ username, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
      admin.username = username;
    }

    if (password && password.trim() !== '') {
      admin.password = await bcrypt.hash(password, 10);
    }

    if (role) admin.role = role;
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone !== undefined) admin.phone = phone;
    
    if (permissions) {
      let permissionsArray = permissions;
      if (typeof permissions === 'string') {
        try {
          permissionsArray = JSON.parse(permissions);
        } catch (e) {
          permissionsArray = permissions.split(',').map(p => p.trim());
        }
      }
      admin.permissions = permissionsArray;
    }

    await admin.save();
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete admin account
// @route   DELETE /api/auth/admins/:id
// @access  Private (SuperAdmin only)
const deleteAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Requires SuperAdmin role' });
    }
    // Prevent deleting own account
    if (req.admin._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own active session account' });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Delete profile picture from Cloudinary if exists
    const { deleteImage } = require('../utils/cloudinaryHelper');
    if (admin.profilePicture && admin.profilePicture.public_id) {
      await deleteImage(admin.profilePicture.public_id);
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check admin user role by username
// @route   GET /api/auth/check-role/:username
// @access  Public
const checkUsernameRole = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const admin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No such user exists'
      });
    }

    res.status(200).json({
      success: true,
      role: admin.role
    });
  } catch (error) {
    console.error('Error checking role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking role'
    });
  }
};

module.exports = {
  login,
  getProfile,
  changePassword,
  updateProfile,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  checkUsernameRole
};
