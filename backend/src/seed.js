/**
 * GramFresh Seed Data
 * Populates the database with sample categories, products, and an admin user
 */
require('dotenv').config();
const { initDatabase, getDb } = require('./config/database');
const bcrypt = require('bcryptjs');

function seed() {
  console.log('🌱 Seeding GramFresh database...\n');
  
  initDatabase();
  const db = getDb();

  // ============================================
  // ADMIN USER (phone: 9999999999, password: admin123)
  // ============================================
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (phone, name, role, password_hash)
    VALUES ('9999999999', 'Store Admin', 'admin', ?)
  `).run(adminPassword);
  console.log('👤 Admin user created: phone=9999999999 password=admin123');

  // Sample customer
  db.prepare(`
    INSERT OR IGNORE INTO users (phone, name, role)
    VALUES ('9876543210', 'Rahul Kumar', 'customer')
  `).run();
  console.log('👤 Sample customer created: phone=9876543210');

  // ============================================
  // CATEGORIES
  // ============================================
  const categories = [
    { name: 'Rice & Grains', name_local: 'బియ్యం & పప్పులు', icon: '🌾', sort_order: 1 },
    { name: 'Pulses & Dals', name_local: 'పప్పులు', icon: '🫘', sort_order: 2 },
    { name: 'Spices & Masalas', name_local: 'మసాలాలు', icon: '🌶️', sort_order: 3 },
    { name: 'Oils & Ghee', name_local: 'నూనె & నెయ్యి', icon: '🫙', sort_order: 4 },
    { name: 'Flours & Ravva', name_local: 'పిండి & రవ్వ', icon: '🌿', sort_order: 5 },
    { name: 'Sugar & Bellam', name_local: 'చక్కెర & బెల్లం', icon: '🍬', sort_order: 6 },
    { name: 'Tea & Coffee', name_local: 'టీ & కాఫీ', icon: '☕', sort_order: 7 },
    { name: 'Dry Fruits', name_local: 'ఎండు ఫలాలు', icon: '🥜', sort_order: 8 },
    { name: 'Snacks', name_local: 'స్నాక్స్', icon: '🍿', sort_order: 9 },
    { name: 'Sachets & Mini', name_local: 'సాచెట్స్', icon: '🧴', sort_order: 10 },
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, name_local, icon, sort_order) VALUES (?, ?, ?, ?)
  `);

  for (const cat of categories) {
    insertCategory.run(cat.name, cat.name_local, cat.icon, cat.sort_order);
  }
  console.log(`📂 ${categories.length} categories created`);

  // ============================================
  // PRODUCTS (realistic Indian grocery prices in ₹/kg)
  // ============================================
  const products = [
    // Grains & Rice
    { name: 'Kurnool Sona Masoori Rice (BPT)', name_local: 'సోనా మసూరి బియ్యం', category: 'Rice & Grains', price_per_kg: 68, min_qty: 1000, step: 500 },
    { name: 'Basmati Rice (Premium)', name_local: 'బాస్మతి బియ్యం', category: 'Rice & Grains', price_per_kg: 140, min_qty: 500, step: 250 },
    { name: 'Idli Ravva', name_local: 'ఇడ్లీ రవ్వ', category: 'Flours & Ravva', price_per_kg: 48, min_qty: 500, step: 250 },
    { name: 'Upma Ravva (Bombay Ravva)', name_local: 'ఉప్మా రవ్వ', category: 'Flours & Ravva', price_per_kg: 55, min_qty: 250, step: 250 },

    // Pulses & Lentils
    { name: 'Toor Dal (Kandi Pappu)', name_local: 'కంది పప్పు', category: 'Pulses & Dals', price_per_kg: 165, min_qty: 250, step: 250 },
    { name: 'Urad Dal (Minapappu)', name_local: 'మినపప్పు', category: 'Pulses & Dals', price_per_kg: 140, min_qty: 250, step: 250 },
    { name: 'Moong Dal (Pesara Pappu)', name_local: 'పెసర పప్పు', category: 'Pulses & Dals', price_per_kg: 125, min_qty: 250, step: 250 },
    { name: 'Chana Dal (Senaga Pappu)', name_local: 'శెనగ పప్పు', category: 'Pulses & Dals', price_per_kg: 95, min_qty: 250, step: 250 },

    // Spices
    { name: 'Guntur Red Chilli (Sannam)', name_local: 'గుంటూరు ఎండుమిర్చి', category: 'Spices & Masalas', price_per_kg: 350, min_qty: 100, step: 50 },
    { name: 'Turmeric Powder (Pasupu)', name_local: 'పసుపు', category: 'Spices & Masalas', price_per_kg: 220, min_qty: 50, step: 50 },
    { name: 'Tamarind (Chintapandu)', name_local: 'చింతపండు', category: 'Spices & Masalas', price_per_kg: 180, min_qty: 100, step: 50 },
    { name: 'Mustard Seeds (Avalu)', name_local: 'ఆవాలు', category: 'Spices & Masalas', price_per_kg: 140, min_qty: 50, step: 50 },
    { name: 'Cumin Seeds (Jeelakarra)', name_local: 'జీలకర్ర', category: 'Spices & Masalas', price_per_kg: 500, min_qty: 50, step: 50 },

    // Oils & Ghee
    { name: 'Groundnut Oil (Palli Nune)', name_local: 'పల్లి నూనె', category: 'Oils & Ghee', price_per_kg: 190, min_qty: 500, step: 500, unit_type: 'liters' },
    { name: 'Sunflower Oil', name_local: 'పొద్దుతిరుగుడు నూనె', category: 'Oils & Ghee', price_per_kg: 145, min_qty: 500, step: 500, unit_type: 'liters' },
    { name: 'Pure Cow Ghee (Neyyi)', name_local: 'నెయ్యి', category: 'Oils & Ghee', price_per_kg: 680, min_qty: 100, step: 100 },

    // Flours
    { name: 'Wheat Flour (Godhuma Pindi)', name_local: 'గోధుమ పిండి', category: 'Flours & Ravva', price_per_kg: 48, min_qty: 500, step: 500 },
    { name: 'Besan (Senaga Pindi)', name_local: 'శెనగ పిండి', category: 'Flours & Ravva', price_per_kg: 100, min_qty: 250, step: 250 },

    // Sugar & Bellam
    { name: 'Crystal Sugar (Chakkera)', name_local: 'చక్కెర', category: 'Sugar & Bellam', price_per_kg: 46, min_qty: 500, step: 500 },
    { name: 'Anakapalle Jaggery (Bellam)', name_local: 'అనకాపల్లి బెల్లం', category: 'Sugar & Bellam', price_per_kg: 70, min_qty: 250, step: 250 },

    // Tea & Coffee
    { name: 'Filter Coffee Powder', name_local: 'ఫిల్టర్ కాఫీ', category: 'Tea & Coffee', price_per_kg: 550, min_qty: 100, step: 50 },
    { name: 'Assam Tea Leaves', name_local: 'టీ పొడి', category: 'Tea & Coffee', price_per_kg: 380, min_qty: 100, step: 50 },

    // Sachets & Mini (Pieces specific)
    { name: 'Clinic Plus Shampoo Sachet', name_local: 'క్లినిక్ ప్లస్', category: 'Sachets & Mini', price_per_kg: 2, min_qty: 1, step: 1, unit_type: 'pieces' },
    { name: 'Sunsilk Black Shampoo Sachet', name_local: 'సన్సిల్క్', category: 'Sachets & Mini', price_per_kg: 2, min_qty: 1, step: 1, unit_type: 'pieces' },
    { name: 'Bru Instant Coffee Sachet', name_local: 'బ్రూ సాచెట్', category: 'Sachets & Mini', price_per_kg: 2, min_qty: 1, step: 1, unit_type: 'pieces' },
    { name: 'Tide Surf Excel Sachet', name_local: 'సర్ఫ్ ఎక్సెల్', category: 'Sachets & Mini', price_per_kg: 5, min_qty: 1, step: 1, unit_type: 'pieces' },
    { name: 'Maggi Rs.5 Mini Pack', name_local: 'మ్యాగీ', category: 'Sachets & Mini', price_per_kg: 5, min_qty: 1, step: 1, unit_type: 'pieces' },
  ];

  const getCategoryId = db.prepare('SELECT id FROM categories WHERE name = ?');
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (name, name_local, category_id, price_per_kg, min_qty_grams, qty_step_grams, unit_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let productCount = 0;
  for (const p of products) {
    const cat = getCategoryId.get(p.category);
    if (cat) {
      insertProduct.run(p.name, p.name_local, cat.id, p.price_per_kg, p.min_qty, p.step, p.unit_type || 'grams');
      productCount++;
    }
  }
  console.log(`🛒 ${productCount} products created`);

  // Sample address for demo customer
  const customer = db.prepare("SELECT id FROM users WHERE phone = '9876543210'").get();
  if (customer) {
    db.prepare(`
      INSERT OR IGNORE INTO addresses (user_id, label, full_address, landmark, pincode, is_default)
      VALUES (?, 'Home', '42, Raj Nagar Colony, MG Road', 'Near SBI Bank', '560001', 1)
    `).run(customer.id);
    console.log('📍 Sample address created');
  }

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Login:  phone=9999999999  password=admin123');
  console.log('Customer OTP: phone=9876543210  otp=123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed();
