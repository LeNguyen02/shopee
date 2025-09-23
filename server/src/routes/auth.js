const express = require('express');
const { body, validationResult } = require('express-validator');
// Use MySQL database for user storage
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name must not be empty'),
  body('phone').optional().isMobilePhone(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        data: errors.array()
      });
    }

    const { email, password, name = email.split('@')[0], phone, address, date_of_birth } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(422).json({
        message: 'Email đã tồn tại',
        data: {
          email: 'Email đã tồn tại'
        }
      });
    }

    // Create new user
    const userId = await User.create({
      email,
      password,
      name,
      phone,
      address,
      date_of_birth
    });

    // Get created user (without password)
    const newUser = await User.findById(userId);
    const token = generateToken(userId);

    res.status(201).json({
      message: 'Đăng ký thành công',
      data: {
        access_token: token,
        expires: process.env.JWT_EXPIRES_IN || '7d',
        user: newUser
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        data: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(422).json({
        message: 'Email hoặc mật khẩu không đúng',
        data: {
          email: 'Email hoặc mật khẩu không đúng'
        }
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(422).json({
        message: 'Email hoặc mật khẩu không đúng',
        data: {
          password: 'Email hoặc mật khẩu không đúng'
        }
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Đăng nhập thành công',
      data: {
        access_token: token,
        expires: process.env.JWT_EXPIRES_IN || '7d',
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Đăng xuất thành công',
    data: null
  });
});

module.exports = router;
