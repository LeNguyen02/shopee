const express = require('express');
const { pool } = require('../config/database');
const FlashSale = require('../models/FlashSale');

const router = express.Router();



// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      image,
      images,
      price,
      price_before_discount,
      quantity = 0
    } = req.body;

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

    // Check if category exists
    if (category_id) {
      const [categoryRows] = await pool.query(
        `SELECT id FROM categories WHERE id = ${category_id}`
      );
      if (categoryRows.length === 0) {
        return res.status(400).json({
          message: 'Danh mục không tồn tại',
          data: null
        });
      }
    }

    // Insert product
    const [result] = await pool.query(
      `INSERT INTO products (name, description, category_id, image, images, price, price_before_discount, quantity, sold, view, rating)
       VALUES ('${name}', '${description || ''}', ${category_id || 'NULL'}, '${image || ''}', '${images ? JSON.stringify(images) : ''}', ${price}, ${price_before_discount || 'NULL'}, ${quantity}, 0, 0, 0)`
    );

    // Get the created product
    const [productRows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ${result.insertId}`
    );

    const product = productRows[0];
    product.images = product.images ? JSON.parse(product.images) : [];

    res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get all products with pagination and filters
router.get('/', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    // Extract query parameters
    const filters = {
      page,
      limit,
      order: req.query.order,
      sort_by: req.query.sort_by,
      category: req.query.category,
      exclude: req.query.exclude,
      rating_filter: req.query.rating_filter,
      price_max: req.query.price_max,
      price_min: req.query.price_min,
      name: req.query.name
    };

    // Get products using the Product model (which handles search filtering)
    const products = await Product.findAll(filters);
    
    // Get total count with the same filters
    const total = await Product.getCount(filters);
    

    res.json({
      message: 'Lấy các sản phẩm thành công',
      data: {
        products: products,
        pagination: {
          page: page,
          limit: limit,
          page_size: Math.ceil(total / limit)
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

// Public: get active flash sale with products
router.get('/flash-sale/active', async (req, res) => {
  try {
    const sale = await FlashSale.getActiveNow();
    res.json({ message: 'Lấy flash sale hiện tại', data: sale });
  } catch (error) {
    console.error('Get active flash sale error:', error);
    res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `);

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
        data: null
      });
    }

    const product = products[0];
    product.images = Array.isArray(product.images)
    ? product.images
    : product.images
      ? JSON.parse(product.images)
      : [];

    // Increment view count
    await pool.query(`UPDATE products SET view = view + 1 WHERE id = ${id}`);

    res.json({
      message: 'Lấy sản phẩm thành công',
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

// Check product availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.query;

    const [products] = await pool.query(
      'SELECT id, name, quantity FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại',
        data: { available: false, availableQuantity: 0 }
      });
    }

    const product = products[0];
    const available = product.quantity >= parseInt(quantity);
    const availableQuantity = Math.max(0, product.quantity);

    res.json({
      message: 'Kiểm tra tồn kho thành công',
      data: {
        available,
        availableQuantity,
        requestedQuantity: parseInt(quantity),
        productName: product.name
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

module.exports = router;
