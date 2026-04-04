const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * GET /api/categories
 * Public: List all active categories
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { include_inactive } = req.query;
    
    let query = 'SELECT * FROM categories';
    if (!include_inactive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const categories = db.prepare(query).all();
    
    // Get product counts per category
    const counts = db.prepare(`
      SELECT category_id, COUNT(*) as product_count 
      FROM products WHERE in_stock = 1 
      GROUP BY category_id
    `).all();
    
    const countMap = {};
    counts.forEach(c => { countMap[c.category_id] = c.product_count; });
    
    const enriched = categories.map(c => ({
      ...c,
      is_active: !!c.is_active,
      product_count: countMap[c.id] || 0
    }));

    res.json({ categories: enriched });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/categories
 * Admin: Create a category
 */
router.post('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { name, name_local, icon = '📦', sort_order = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = db.prepare(`
      INSERT INTO categories (name, name_local, icon, sort_order) VALUES (?, ?, ?, ?)
    `).run(name, name_local || null, icon, sort_order);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/categories/:id
 * Admin: Update a category
 */
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const { name, name_local, icon, sort_order, is_active } = req.body;

    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        name_local = COALESCE(?, name_local),
        icon = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      name || null, name_local !== undefined ? name_local : null,
      icon || null, sort_order !== undefined ? sort_order : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      req.params.id
    );

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/categories/:id
 * Admin: Delete a category
 */
router.delete('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
