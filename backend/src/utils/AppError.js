class AppError extends Error {
    /**
     * @param {string} message
     * @param {number} statusCode
     * @param {Array<any>} [errors]
     */
    constructor(message, statusCode, errors = undefined) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;   // distinguish from programming bugs
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { AppError };