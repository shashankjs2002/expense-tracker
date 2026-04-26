// Checks the Idempotency-Key header, returns the previously created expense 
// if one already exists, otherwise passes the key downstream.
//  Race conditions are handled later in the controller using MongoDB’s unique index.





const Expense = require('../models/Expense');
const { AppError } = require('../utils/AppError');

/**
 * Middleware for POST /expenses that enforces idempotency.
 * - Requires Idempotency-Key header.
 * - If an expense with the same userId + key already exists, returns it (201).
 * - Otherwise, attaches the key to the request and proceeds.
 */
async function idempotency(req, res, next) {
    const key = req.headers['idempotency-key'];
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
        return next(new AppError('Missing or invalid Idempotency-Key header', 400));
    }

    // Only proceed if user is authenticated (requireAuth must run first)
    if (!req.userId) {
        return next(new AppError('Authentication required for idempotent request', 401));
    }

    try {
        const existing = await Expense.findOne({
            userId: req.userId,
            idempotencyKey: key,
        }).lean();

        if (existing) {
            // Return exactly the same successful creation response
            return res.status(201).json({
                status: 'success',
                data: existing,
            });
        }

        // Not found – attach the key so the controller can include it
        req.idempotencyKey = key;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = idempotency;