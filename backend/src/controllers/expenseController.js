const Expense = require('../models/Expense');
const IdempotencyKey = require('../models/IdempotencyKey');
const { parseAmount, formatAmount } = require('../utils/money');
const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * POST /expenses
 * Idempotent creation. Relies on idempotency middleware which sets req.idempotencyKey.
 */
exports.createExpense = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { amount, category, description, date } = req.body;
        const key = req.idempotencyKey;   // set by idempotency middleware

        // Parse amount string to integer cents (throws on invalid)
        const amountCents = parseAmount(amount);

        // Create expense document
        const expense = new Expense({
            userId,
            amountCents,
            category,
            description,
            date,
            idempotencyKey: key,   // store key for future duplicate detection
        });

        // Save expense – may throw duplicate key error on idempotencyKey index
        await expense.save();

        // Prepare success response
        const responseBody = {
            status: 'success',
            data: expense.toJSON(),
        };

        // Store idempotency response for future retries
        // Use the separate collection as primary cache
        try {
            await IdempotencyKey.create({
                key,
                response: {
                    statusCode: 201,
                    body: responseBody,
                },
            });
        } catch (idempotencyErr) {
            // If duplicate key, another request won the race; that's fine, we already created the expense.
            if (idempotencyErr.code === 11000) {
                logger.warn({ key }, 'Idempotency key race, response already cached');
            } else {
                throw idempotencyErr;
            }
        }

        res.status(201).json(responseBody);
        logger.info({ userId, expenseId: expense._id, key }, 'Expense created');
    } catch (err) {
        // Handle duplicate expense key (if idempotency middleware missed it due to race)
        if (err.code === 11000 && err.keyPattern && err.keyPattern.idempotencyKey) {
            // The expense was already created for this key (race condition between check and insert)
            // Fetch the existing expense and return it
            const existing = await Expense.findOne({
                userId: req.userId,
                idempotencyKey: req.idempotencyKey,
            }).lean();
            if (existing) {
                return res.status(201).json({
                    status: 'success',
                    data: existing,
                });
            }
            // Fallback: should not happen
            return next(new AppError('Duplicate idempotency key conflict', 409));
        }
        next(err);
    }
};

/**
 * GET /expenses
 * Supports filtering by category and sorting by date.
 * Computes total of the returned list.
 */
exports.getExpenses = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { category, sort } = req.query;

        // Build filter
        const filter = { userId };
        if (category) {
            filter.category = category;
        }

        // Sort order
        const sortOrder = sort === 'date_asc' ? 1 : -1;

        const expenses = await Expense.find(filter).sort({ date: sortOrder }).lean();

        // Compute total in cents
        const totalCents = expenses.reduce((sum, exp) => sum + exp.amountCents, 0);
        const formattedTotal = formatAmount(totalCents);

        res.status(200).json({
            status: 'success',
            data: {
                expenses,
                totalCents,
                formattedTotal,
            },
        });
    } catch (err) {
        next(err);
    }
};