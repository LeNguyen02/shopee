const { authenticateToken } = require('./auth');

const requireAdmin = async (req, res, next) => {
  
  // First check if user is authenticated
  authenticateToken(req, res, (err) => {
    if (err) {
      console.log('Authentication failed:', err.message);
      return;
    }
    
    // Check if user has admin role
    if (req.user.roles !== 'Admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({
        message: 'Quyền truy cập bị từ chối. Chỉ admin mới có thể truy cập.',
        data: null
      });
    }
    
    next();
  });
};

module.exports = { requireAdmin };
