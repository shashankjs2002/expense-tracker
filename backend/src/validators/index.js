const { z } = require('zod');

// --- Auth ---

const registerSchema = z.object({
    email: z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
});

// --- Expense ---

const createExpenseSchema = z.object({
    amount: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal number with up to 2 decimal places'),
    category: z.string().min(1, 'Category is required').max(50),
    description: z.string().max(200).optional().default(''),
    date: z.string().datetime({ message: 'Invalid ISO date' }),
});

// Refine: date must not be in the future (optional business rule)
// .refine((val) => new Date(val) <= new Date(), { message: 'Date cannot be in the future' })

const getExpensesQuerySchema = z.object({
    category: z.string().optional(),
    sort: z.enum(['date_desc', 'date_asc']).optional().default('date_desc'),
}).optional(); // Query can be empty (defaults applied)

module.exports = {
    registerSchema,
    loginSchema,
    createExpenseSchema,
    getExpensesQuerySchema,
};