const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/apiError');
const { successResponse } = require('../utils/apiResponse');

/**
 * Generate JWT token for a user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * POST /api/auth/register
 * Register a new user.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    logger.info('User registered successfully', {
      traceId: req.traceId,
      userId: user._id,
      email: user.email,
    });

    return successResponse(
      res,
      {
        user: { id: user._id, name: user.name, email: user.email },
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = generateToken(user);

    logger.info('User logged in successfully', {
      traceId: req.traceId,
      userId: user._id,
      email: user.email,
    });

    return successResponse(res, {
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
