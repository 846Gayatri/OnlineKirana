const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads/reviews');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `review_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files allowed'));
    cb(null, true);
  }
});

router.get('/product/:productId', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.phone as reviewer_phone
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.productId);

    const avg = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avg_rating: Math.round(avg * 10) / 10, total: reviews.length });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, upload.single('photo'), (req, res, next) => {
  try {
    const db = getDb();
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'product_id and rating are required' });
    }
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/reviews/${req.file.filename}`;
    }

    db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, comment, photo_url)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(product_id, user_id)
      DO UPDATE SET rating = ?, comment = ?, photo_url = COALESCE(?, photo_url), created_at = CURRENT_TIMESTAMP
    `).run(product_id, req.user.id, ratingNum, comment || null, photoUrl, ratingNum, comment || null, photoUrl);

    const review = db.prepare(`
      SELECT r.*, u.name as reviewer_name FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.user_id = ?
    `).get(product_id, req.user.id);

    res.status(201).json({ review });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
