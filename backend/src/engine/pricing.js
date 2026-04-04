/**
 * GramFresh Pricing Engine
 * 
 * Core formula: price = (grams ÷ 1000) × pricePerKg
 * Rounded to nearest rupee.
 * 
 * Supports three unit types:
 *  - grams: sold by weight (default)
 *  - pieces: sold by count (price_per_kg becomes price_per_piece)
 *  - liters: sold by volume (price_per_kg becomes price_per_liter, quantity in ml)
 */

/**
 * Calculate the price for a given quantity
 * @param {number} quantity - Quantity in grams (or pieces/ml depending on unit_type)
 * @param {number} pricePerKg - Price per kg (or per piece/liter)
 * @param {string} unitType - 'grams' | 'pieces' | 'liters'
 * @returns {number} Price in rupees, rounded to nearest integer
 */
function calculatePrice(quantity, pricePerKg, unitType = 'grams') {
  if (unitType === 'pieces') {
    return Math.round(quantity * pricePerKg);
  }
  
  if (unitType === 'liters') {
    // quantity is in ml, price is per liter
    return Math.round((quantity / 1000) * pricePerKg);
  }
  
  // Default: grams
  // price = (grams ÷ 1000) × pricePerKg
  const price = (quantity / 1000) * pricePerKg;
  return Math.round(price);
}

/**
 * Validate that a requested quantity is valid for a product
 * @param {number} quantity - Requested quantity
 * @param {object} product - Product with min_qty_grams, max_qty_grams, qty_step_grams
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateQuantity(quantity, product) {
  if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
    return { valid: false, reason: 'Quantity must be a positive number' };
  }
  
  if (quantity < product.min_qty_grams) {
    return { 
      valid: false, 
      reason: `Minimum quantity is ${product.min_qty_grams}${product.unit_type === 'pieces' ? ' pcs' : 'g'}` 
    };
  }
  
  if (product.max_qty_grams && quantity > product.max_qty_grams) {
    return { 
      valid: false, 
      reason: `Maximum quantity is ${product.max_qty_grams}${product.unit_type === 'pieces' ? ' pcs' : 'g'}` 
    };
  }
  
  if (product.qty_step_grams && quantity % product.qty_step_grams !== 0) {
    return { 
      valid: false, 
      reason: `Quantity must be in steps of ${product.qty_step_grams}${product.unit_type === 'pieces' ? ' pcs' : 'g'}` 
    };
  }
  
  return { valid: true };
}

/**
 * Format price for display
 * @param {number} priceInRupees 
 * @returns {string} Formatted price string
 */
function formatPrice(priceInRupees) {
  return `₹${priceInRupees.toLocaleString('en-IN')}`;
}

/**
 * Format quantity for display
 * @param {number} quantity 
 * @param {string} unitType 
 * @returns {string}
 */
function formatQuantity(quantity, unitType = 'grams') {
  if (unitType === 'pieces') return `${quantity} pc${quantity > 1 ? 's' : ''}`;
  if (unitType === 'liters') {
    return quantity >= 1000 ? `${(quantity / 1000).toFixed(1)}L` : `${quantity}ml`;
  }
  // grams
  return quantity >= 1000 ? `${(quantity / 1000).toFixed(1)}kg` : `${quantity}g`;
}

module.exports = {
  calculatePrice,
  validateQuantity,
  formatPrice,
  formatQuantity
};
