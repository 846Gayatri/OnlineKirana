const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { calculatePrice, validateQuantity, formatQuantity } = require('../engine/pricing');

/**
 * GET /api/cart
 * Get current user's cart with calculated prices
 */
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    
    const items = db.prepare(`
      SELECT ci.*, p.name, p.name_local, p.price_per_kg, p.unit_type, 
             p.min_qty_grams, p.max_qty_grams, p.qty_step_grams, 
             p.in_stock, p.image_url, c.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).all(req.user.id);

    let subtotal = 0;
    const enriched = items.map(item => {
      const itemPrice = calculatePrice(item.quantity_grams, item.price_per_kg, item.unit_type);
      subtotal += itemPrice;
      
      return {
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        name_local: item.name_local,
        image_url: item.image_url,
        category_name: item.category_name,
        quantity_grams: item.quantity_grams,
        quantity_label: formatQuantity(item.quantity_grams, item.unit_type),
        price_per_kg: item.price_per_kg,
        unit_type: item.unit_type,
        item_total: itemPrice,
        in_stock: !!item.in_stock,
        min_qty_grams: item.min_qty_grams,
        max_qty_grams: item.max_qty_grams,
        qty_step_grams: item.qty_step_grams
      };
    });

    const deliveryFee = subtotal >= 500 ? 0 : 30; // Free delivery above ₹500
    
    res.json({
      items: enriched,
      summary: {
        item_count: enriched.length,
        subtotal,
        delivery_fee: deliveryFee,
        total: subtotal + deliveryFee,
        free_delivery_threshold: 500
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cart/items
 * Add item to cart (or update quantity if already exists)
 */
router.post('/items', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { product_id, quantity_grams } = req.body;

    if (!product_id || !quantity_grams) {
      return res.status(400).json({ error: 'product_id and quantity_grams are required' });
    }

    // Validate product exists and is in stock
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND in_stock = 1').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found or out of stock' });
    }

    // Validate quantity
    const validation = validateQuantity(quantity_grams, product);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    // Upsert cart item
    db.prepare(`
      INSERT INTO cart_items (user_id, product_id, quantity_grams)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, product_id) 
      DO UPDATE SET quantity_grams = ?, updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, product_id, quantity_grams, quantity_grams);

    res.json({ message: 'Cart updated' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/cart/items/:id
 * Update cart item quantity
 */
router.put('/items/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { quantity_grams } = req.body;

    const item = db.prepare(`
      SELECT ci.*, p.min_qty_grams, p.max_qty_grams, p.qty_step_grams, p.unit_type
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND ci.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const validation = validateQuantity(quantity_grams, item);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    db.prepare(`
      UPDATE cart_items SET quantity_grams = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(quantity_grams, req.params.id, req.user.id);

    res.json({ message: 'Quantity updated' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cart/items/:id
 * Remove item from cart
 */
router.delete('/items/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
