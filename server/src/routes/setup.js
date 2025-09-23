const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Setup admin user (development only)
router.post('/create-admin', async (req, res) => {
  try {
    // Create admin user
    const adminData = {
      email: 'admin@shopee.com',
      password: 'admin123',
      name: 'Admin User',
      roles: 'Admin'
    };

    const existingAdmin = await User.findByEmail(adminData.email);
    if (existingAdmin) {
      // Update existing user to admin
      await User.updateRole(existingAdmin.id, 'Admin');
      return res.json({
        message: 'Admin user updated successfully',
        data: { email: adminData.email, roles: 'Admin' }
      });
    }

    const admin = await User.create(adminData);
    res.json({
      message: 'Admin user created successfully',
      data: { email: admin.email, roles: admin.roles }
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      message: 'Error creating admin',
      data: null
    });
  }
});

module.exports = router;
