const express = require('express');
const { pool } = require('../config/database');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json({
      message: 'Lấy categories thành công',
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get single category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy category',
        data: null
      });
    }

    res.json({
      message: 'Lấy category thành công',
      data: categories[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Create new category (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        message: 'Tên category không được để trống',
        data: null
      });
    }

    // Check if category already exists
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE name = ?',
      [name.trim()]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({
        message: 'Category đã tồn tại',
        data: null
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (name, image) VALUES (?, ?)',
      [name.trim(), image || null]
    );

    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Tạo category thành công',
      data: newCategory[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Update category (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        message: 'Tên category không được để trống',
        data: null
      });
    }

    // Check if category exists
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy category',
        data: null
      });
    }

    // Check if name already exists (excluding current category)
    const [duplicateCategories] = await pool.execute(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name.trim(), id]
    );

    if (duplicateCategories.length > 0) {
      return res.status(400).json({
        message: 'Tên category đã tồn tại',
        data: null
      });
    }

    await pool.execute(
      'UPDATE categories SET name = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), image || null, id]
    );

    const [updatedCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Cập nhật category thành công',
      data: updatedCategory[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy category',
        data: null
      });
    }

    // Check if category has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({
        message: 'Không thể xóa category có sản phẩm',
        data: null
      });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      message: 'Xóa category thành công',
      data: null
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

module.exports = router;
