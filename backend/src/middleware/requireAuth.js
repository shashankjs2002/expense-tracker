const { AppError } = require('../utils/AppError');

/**
 * Requires req.userId to be set (by authenticate).
 */
function requireAuth(req, res, next) {
    if (!req.userId) {
        return next(new AppError('Authentication required', 401));
    }
    next();
}

module.exports = requireAuth;