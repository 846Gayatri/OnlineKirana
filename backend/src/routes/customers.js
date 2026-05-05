const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * GET /api/customers
 * Admin: List all customers with order stats
 */
router.get('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = "u.role = 'customer'";
    let params = [];

    if (search) {
      where += ' AND (u.name LIKE ? OR u.phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }

    const customers = db.prepare(`
      SELECT
        u.id, u.name, u.phone, u.is_active, u.rewards_points, u.created_at,
        COUNT(o.id)             AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spend,
        MAX(o.created_at)       AS last_order_at
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE ${where}
      GROUP BY u.id
      ORDER BY last_order_at DESC NULLS LAST, u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM users u WHERE ${where}
    `).get(...params).count;

    res.json({ customers, total });
  } catch (err) { next(err); }
});

/**
 * GET /api/customers/:id
 * Admin: Single customer detail with order history
 */
router.get('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const customer = db.prepare(`
      SELECT u.id, u.name, u.phone, u.is_active, u.rewards_points, u.created_at,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spend,
        MAX(o.created_at) AS last_order_at
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.id = ? AND u.role = 'customer'
      GROUP BY u.id
    `).get(req.params.id);

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const orders = db.prepare(`
      SELECT id, order_number, status, subtotal, delivery_fee, total, payment_method, created_at
      FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(req.params.id);

    res.json({ customer, orders });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/customers/:id/points
 * Admin: Adjust rewards points (set absolute or add/subtract delta)
 */
router.patch('/:id/points', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { delta, set_to, reason } = req.body;

    const user = db.prepare("SELECT id, rewards_points FROM users WHERE id = ? AND role = 'customer'").get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Customer not found' });

    let newPoints;
    if (set_to !== undefined) {
      newPoints = Math.max(0, parseInt(set_to));
    } else if (delta !== undefined) {
      newPoints = Math.max(0, user.rewards_points + parseInt(delta));
    } else {
      return res.status(400).json({ error: 'Provide delta or set_to' });
    }

    db.prepare('UPDATE users SET rewards_points = ? WHERE id = ?').run(newPoints, req.params.id);

    res.json({
      id: user.id,
      old_points: user.rewards_points,
      new_points: newPoints,
      change: newPoints - user.rewards_points,
      reason: reason || null
    });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/customers/:id/status
 * Admin: Toggle customer active status
 */
router.patch('/:id/status', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { is_active } = req.body;
    const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Customer not found' });
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
