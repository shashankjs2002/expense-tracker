const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,                     // we need to query by user
        },
        amountCents: {
            type: Number,
            required: true,
            min: [1, 'Expense must be at least 1 cent'],
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value for cents',
            },
        },
        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
            // You could add enum if you want to restrict categories
            // enum: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Other'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200,
            default: '',
        },
        date: {
            type: Date,
            required: true,
            default: () => new Date(),
        },
        // Optional: idempotency key stored on expense (alternative approach)
        // We'll use a separate IdempotencyKey collection as primary.
        // This field can be omitted; include only if you want a direct lookup.
        idempotencyKey: {
            type: String,
            index: true,
            sparse: true,   // index only documents that have this field
        },
    },
    { timestamps: true }
);

// ----- Compound indexes -----
// 1. List expenses for a user, sorted by date desc (most common query)
expenseSchema.index({ userId: 1, date: -1 });
// 2. Filter by category + sorted by date
expenseSchema.index({ userId: 1, category: 1, date: -1 });
// 3. (Optional) enforce idempotency at DB level if using expense-level key
//    Unique compound index when idempotencyKey is not null:
expenseSchema.index(
    { userId: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);

// ----- JSON transformation -----
expenseSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        delete ret.idempotencyKey;   // internal detail, not needed in responses
        return ret;
    },
});

module.exports = mongoose.model('Expense', expenseSchema);