const AppError = require('../utils/appError'); // You'll need to create this

const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure allowedRoles is an array
      if (!Array.isArray(allowedRoles)) {
        throw new Error('Allowed roles must be an array');
      }

      // Check if user exists
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Please login to access this resource'
        });
      }

      // Check if user is active
      if (!req.user.active) {
        return res.status(403).json({
          status: 'error',
          message: 'Your account has been deactivated'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to perform this action'
        });
      }

      next();
    } catch (error) {
      next(new AppError('Authorization error', 500));
    }
  };
};

module.exports = roleAuth; 