const City = require('../models/City');

// @desc    Get all serving cities
// @route   GET /api/cities
// @access  Public
const getCities = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const cities = await City.find(filter).sort({ name: 1 });
    res.json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create serving city
// @route   POST /api/cities
// @access  Private (Admin only)
const createCity = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }
    const existing = await City.findOne({ name: name.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'City already exists' });
    }
    const city = await City.create({ name, status: status || 'Active' });

    // Record create city log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'CREATE_CITY',
      description: `Added serving city: "${city.name}"`,
      metadata: {
        cityId: city._id,
        cityName: city.name,
        status: city.status
      },
      req
    });

    res.status(201).json({ success: true, city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update serving city
// @route   PUT /api/cities/:id
// @access  Private (Admin only)
const updateCity = async (req, res) => {
  try {
    const { name, status } = req.body;
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    const oldName = city.name;
    const oldStatus = city.status;
    if (name) {
      const existing = await City.findOne({ name: name.toUpperCase(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'City name already taken' });
      }
      city.name = name;
    }
    if (status) {
      city.status = status;
    }
    await city.save();

    const updatedFields = {};
    if (name && name !== oldName) updatedFields.name = { old: oldName, new: name };
    if (status && status !== oldStatus) updatedFields.status = { old: oldStatus, new: status };

    // Record update city log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'UPDATE_CITY',
      description: `Updated serving city: "${city.name}"`,
      metadata: {
        cityId: city._id,
        cityName: city.name,
        updatedFields
      },
      req
    });

    res.json({ success: true, city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete serving city
// @route   DELETE /api/cities/:id
// @access  Private (Admin only)
const deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    await city.deleteOne();

    // Record delete city log
    const { recordLog } = require('../utils/logger');
    await recordLog({
      type: 'Activity',
      adminId: req.admin._id,
      username: req.admin.username,
      action: 'DELETE_CITY',
      description: `Removed serving city: "${city.name}"`,
      metadata: {
        cityId: city._id,
        cityName: city.name
      },
      req
    });

    res.json({ success: true, message: 'City removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCities,
  createCity,
  updateCity,
  deleteCity
};
