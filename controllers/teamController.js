const TeamMember = require('../models/TeamMember');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
const getTeamMembers = async (req, res) => {
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
        { designation: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const teamMembers = await TeamMember.find(filter)
      .sort({ createdAt: 1 }) // Order chronologically or customized
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    const total = await TeamMember.countDocuments(filter);
    
    res.json({
      success: true,
      teamMembers,
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

// @desc    Create team member
// @route   POST /api/team
// @access  Private (Admin only)
const createTeamMember = async (req, res) => {
  try {
    const { name, designation, facebook, instagram, linkedin, status } = req.body;
    
    if (!name || !designation) {
      return res.status(400).json({ success: false, message: 'Name and designation are required' });
    }
    
    let imageData = { url: '', public_id: '' };
    if (req.file) {
      imageData = await uploadImage(req.file.path, 'team');
    }
    
    const teamMember = await TeamMember.create({
      name,
      designation,
      image: imageData,
      socialLinks: {
        facebook: facebook || '',
        instagram: instagram || '',
        linkedin: linkedin || ''
      },
      status: status || 'Active'
    });
    
    // Record create team member log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'CREATE_TEAM_MEMBER',
      description: `Added team member: "${teamMember.name}" (${teamMember.designation})`,
      metadata: {
        memberId: teamMember._id,
        memberName: teamMember.name,
        designation: teamMember.designation,
        status: teamMember.status
      },
      req
    });

    res.status(201).json({ success: true, teamMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update team member
// @route   PUT /api/team/:id
// @access  Private (Admin only)
const updateTeamMember = async (req, res) => {
  try {
    const { name, designation, facebook, instagram, linkedin, status } = req.body;
    
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const oldName = teamMember.name;
    const oldDesignation = teamMember.designation;
    const oldStatus = teamMember.status;
    const oldImage = teamMember.image ? teamMember.image.url : '';
    
    if (name) teamMember.name = name;
    if (designation) teamMember.designation = designation;
    if (status) teamMember.status = status;
    
    // Update individual social links if passed
    if (facebook !== undefined) teamMember.socialLinks.facebook = facebook;
    if (instagram !== undefined) teamMember.socialLinks.instagram = instagram;
    if (linkedin !== undefined) teamMember.socialLinks.linkedin = linkedin;
    
    if (req.file) {
      if (teamMember.image && teamMember.image.public_id) {
        await deleteImage(teamMember.image.public_id);
      }
      teamMember.image = await uploadImage(req.file.path, 'team');
    }
    
    await teamMember.save();

    const updatedFields = {};
    if (name && name !== oldName) updatedFields.name = { old: oldName, new: name };
    if (designation && designation !== oldDesignation) updatedFields.designation = { old: oldDesignation, new: designation };
    if (status && status !== oldStatus) updatedFields.status = { old: oldStatus, new: status };
    if (req.file) updatedFields.image = { old: oldImage ? 'Previous Image' : 'None', new: 'Newly Uploaded Image' };

    // Record update team member log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'UPDATE_TEAM_MEMBER',
      description: `Updated team member details for: "${teamMember.name}"`,
      metadata: {
        memberId: teamMember._id,
        memberName: teamMember.name,
        updatedFields
      },
      req
    });

    res.json({ success: true, teamMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Private (Admin only)
const deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    
    if (teamMember.image && teamMember.image.public_id) {
      await deleteImage(teamMember.image.public_id);
    }
    
    await teamMember.deleteOne();

    // Record delete team member log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'DELETE_TEAM_MEMBER',
      description: `Removed team member: "${teamMember.name}"`,
      metadata: {
        memberId: teamMember._id,
        memberName: teamMember.name
      },
      req
    });

    res.json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
