const express = require('express');
const { pool } = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { items, delivery_address, message, payment_method, total_amount } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Danh sách sản phẩm không được để trống',
        data: null
      });
    }

    if (!delivery_address || !delivery_address.fullName || !delivery_address.phone || !delivery_address.address) {
      return res.status(400).json({
        message: 'Thông tin giao hàng không đầy đủ',
        data: null
      });
    }

    if (!payment_method || !['cod', 'stripe', 'momo'].includes(payment_method)) {
      return res.status(400).json({
        message: 'Phương thức thanh toán không hợp lệ',
        data: null
      });
    }

    // Validate all products exist first
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT * FROM products WHERE id = ?',
        [item.product_id]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          message: `Sản phẩm với ID ${item.product_id} không tồn tại`,
          data: null
        });
      }
    }

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, delivery_address, message, payment_method, payment_status, order_status, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        JSON.stringify(delivery_address),
        message || null,
        payment_method,
        payment_method === 'cod' ? 'pending' : 'pending',
        'pending',
        total_amount
      ]
    );

    const orderId = orderResult.insertId;

    // Create order items and update product quantities atomically
    for (const item of items) {
      // Insert order item
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, price_before_discount, quantity) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.product_image,
          item.price,
          item.price_before_discount,
          item.quantity
        ]
      );

      // Atomically update product quantity with availability check
      const [updateResult] = await connection.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
        [item.quantity, item.product_id, item.quantity]
      );

      // Check if the update was successful (affected rows > 0)
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({
          message: `Sản phẩm ${item.product_name} không đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.`,
          data: null
        });
      }
    }

    // Clear cart items for purchased products
    const productIds = items.map(item => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    await connection.query(
      `DELETE FROM cart_items WHERE cart_id IN (
        SELECT id FROM carts WHERE user_id = ?
      ) AND product_id IN (${placeholders})`,
      [userId, ...productIds]
    );

    await connection.commit();

    // Get the created order with items
    const [orderRows] = await connection.query(`
      SELECT 
        o.*,
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
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    const order = orderRows[0];
    // Handle delivery_address - check if it's already an object or needs parsing
    if (typeof order.delivery_address === 'string') {
      order.delivery_address = JSON.parse(order.delivery_address);
    }
    // Handle items - check if it's already an object or needs parsing
    if (typeof order.items === 'string') {
      order.items = JSON.parse(order.items);
    }

    // For Stripe payments, create real payment intent
    let stripePaymentIntent = null;
    if (payment_method === 'stripe') {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total_amount), // VND is zero-decimal currency, no conversion needed
          currency: 'vnd', // Vietnamese Dong
          metadata: {
            order_id: orderId.toString(),
            user_id: userId.toString()
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        stripePaymentIntent = {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id
        };
      } catch (stripeError) {
        console.error('Stripe payment intent creation error:', stripeError);
        await connection.rollback();
        return res.status(500).json({
          message: 'Lỗi tạo thanh toán Stripe',
          data: null
        });
      }
    }

    res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      data: {
        order,
        stripe_payment_intent: stripePaymentIntent
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  } finally {
    connection.release();
  }
});

// Get user's orders
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [orderRows] = await pool.query(`
      SELECT 
        o.*,
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
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    const orders = orderRows.map(order => {
      // Handle delivery_address - check if it's already an object or needs parsing
      if (typeof order.delivery_address === 'string') {
        order.delivery_address = JSON.parse(order.delivery_address);
      }
      // Handle items - check if it's already an object or needs parsing
      if (typeof order.items === 'string') {
        order.items = JSON.parse(order.items);
      }
      return { order };
    });

    res.json({
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Get order by ID
// Public: get MoMo settings (must be before any parameterized '/:id' route)
router.get('/momo-settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_value FROM shop_settings WHERE setting_key = ? LIMIT 1', ['momo']);
    const settings = rows[0]?.setting_value || {};
    return res.json({ message: 'MoMo settings', data: { settings } });
  } catch (error) {
    console.error('Get MoMo settings error:', error);
    return res.status(500).json({ message: 'Lỗi server', data: null });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const [orderRows] = await pool.query(`
      SELECT 
        o.*,
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
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ? AND o.user_id = ?
      GROUP BY o.id
    `, [orderId, userId]);

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

    res.json({
      message: 'Lấy đơn hàng thành công',
      data: { order }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Confirm Stripe payment
router.post('/:id/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        message: 'Payment intent ID là bắt buộc',
        data: null
      });
    }

    // Check if order exists and belongs to user
    const [orderRows] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        message: 'Đơn hàng không tồn tại',
        data: null
      });
    }

    const order = orderRows[0];

    if (order.payment_method !== 'stripe') {
      return res.status(400).json({
        message: 'Đơn hàng này không sử dụng thanh toán Stripe',
        data: null
      });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({
        message: 'Đơn hàng đã được thanh toán',
        data: null
      });
    }

    // Verify the payment with Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          message: 'Thanh toán chưa được xác nhận bởi Stripe',
          data: null
        });
      }

      // Verify the amount matches (VND is zero-decimal currency)
      if (paymentIntent.amount !== Math.round(order.total_amount)) {
        return res.status(400).json({
          message: 'Số tiền thanh toán không khớp',
          data: null
        });
      }

      // Update payment status only after successful verification
      await pool.query(
        'UPDATE orders SET payment_status = ?, order_status = ?, updated_at = NOW() WHERE id = ?',
        ['paid', 'confirmed', orderId]
      );
    } catch (stripeError) {
      console.error('Stripe payment verification error:', stripeError);
      return res.status(500).json({
        message: 'Lỗi xác minh thanh toán Stripe',
        data: null
      });
    }

    // Get updated order
    const [updatedOrderRows] = await pool.query(`
      SELECT 
        o.*,
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
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    const updatedOrder = updatedOrderRows[0];
    // Handle delivery_address - check if it's already an object or needs parsing
    if (typeof updatedOrder.delivery_address === 'string') {
      updatedOrder.delivery_address = JSON.parse(updatedOrder.delivery_address);
    }
    // Handle items - check if it's already an object or needs parsing
    if (typeof updatedOrder.items === 'string') {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    }

    res.json({
      message: 'Xác nhận thanh toán thành công',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const orderId = req.params.id;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const [orderRows] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        message: 'Đơn hàng không tồn tại',
        data: null
      });
    }

    const order = orderRows[0];

    if (order.order_status !== 'pending') {
      return res.status(400).json({
        message: 'Chỉ có thể hủy đơn hàng đang chờ xử lý',
        data: null
      });
    }

    // Get order items to restore product quantities
    const [orderItems] = await connection.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    // Restore product quantities
    for (const item of orderItems) {
      await connection.query(
        'UPDATE products SET quantity = quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await connection.query(
      'UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', orderId]
    );

    await connection.commit();

    // Get updated order
    const [updatedOrderRows] = await connection.query(`
      SELECT 
        o.*,
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
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    const updatedOrder = updatedOrderRows[0];
    // Handle delivery_address - check if it's already an object or needs parsing
    if (typeof updatedOrder.delivery_address === 'string') {
      updatedOrder.delivery_address = JSON.parse(updatedOrder.delivery_address);
    }
    // Handle items - check if it's already an object or needs parsing
    if (typeof updatedOrder.items === 'string') {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    }

    res.json({
      message: 'Hủy đơn hàng thành công',
      data: { order: updatedOrder }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      message: 'Lỗi server',
      data: null
    });
  } finally {
    connection.release();
  }
});

 

