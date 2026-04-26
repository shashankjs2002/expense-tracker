const { verifyAccessToken } = require('../utils/token');
const { AppError } = require('../utils/AppError');

/**
 * Middleware that verifies the access token.
 * Must be applied BEFORE requireAuth.
 * On success, sets req.userId.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided – don't throw, let requireAuth handle the rejection
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next();
    }

    try {
        const decoded = verifyAccessToken(token);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        next(err);   // will be caught by errorHandler
    }
}

module.exports = authenticate;