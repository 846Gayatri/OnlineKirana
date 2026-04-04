/**
 * Central error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
  }

  // SQLite constraint errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'A record with this value already exists'
    });
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference',
      details: 'Referenced record does not exist'
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}

module.exports = errorHandler;