// User confirms MoMo transfer
router.post('/:id/momo-confirm', authenticateToken, async (req, res) => {
	try {
		const orderId = req.params.id;
		const userId = req.user.id;
		const { transfer_note } = req.body;

		const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
		if (orderRows.length === 0) {
			return res.status(404).json({ message: 'Đơn hàng không tồn tại', data: null });
		}
		const order = orderRows[0];
		if (order.payment_method !== 'momo') {
			return res.status(400).json({ message: 'Đơn hàng này không sử dụng thanh toán MoMo', data: null });
		}

		await pool.query(
			'UPDATE orders SET momo_transfer_note = ?, user_payment_confirmed = 1, user_payment_confirmed_at = NOW(), updated_at = NOW() WHERE id = ?',
			[transfer_note || null, orderId]
		);

		const [updatedOrderRows] = await pool.query(`
			SELECT 
				o.*,
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
			LEFT JOIN order_items oi ON o.id = oi.order_id
			WHERE o.id = ?
			GROUP BY o.id
		`, [orderId]);

		const updatedOrder = updatedOrderRows[0];
		if (typeof updatedOrder.delivery_address === 'string') {
			updatedOrder.delivery_address = JSON.parse(updatedOrder.delivery_address);
		}
		if (typeof updatedOrder.items === 'string') {
			updatedOrder.items = JSON.parse(updatedOrder.items);
		}

		return res.json({ message: 'Đã ghi nhận xác nhận thanh toán MoMo', data: { order: updatedOrder } });
	} catch (error) {
		console.error('MoMo confirm error:', error);
		return res.status(500).json({ message: 'Lỗi server', data: null });
	}
});

module.exports = router;
