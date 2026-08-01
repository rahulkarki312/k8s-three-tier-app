const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', process.env.NODE_ENV === 'development' ? err.stack : '🥷');
  
  // PostgreSQL specific errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed',
      message: 'Unable to connect to the database',
    });
  }
  
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'The resource already exists',
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `${req.method} ${req.url} does not exist`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};