const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('./AppError');

// --- Access Tokens (JWT) ---

/**
 * Generates a signed access token.
 * @param {string} userId
 * @returns {string}
 */
function generateAccessToken(userId) {
    return jwt.sign({ userId }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn,
    });
}

/**
 * Verifies an access token and returns the decoded payload.
 * @param {string} token
 * @returns {{ userId: string, iat: number, exp: number }}
 */
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AppError('Access token expired', 401);
        }
        throw new AppError('Invalid access token', 401);
    }
}

// --- Refresh Tokens (Opaque) ---

/**
 * Creates a cryptographically strong random refresh token string.
 * @returns {string} 256-bit hex string (64 chars)
 */
function generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a SHA-256 hash of a refresh token (for safe storage).
 * @param {string} token
 * @returns {string}
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a random family identifier (used to group refresh token rotations).
 * @returns {string}
 */
function generateTokenFamily() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Computes the expiry date for a refresh token.
 * @returns {Date}
 */
function getRefreshTokenExpiry() {
    const ms = config.refreshTokenCookieMaxAge;
    return new Date(Date.now() + ms);
}

module.exports = {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    hashToken,
    generateTokenFamily,
    getRefreshTokenExpiry,
};