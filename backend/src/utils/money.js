const { AppError } = require('./AppError');

/**
 * Converts a decimal string (e.g., "12.50") into integer cents.
 * Uses banker's rounding (round half to even) via Math.round.
 * Throws AppError on invalid input.
 *
 * @param {string} amountStr
 * @returns {number} integer cents
 */
function parseAmount(amountStr) {
    if (typeof amountStr !== 'string') {
        throw new AppError('Amount must be a string representing a decimal number', 422);
    }

    const trimmed = amountStr.trim();
    // Only allow digits, optionally one dot, and at most two decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
        throw new AppError('Invalid amount format. Use e.g. "12.50"', 422);
    }

    const floatVal = parseFloat(trimmed);
    if (isNaN(floatVal)) {
        throw new AppError('Amount could not be parsed as a number', 422);
    }

    // Convert to cents and round (handles floating point quirks)
    const cents = Math.round(floatVal * 100);

    // Disallow zero or negative amounts (expense must be positive)
    if (cents <= 0) {
        throw new AppError('Expense must be a positive amount greater than zero', 422);
    }

    return cents;
}

/**
 * Formats an integer amount of cents into a display string.
 * Example: 1250 → "₹12.50"
 *
 * @param {number} cents
 * @param {string} currencySymbol
 * @returns {string}
 */
function formatAmount(cents, currencySymbol = '₹') {
    if (!Number.isInteger(cents)) {
        throw new Error('formatAmount expects integer cents');
    }
    const amount = (cents / 100).toFixed(2);
    return `${currencySymbol}${amount}`;
}

module.exports = { parseAmount, formatAmount };