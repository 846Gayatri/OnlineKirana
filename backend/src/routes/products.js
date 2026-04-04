const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { calculatePrice, formatQuantity } = require('../engine/pricing');

/**
 * GET /api/products
 * Public: List all products (with optional filters)
 */
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { category_id, search, in_stock, page = 1, limit = 50 } = req.query;
    
    let where = ['1=1'];
    let params = [];
    
    if (category_id) {
      where.push('p.category_id = ?');
      params.push(category_id);
    }
    
    if (in_stock !== undefined) {
      where.push('p.in_stock = ?');
      params.push(in_stock === 'true' ? 1 : 0);
    }
    
    if (search) {
      where.push('(p.name LIKE ? OR p.name_local LIKE ? OR p.description LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.sort_order ASC, p.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM products p WHERE ${where.join(' AND ')}
    `).get(...params).count;

    // Enrich with calculated prices for default quantities
    const enriched = products.map(p => ({
      ...p,
      in_stock: !!p.in_stock,
      default_price: calculatePrice(p.min_qty_grams, p.price_per_kg, p.unit_type),
      default_qty_label: formatQuantity(p.min_qty_grams, p.unit_type)
    }));

    res.json({
      products: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id
 * Public: Get single product with price table
 */
router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate price table for common quantities
    const priceTable = [];
    if (product.unit_type === 'grams') {
      for (const grams of [100, 250, 500, 750, 1000, 2000, 5000]) {
        if (grams >= product.min_qty_grams && grams <= (product.max_qty_grams || 10000)) {
          priceTable.push({
            quantity: grams,
            label: formatQuantity(grams, 'grams'),
            price: calculatePrice(grams, product.price_per_kg, 'grams')
          });
        }
      }
    } else if (product.unit_type === 'pieces') {
      for (const pcs of [1, 2, 3, 5, 10, 12]) {
        if (pcs >= product.min_qty_grams && pcs <= (product.max_qty_grams || 100)) {
          priceTable.push({
            quantity: pcs,
            label: formatQuantity(pcs, 'pieces'),
            price: calculatePrice(pcs, product.price_per_kg, 'pieces')
          });
        }
      }
    }

    res.json({
      product: {
        ...product,
        in_stock: !!product.in_stock,
        price_table: priceTable
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 * Admin: Create a new product
 */
router.post('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const {
      name, name_local, description, category_id,
      price_per_kg, min_qty_grams = 100, max_qty_grams = 10000,
      qty_step_grams = 50, unit_type = 'grams', image_url, tags, sort_order = 0
    } = req.body;

    if (!name || !price_per_kg) {
      return res.status(400).json({ error: 'Name and price_per_kg are required' });
    }

    const result = db.prepare(`
      INSERT INTO products (name, name_local, description, category_id, price_per_kg, 
        min_qty_grams, max_qty_grams, qty_step_grams, unit_type, image_url, tags, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, name_local || null, description || null, category_id || null,
      price_per_kg, min_qty_grams, max_qty_grams, qty_step_grams,
      unit_type, image_url || null, tags || null, sort_order
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/products/:id
 * Admin: Update a product
 */
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name, name_local, description, category_id,
      price_per_kg, min_qty_grams, max_qty_grams,
      qty_step_grams, unit_type, in_stock, image_url, tags, sort_order
    } = req.body;

    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        name_local = COALESCE(?, name_local),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        price_per_kg = COALESCE(?, price_per_kg),
        min_qty_grams = COALESCE(?, min_qty_grams),
        max_qty_grams = COALESCE(?, max_qty_grams),
        qty_step_grams = COALESCE(?, qty_step_grams),
        unit_type = COALESCE(?, unit_type),
        in_stock = COALESCE(?, in_stock),
        image_url = COALESCE(?, image_url),
        tags = COALESCE(?, tags),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null, name_local !== undefined ? name_local : null, 
      description !== undefined ? description : null,
      category_id !== undefined ? category_id : null,
      price_per_kg || null, min_qty_grams || null, max_qty_grams || null,
      qty_step_grams || null, unit_type || null,
      in_stock !== undefined ? (in_stock ? 1 : 0) : null,
      image_url !== undefined ? image_url : null,
      tags !== undefined ? tags : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/products/:id
 * Admin: Delete a product
 */
router.delete('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products/:id/calculate
 * Public: Calculate price for a specific quantity
 */
router.post('/:id/calculate', (req, res, next) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { quantity } = req.body;
    const { validateQuantity } = require('../engine/pricing');
    
    const validation = validateQuantity(quantity, product);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const price = calculatePrice(quantity, product.price_per_kg, product.unit_type);
    
    res.json({
      product_id: product.id,
      quantity,
      quantity_label: formatQuantity(quantity, product.unit_type),
      price_per_kg: product.price_per_kg,
      calculated_price: price
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
