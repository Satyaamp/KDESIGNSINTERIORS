const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    console.log('Attempting DB connection to:', process.env.MONGO_URI || 'fallback');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/k_designs', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default admin if no admins exist
    // Require model dynamically to avoid circular dependencies
    const Admin = require('../models/Admin');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        role: 'SuperAdmin'
      });
      console.log('Default admin seeded (username: admin, password: AdminPassword123!)');
    }

    // Seed default cities if no cities exist
    const City = require('../models/City');
    const citiesCount = await City.countDocuments();
    if (citiesCount === 0) {
      const defaultCities = [
        'GANDHIDHAM', 'ADIPUR', 'BHUJ', 'KUTCH', 'RAJKOT', 'AHMEDABAD', 'VADODARA', 'SURAT', 'UPLETA'
      ];
      for (const cityName of defaultCities) {
        await City.create({
          name: cityName,
          status: 'Active'
        });
      }
      console.log('Default serving cities seeded successfully!');
    }
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
