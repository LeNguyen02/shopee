const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's cart with items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create cart for user
    let [carts] = await pool.query(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    let cart;
    if (carts.length === 0) {
      // Create new cart
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [userId]
      );
      cart = { id: result.insertId, user_id: userId };
    } else {
      cart = carts[0];
    }

    // Get cart items with product details
    const [cartItems] = await pool.query(`
      SELECT 
        ci.id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.image as product_image,
        p.price,
        p.price_before_discount,
        p.quantity as product_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `, [cart.id]);

    res.json({
      message: 'Lấy giỏ hàng thành công',
      data: {
        cart: {
          id: cart.id,
          user_id: cart.user_id,
          created_at: cart.created_at,
          updated_at: cart.updated_at
        },
        items: cartItems
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        message: 'Product ID là bắt buộc',
        data: null
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: 'Số lượng phải lớn hơn 0',
        data: null
      });
    }

    // Check if product exists
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại',
        data: null
      });
    }

    const product = products[0];

    // Check if product has enough quantity
    if (product.quantity < quantity) {
      return res.status(400).json({
        message: `Sản phẩm ${product.name} chỉ còn ${product.quantity} sản phẩm`,
        data: { availableQuantity: product.quantity }
      });
    }

    // Get or create cart for user
    let [carts] = await pool.query(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    let cart;
    if (carts.length === 0) {
      // Create new cart
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [userId]
      );
      cart = { id: result.insertId, user_id: userId };
    } else {
      cart = carts[0];
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cart.id, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      // Check if new quantity exceeds product stock
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${product.name} chỉ còn ${product.quantity} sản phẩm`,
          data: { availableQuantity: product.quantity }
        });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );

      res.json({
        message: 'Cập nhật giỏ hàng thành công',
        data: {
          cart_item_id: existingItems[0].id,
          quantity: newQuantity
        }
      });
    } else {
      // Add new item to cart
      const [result] = await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cart.id, product_id, quantity]
      );

      res.json({
        message: 'Thêm vào giỏ hàng thành công',
        data: {
          cart_item_id: result.insertId,
          quantity: quantity
        }
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Update cart item quantity
router.put('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Số lượng phải lớn hơn 0',
        data: null
      });
    }

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.query(`
      SELECT ci.*, p.quantity as product_quantity
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [itemId, userId]);

    if (cartItems.length === 0) {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại trong giỏ hàng',
        data: null
      });
    }

    const cartItem = cartItems[0];

    // Check if quantity exceeds product stock
    if (quantity > cartItem.product_quantity) {
      return res.status(400).json({
        message: `Sản phẩm chỉ còn ${cartItem.product_quantity} sản phẩm`,
        data: { availableQuantity: cartItem.product_quantity }
      });
    }

    // Update quantity
    await pool.query(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, itemId]
    );

    res.json({
      message: 'Cập nhật số lượng thành công',
      data: {
        cart_item_id: itemId,
        quantity: quantity
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Remove item from cart
router.delete('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.query(`
      SELECT ci.*
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [itemId, userId]);

    if (cartItems.length === 0) {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại trong giỏ hàng',
        data: null
      });
    }

    // Delete cart item
    await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    res.json({
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
      data: null
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's cart
    const [carts] = await pool.query(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.json({
        message: 'Giỏ hàng đã trống',
        data: null
      });
    }

    const cart = carts[0];

    // Delete all cart items
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);

    res.json({
      message: 'Xóa tất cả sản phẩm khỏi giỏ hàng thành công',
      data: null
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get cart count (for header badge)
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's cart
    const [carts] = await pool.query(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.json({
        message: 'Lấy số lượng giỏ hàng thành công',
        data: { count: 0 }
      });
    }

    const cart = carts[0];

    // Count total items in cart
    const [countResult] = await pool.query(
      'SELECT SUM(quantity) as total FROM cart_items WHERE cart_id = ?',
      [cart.id]
    );

    const count = countResult[0].total || 0;

    res.json({
      message: 'Lấy số lượng giỏ hàng thành công',
      data: { count: count }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

module.exports = router;
