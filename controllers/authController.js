const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');

// Cookie options
const cookieOptions = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Only send on HTTPS in production
  sameSite: 'strict'
};

const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Send token in cookie
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  const userWithoutPassword = user.toJSON();

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: userWithoutPassword }
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name,email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Only admins can create HR or admin accounts
    if (['hr', 'admin'].includes(role)) {
      if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('Only admins can create HR or admin accounts', 403));
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    createSendToken(user, 201, res);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    // Verify admin permission
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can update user roles', 403));
    }

    const { userId, newRole } = req.body;

    // Validate input
    if (!userId || !newRole) {
      return next(new AppError('Please provide userId and newRole', 400));
    }

    // Validate role
    if (!['user', 'hr', 'admin'].includes(newRole)) {
      return next(new AppError('Invalid role specified', 400));
    }

    // Find and update user
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent self-role modification
    if (user.id === req.user.id) {
      return next(new AppError('You cannot modify your own role', 403));
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Add authentication middleware
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header or cookies
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('Please log in to access this resource', 401));
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    // Check if user changed password after token issued
    if (user.passwordChangedAt && 
        decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return next(new AppError('User recently changed password. Please log in again', 401));
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Authentication error', 401));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: { include: ['password'] }
    });

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success' });
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { user: req.user }
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByPk(req.user.id, {
      attributes: { include: ['password'] }
    });

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Generate new token
    const token = signToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
}; 