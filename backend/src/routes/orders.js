const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { calculatePrice, validateQuantity } = require('../engine/pricing');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/orders
 * Customer: Create order from cart
 */
router.post('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { address_id, payment_method = 'cod', delivery_slot, notes } = req.body;

    // Get cart items
    const cartItems = db.prepare(`
      SELECT ci.*, p.name, p.price_per_kg, p.unit_type,
             p.min_qty_grams, p.max_qty_grams, p.qty_step_grams, p.in_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(req.user.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate all items are still in stock
    const outOfStock = cartItems.filter(item => !item.in_stock);
    if (outOfStock.length > 0) {
      return res.status(400).json({ 
        error: 'Some items are out of stock',
        items: outOfStock.map(i => i.name)
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cartItems.map(item => {
      const validation = validateQuantity(item.quantity_grams, item);
      if (!validation.valid) {
        throw Object.assign(new Error(`Invalid quantity for ${item.name}: ${validation.reason}`), { status: 400 });
      }
      
      const itemTotal = calculatePrice(item.quantity_grams, item.price_per_kg, item.unit_type);
      subtotal += itemTotal;
      
      return {
        product_id: item.product_id,
        product_name: item.name,
        quantity_grams: item.quantity_grams,
        unit_type: item.unit_type,
        price_per_kg_snapshot: item.price_per_kg,
        item_total: itemTotal
      };
    });

    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const total = subtotal + deliveryFee;
    const orderNumber = 'GF-' + uuidv4().split('-')[0].toUpperCase();

    // Create order in a transaction
    let orderId;
    try {
      db.exec('BEGIN IMMEDIATE');
      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, user_id, address_id, status, subtotal, delivery_fee, total,
          payment_method, delivery_slot, notes)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
      `).run(
        orderNumber, req.user.id, address_id || null,
        subtotal, deliveryFee, total,
        payment_method, delivery_slot || null, notes || null
      );

      orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity_grams, unit_type, 
          price_per_kg_snapshot, item_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of orderItems) {
        insertItem.run(
          orderId, item.product_id, item.product_name,
          item.quantity_grams, item.unit_type,
          item.price_per_kg_snapshot, item.item_total
        );
      }

      // Clear cart
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      
      db.exec('COMMIT');
    } catch (txnErr) {
      db.exec('ROLLBACK');
      throw txnErr;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/my
 * Customer: Get my orders
 */
router.get('/my', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'user_id = ?';
    let params = [req.user.id];

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const orders = db.prepare(`
      SELECT * FROM orders WHERE ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    // Attach items to each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map(order => ({
      ...order,
      items: getItems.all(order.id)
    }));

    res.json({ orders: enriched });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders
 * Admin: Get all orders
 */
router.get('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    let params = [];

    if (status) {
      where += ' AND o.status = ?';
      params.push(status);
    }

    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM orders o WHERE ${where}
    `).get(...params).count;

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map(order => ({
      ...order,
      items: getItems.all(order.id)
    }));

    res.json({
      orders: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:id
 * Get single order (customer sees own, admin sees any)
 */
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    
    let order;
    if (req.user.role === 'admin') {
      order = db.prepare(`
        SELECT o.*, u.name as customer_name, u.phone as customer_phone
        FROM orders o JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `).get(req.params.id);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user.id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    // Get address if exists
    if (order.address_id) {
      order.address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(order.address_id);
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/status
 * Admin: Update order status
 */
router.patch('/:id/status', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/stats/dashboard
 * Admin: Dashboard stats
 */
router.get('/stats/dashboard', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    
    const today = new Date().toISOString().split('T')[0];
    
    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
      FROM orders WHERE DATE(created_at) = ?
    `).get(today);

    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders
    `).get();

    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed')
    `).get();

    const activeProducts = db.prepare(`
      SELECT COUNT(*) as count FROM products WHERE in_stock = 1
    `).get();

    const lowStockProducts = db.prepare(`
      SELECT COUNT(*) as count FROM products WHERE in_stock = 0
    `).get();

    const recentOrders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 5
    `).all();

    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `).all();

    res.json({
      today: { orders: todayOrders.count, revenue: todayOrders.revenue },
      total: { orders: totalOrders.count, revenue: totalOrders.revenue },
      pending_orders: pendingOrders.count,
      active_products: activeProducts.count,
      out_of_stock: lowStockProducts.count,
      recent_orders: recentOrders,
      status_breakdown: statusBreakdown
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
