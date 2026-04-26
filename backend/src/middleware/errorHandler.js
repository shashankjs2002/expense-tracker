const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Express error-handling middleware (4 parameters).
 * Catches all errors, logs them, and returns a uniform response.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // Log full error
    logger.error(
        {
            requestId: req.requestId,
            err: {
                message: err.message,
                stack: err.stack,
                statusCode: err.statusCode,
                name: err.name,
            },
        },
        'Unhandled error'
    );

    // Mongoose duplicate key error
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            status: 'error',
            message: `Duplicate value for ${field}. This resource already exists.`,
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(422).json({
            status: 'error',
            message: 'Database validation failed',
            errors,
        });
    }

    // Known operational error
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            errors: err.errors || undefined,
        });
    }

    // Unknown error – hide details in production
    const statusCode = 500;
    const message =
        config.nodeEnv === 'production'
            ? 'Something went wrong'
            : err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        status: 'error',
        message,
    });
}

module.exports = errorHandler;