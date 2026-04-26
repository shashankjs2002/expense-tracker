const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    port: parseInt(process.env.PORT, 10) || 4000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiresIn: '15m',
        refreshExpiresIn: '7d',
    },
    refreshTokenCookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    nodeEnv: process.env.NODE_ENV || 'development',
};

// Quick validation for secrets in production
if (config.nodeEnv === 'production') {
    if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
        throw new Error('JWT secrets must be set in production environment');
    }
}

module.exports = config;