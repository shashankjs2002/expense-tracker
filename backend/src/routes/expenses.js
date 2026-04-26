const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authenticate = require('../middleware/authenticate');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const idempotency = require('../middleware/idempotency');
const { createExpenseSchema, getExpensesQuerySchema } = require('../validators');

// All expense routes require authentication
router.use(authenticate);
router.use(requireAuth);

// POST /expenses – idempotent creation
router.post(
    '/',
    idempotency,                    // 1. check idempotency, set req.idempotencyKey
    validate(createExpenseSchema),  // 2. validate body
    expenseController.createExpense
);

// GET /expenses – list with optional filter & sort
router.get(
    '/',
    validate(getExpensesQuerySchema, 'query'),
    expenseController.getExpenses
);

module.exports = router;