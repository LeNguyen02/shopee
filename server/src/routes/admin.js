const express = require('express');
const { requireAdmin } = require('../middleware/adminAuth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { uploadCategoryImage } = require('../middleware/uploadCategory');
const User = require('../models/User');
const Product = require('../models/Product');
const { pool } = require('../config/database');
const FlashSale = require('../models/FlashSale');


const router = express.Router();

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng',
        data: null
      });
    }

    // Check password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng',
        data: null
      });
    }

    // Check if user is admin
    if (user.roles !== 'Admin') {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập admin',
        data: null
      });
    }

    // Generate token
    const { generateToken } = require('../middleware/auth');
    const token = generateToken(user.id);

    res.json({
      message: 'Đăng nhập admin thành công',
      data: {
        access_token: token,
        expires: process.env.JWT_EXPIRES_IN,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Admin dashboard - get stats
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Aggregate counts from DB
    const [userRows] = await pool.execute('SELECT COUNT(*) AS total, SUM(CASE WHEN roles = "Admin" THEN 1 ELSE 0 END) AS admins FROM users');
    const [productRows] = await pool.execute('SELECT COUNT(*) AS total FROM products');
    const [categoryRows] = await pool.execute('SELECT COUNT(*) AS total FROM categories');
    const [orderRows] = await pool.execute('SELECT COUNT(*) AS total FROM orders');

    const totalUsers = Number(userRows?.[0]?.total || 0);
    const adminUsers = Number(userRows?.[0]?.admins || 0);
    const totalProducts = Number(productRows?.[0]?.total || 0);
    const totalCategories = Number(categoryRows?.[0]?.total || 0);
    const totalOrders = Number(orderRows?.[0]?.total || 0);

    res.json({
      message: 'Thống kê admin',
      data: {
        stats: {
          totalUsers,
          adminUsers,
          regularUsers: Math.max(totalUsers - adminUsers, 0),
          totalProducts,
          totalCategories,
          totalOrders
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({
      message: 'Danh sách người dùng',
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles: user.roles,
        verify: user.verify,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu', data: null });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại', data: null });
    }
    const id = await User.create({ email, password, name: name || '', roles: roles === 'Admin' ? 'Admin' : 'User' });
    const created = await User.findById(id);
    return res.json({ message: 'Tạo người dùng thành công', data: created });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});


// Update user role (admin only)
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    
    if (!['User', 'Admin'].includes(roles)) {
      return res.status(400).json({
        message: 'Role không hợp lệ',
        data: null
      });
    }
    
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
        data: null
      });
    }
    
    await User.update(parseInt(id), { roles });
    
    res.json({
      message: 'Cập nhật role thành công',
      data: null
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Update user info (admin only)
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'phone', 'address', 'date_of_birth'];
    const body = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) body[k] = req.body[k];
    });

    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng', data: null });
    }

    await User.update(parseInt(id), body);
    return res.json({ message: 'Cập nhật người dùng thành công', data: null });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng', data: null });
    }
    await User.deleteById(parseInt(id));
    return res.json({ message: 'Xóa người dùng thành công', data: null });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

// Image upload endpoint
router.post('/upload/image', requireAdmin, (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        message: 'Lỗi upload hình ảnh: ' + err.message,
        data: null
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        message: 'Không có file được chọn',
        data: null
      });
    }
    
    // Return the relative URL for frontend proxy
    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    res.json({
      message: 'Upload hình ảnh thành công',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });
  });
});

