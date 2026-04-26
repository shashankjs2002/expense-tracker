const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    generateTokenFamily,
    getRefreshTokenExpiry,
} = require('../utils/token');
const { AppError } = require('../utils/AppError');
const config = require('../config');
const logger = require('../utils/logger');

// Helper: Set refresh token cookie
function setRefreshCookie(res, token, maxAge) {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
        maxAge,
        path: '/api/auth',   // only sent to auth endpoints
    });
}

// Helper: Clear refresh token cookie
function clearRefreshCookie(res) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
}

// --- Register ---
exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Check for existing user
        const exists = await User.findOne({ email });
        if (exists) {
            throw new AppError('Email already registered', 409);
        }

        const user = new User({ email, name });
        user.password = password;   // triggers virtual & hashing
        await user.save();

        // Generate refresh token family
        const refreshToken = generateRefreshToken();
        const family = generateTokenFamily();
        const expiresAt = getRefreshTokenExpiry();

        await RefreshToken.create({
            userId: user._id,
            tokenHash: hashToken(refreshToken),
            family,
            expiresAt,
        });

        setRefreshCookie(res, refreshToken, config.refreshTokenCookieMaxAge);

        res.status(201).json({
            status: 'success',
            data: {
                user: { id: user._id, email: user.email, name: user.name },
            },
        });

        logger.info({ userId: user._id }, 'User registered');
    } catch (err) {
        next(err);
    }
};

// --- Login ---
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user || !(await user.comparePassword(password))) {
            throw new AppError('Invalid email or password', 401);
        }

        const accessToken = generateAccessToken(user._id);

        const refreshToken = generateRefreshToken();
        const family = generateTokenFamily();
        const expiresAt = getRefreshTokenExpiry();

        await RefreshToken.create({
            userId: user._id,
            tokenHash: hashToken(refreshToken),
            family,
            expiresAt,
        });

        setRefreshCookie(res, refreshToken, config.refreshTokenCookieMaxAge);

        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
                user: { id: user._id, email: user.email, name: user.name },
            },
        });

        logger.info({ userId: user._id }, 'User logged in');
    } catch (err) {
        next(err);
    }
};

// --- Refresh ---
exports.refresh = async (req, res, next) => {
    try {
        const oldToken = req.cookies.refreshToken;
        if (!oldToken) {
            throw new AppError('Refresh token missing', 401);
        }

        const hashed = hashToken(oldToken);

        // Find the token in DB
        const tokenDoc = await RefreshToken.findOne({ tokenHash: hashed });
        if (!tokenDoc || !tokenDoc.isValid()) {
            // Token not found or expired/revoked
            clearRefreshCookie(res);
            throw new AppError('Invalid or expired refresh token', 401);
        }

        // Check for token reuse (theft detection)
        if (tokenDoc.revokedAt) {
            // This token was already used! Revoke the whole family.
            await RefreshToken.updateMany(
                { family: tokenDoc.family, revokedAt: null },
                { $set: { revokedAt: new Date() } }
            );
            clearRefreshCookie(res);
            logger.warn({ userId: tokenDoc.userId, family: tokenDoc.family }, 'Token reuse detected, family revoked');
            throw new AppError('Suspicious token reuse, all sessions revoked. Please log in again.', 401);
        }

        // Rotate: revoke the old token
        tokenDoc.revokedAt = new Date();
        await tokenDoc.save();

        // Issue new tokens
        const accessToken = generateAccessToken(tokenDoc.userId);

        const newRefreshToken = generateRefreshToken();
        const expiresAt = getRefreshTokenExpiry();

        await RefreshToken.create({
            userId: tokenDoc.userId,
            tokenHash: hashToken(newRefreshToken),
            family: tokenDoc.family,   // keep same family
            expiresAt,
        });

        setRefreshCookie(res, newRefreshToken, config.refreshTokenCookieMaxAge);

        res.status(200).json({
            status: 'success',
            data: { accessToken },
        });
    } catch (err) {
        next(err);
    }
};

// --- Logout ---
exports.logout = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            const hashed = hashToken(token);
            const tokenDoc = await RefreshToken.findOne({ tokenHash: hashed });
            if (tokenDoc && !tokenDoc.revokedAt) {
                tokenDoc.revokedAt = new Date();
                await tokenDoc.save();
            }
        }

        clearRefreshCookie(res);

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    } catch (err) {
        next(err);
    }
};