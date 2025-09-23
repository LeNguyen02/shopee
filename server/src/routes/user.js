const express = require('express');
const { body, validationResult } = require('express-validator');
// Use MySQL database for user storage
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Lấy thông tin thành công',
      data: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone(),
  body('address').optional().trim(),
  body('date_of_birth').optional().isISO8601(),
  body('avatar').optional().isURL(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        data: errors.array()
      });
    }

    const { name, phone, address, date_of_birth, avatar } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updated = await User.updateById(req.user.id, updateData);
    
    if (!updated) {
      return res.status(400).json({
        message: 'Cập nhật thất bại',
        data: null
      });
    }

    // Get updated user data
    const updatedUser = await User.findById(req.user.id);

    res.json({
      message: 'Cập nhật thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('password').isLength({ min: 6 }).withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        data: errors.array()
      });
    }

    const { password, new_password } = req.body;

    // Get user with password
    const userWithPassword = await User.findByEmail(req.user.email);
    
    // Verify current password
    const isValidPassword = await User.verifyPassword(password, userWithPassword.password);
    if (!isValidPassword) {
      return res.status(422).json({
        message: 'Mật khẩu không đúng',
        data: {
          password: 'Mật khẩu không đúng'
        }
      });
    }

    // Update password
    const updated = await User.changePassword(req.user.id, new_password);
    
    if (!updated) {
      return res.status(400).json({
        message: 'Đổi mật khẩu thất bại',
        data: null
      });
    }

    res.json({
      message: 'Đổi mật khẩu thành công',
      data: null
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

module.exports = router;