// Multiple images upload endpoint
router.post('/upload/images', requireAdmin, (req, res) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        message: 'Lỗi upload hình ảnh: ' + err.message,
        data: null
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'Không có file được chọn',
        data: null
      });
    }
    
    // Return the relative URLs for frontend proxy
    const imageUrls = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/products/${file.filename}`
    }));
    
    res.json({
      message: 'Upload hình ảnh thành công',
      data: imageUrls
    });
  });
});

// Category image upload endpoint
router.post('/upload/category-image', requireAdmin, (req, res) => {
  uploadCategoryImage(req, res, (err) => {
    if (err) {
      console.error('Category upload error:', err);
      return res.status(400).json({
        message: 'Lỗi upload hình ảnh category: ' + err.message,
        data: null
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        message: 'Không có file được chọn',
        data: null
      });
    }
    
    // Return the relative URL for frontend proxy
    const imageUrl = `/uploads/categories/${req.file.filename}`;
    
    res.json({
      message: 'Upload hình ảnh category thành công',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });
  });
});

// Admin Products Management
// Get all products (admin only)
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 30, search = '', category = '' } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      name: search
    };
    
    if (category) {
      filters.category = parseInt(category);
    }
    
    const products = await Product.findAll(filters);
    const total = await Product.getCount(filters);
    
    res.json({
      message: 'Danh sách sản phẩm',
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          page_size: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get product by ID (admin only)
router.get('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(parseInt(id));
    
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
        data: null
      });
    }
    
    res.json({
      message: 'Chi tiết sản phẩm',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Create product (admin only)
router.post('/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, category_id, image, images, price, price_before_discount, quantity } = req.body;
    
    // Validation
    if (!name || !price) {
      return res.status(400).json({
        message: 'Tên sản phẩm và giá là bắt buộc',
        data: null
      });
    }
    
    if (price <= 0) {
      return res.status(400).json({
        message: 'Giá sản phẩm phải lớn hơn 0',
        data: null
      });
    }
    
    const productData = {
      name,
      description: description || '',
      category_id: category_id ? parseInt(category_id) : null,
      image: image || '',
      images: images ? JSON.stringify(images) : '[]',
      price: parseFloat(price),
      price_before_discount: price_before_discount ? parseFloat(price_before_discount) : null,
      quantity: quantity ? parseInt(quantity) : 0,
      sold: 0,
      view: 0,
      rating: 0
    };
    
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category_id, image, images, price, price_before_discount, quantity, sold, view, rating, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        productData.name,
        productData.description,
        productData.category_id,
        productData.image,
        productData.images,
        productData.price,
        productData.price_before_discount,
        productData.quantity,
        productData.sold,
        productData.view,
        productData.rating
      ]
    );
    
    const newProduct = await Product.findById(result.insertId);
    
    res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      data: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Update product (admin only)
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, image, images, price, price_before_discount, quantity } = req.body;
    
    // Check if product exists
    const existingProduct = await Product.findById(parseInt(id));
    if (!existingProduct) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
        data: null
      });
    }
    
    // Validation
    if (!name || !price) {
      return res.status(400).json({
        message: 'Tên sản phẩm và giá là bắt buộc',
        data: null
      });
    }
    
    if (price <= 0) {
      return res.status(400).json({
        message: 'Giá sản phẩm phải lớn hơn 0',
        data: null
      });
    }
    
    const updateData = {
      name,
      description: description || '',
      category_id: category_id ? parseInt(category_id) : null,
      image: image || '',
      images: images ? JSON.stringify(images) : '[]',
      price: parseFloat(price),
      price_before_discount: price_before_discount ? parseFloat(price_before_discount) : null,
      quantity: quantity ? parseInt(quantity) : 0
    };
    
    await pool.query(
      'UPDATE products SET name = ?, description = ?, category_id = ?, image = ?, images = ?, price = ?, price_before_discount = ?, quantity = ?, updated_at = NOW() WHERE id = ?',
      [
        updateData.name,
        updateData.description,
        updateData.category_id,
        updateData.image,
        updateData.images,
        updateData.price,
        updateData.price_before_discount,
        updateData.quantity,
        id
      ]
    );
    
    const updatedProduct = await Product.findById(parseInt(id));
    
    res.json({
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Delete product (admin only)
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await Product.findById(parseInt(id));
    if (!existingProduct) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
        data: null
      });
    }
    
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({
      message: 'Xóa sản phẩm thành công',
      data: null
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Admin Orders Management
// Get all orders (admin only)
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', payment_status = '', search = '' } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND o.order_status = ?';
      params.push(status);
    }
    
    if (payment_status) {
      whereClause += ' AND o.payment_status = ?';
      params.push(payment_status);
    }
    
    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR o.id = ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, search);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get orders with pagination
    const [orderRows] = await pool.query(`
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_image', oi.product_image,
            'price', oi.price,
            'price_before_discount', oi.price_before_discount,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const [countRows] = await pool.query(`
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${whereClause}
    `, params);
    
    const total = countRows[0].total;
    
    const orders = orderRows.map(order => {
      // Handle delivery_address - check if it's already an object or needs parsing
      if (typeof order.delivery_address === 'string') {
        order.delivery_address = JSON.parse(order.delivery_address);
      }
      // Handle items - check if it's already an object or needs parsing
      if (typeof order.items === 'string') {
        order.items = JSON.parse(order.items);
      }
      return order;
    });
    
    res.json({
      message: 'Danh sách đơn hàng',
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          page_size: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get order by ID (admin only)
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [orderRows] = await pool.query(`
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_image', oi.product_image,
            'price', oi.price,
            'price_before_discount', oi.price_before_discount,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        message: 'Đơn hàng không tồn tại',
        data: null
      });
    }
    
    const order = orderRows[0];
    // Handle delivery_address - check if it's already an object or needs parsing
    if (typeof order.delivery_address === 'string') {
      order.delivery_address = JSON.parse(order.delivery_address);
    }
    // Handle items - check if it's already an object or needs parsing
    if (typeof order.items === 'string') {
      order.items = JSON.parse(order.items);
    }
    
    // Get order transactions
    const [transactionRows] = await pool.query(`
      SELECT 
        ot.*,
        u.name as admin_name,
        u.email as admin_email
      FROM order_transactions ot
      LEFT JOIN users u ON ot.admin_id = u.id
      WHERE ot.order_id = ?
      ORDER BY ot.created_at DESC
    `, [id]);
    
    res.json({
      message: 'Chi tiết đơn hàng',
      data: {
        order,
        transactions: transactionRows
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Update order status (admin only)
router.put('/orders/:id/status', requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { order_status, payment_status, notes } = req.body;
    const adminId = req.user.id;
    
    // Check if order exists
    const [orderRows] = await connection.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        message: 'Đơn hàng không tồn tại',
        data: null
      });
    }
    
    const order = orderRows[0];
    const updates = [];
    const params = [];
    
    // Update order status
    if (order_status && order_status !== order.order_status) {
      updates.push('order_status = ?');
      params.push(order_status);
      
      // Log transaction
      await connection.query(
        `INSERT INTO order_transactions (order_id, admin_id, transaction_type, old_status, new_status, notes) 
         VALUES (?, ?, 'order_status_change', ?, ?, ?)`,
        [id, adminId, order.order_status, order_status, notes || null]
      );
    }
    
    // Update payment status
    if (payment_status && payment_status !== order.payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
      
      // Log transaction
      await connection.query(
        `INSERT INTO order_transactions (order_id, admin_id, transaction_type, old_status, new_status, notes) 
         VALUES (?, ?, 'payment_status_change', ?, ?, ?)`,
        [id, adminId, order.payment_status, payment_status, notes || null]
      );
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);
      
      await connection.query(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
    
    await connection.commit();
    
    // Get updated order
    const [updatedOrderRows] = await connection.query(`
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_image', oi.product_image,
            'price', oi.price,
            'price_before_discount', oi.price_before_discount,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);
    
    const updatedOrder = updatedOrderRows[0];
    if (typeof updatedOrder.delivery_address === 'string') {
      updatedOrder.delivery_address = JSON.parse(updatedOrder.delivery_address);
    }
    if (typeof updatedOrder.items === 'string') {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    }
    
    res.json({
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Update order status error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  } finally {
    connection.release();
  }
});

// Flash Sales (admin)
router.post('/flash-sales', requireAdmin, async (req, res) => {
  try {
    const { name, start_time, end_time, is_active = 1 } = req.body;
    if (!name || !start_time || !end_time) {
      return res.status(400).json({ message: 'name, start_time, end_time are required', data: null });
    }
    const sale = await FlashSale.create({ name, start_time, end_time, is_active });
    res.status(201).json({ message: 'Tạo flash sale thành công', data: sale });
  } catch (error) {
    console.error('Create flash sale error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

router.put('/flash-sales/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_time, end_time, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (is_active !== undefined) updates.is_active = is_active;
    const sale = await FlashSale.update(parseInt(id), updates);
    if (!sale) return res.status(404).json({ message: 'Flash sale không tồn tại', data: null });
    res.json({ message: 'Cập nhật flash sale thành công', data: sale });
  } catch (error) {
    console.error('Update flash sale error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

router.post('/flash-sales/:id/items', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // [{product_id, sale_price, item_limit?}]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items must be a non-empty array', data: null });
    }
    const sale = await FlashSale.addProducts(parseInt(id), items);
    res.json({ message: 'Cập nhật sản phẩm flash sale thành công', data: sale });
  } catch (error) {
    console.error('Add flash sale items error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

// List flash sales
router.get('/flash-sales', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query
    const list = await FlashSale.findAll({ page: Number(page), limit: Number(limit), search: String(search), status: String(status) })
    const total = await FlashSale.getCount({ search: String(search), status: String(status) })
    res.json({
      message: 'Danh sách flash sale',
      data: {
        flash_sales: list,
        pagination: { page: Number(page), limit: Number(limit), total, page_size: Math.ceil(total / Number(limit)) }
      }
    })
  } catch (error) {
    console.error('List flash sales error:', error)
    res.status(500).json({ message: 'Lỗi server', data: null })
  }
})

// Get flash sale detail with items
router.get('/flash-sales/:id', requireAdmin, async (req, res) => {
  try {
    const sale = await FlashSale.findByIdWithItems(Number(req.params.id))
    if (!sale) return res.status(404).json({ message: 'Flash sale không tồn tại', data: null })
    res.json({ message: 'Chi tiết flash sale', data: sale })
  } catch (error) {
    console.error('Get flash sale error:', error)
    res.status(500).json({ message: 'Lỗi server', data: null })
  }
})
module.exports = router;
