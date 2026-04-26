const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,   // duplicate key error will be thrown if raced
    },
    // The response we should replay:
    response: {
        statusCode: { type: Number, required: true },
        body: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // TTL: automatically remove documents after 24 hours (in seconds)
        expires: 86400,
    },
});

// JSON transformation – no sensitive data but keep it clean
idempotencyKeySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);