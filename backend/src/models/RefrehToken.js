const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Hash of the actual refresh token (sha256)
    tokenHash: {
        type: String,
        required: true,
    },
    // Family identifier – all tokens from the same series are grouped.
    // When rotating tokens, we keep the same family. If a token from a family
    // is reused (indicating theft), we revoke the whole family.
    family: {
        type: String,
        required: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
});

// ----- TTL index to auto-delete expired tokens -----
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ----- Helper: check if token is revoked or expired -----
refreshTokenSchema.methods.isValid = function () {
    return this.revokedAt === null && this.expiresAt > new Date();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);