const { AppError } = require('../utils/AppError');

/**
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 * @returns middleware function
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            const formattedErrors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return next(new AppError('Validation failed', 422, formattedErrors));
        }
        // Replace with parsed (and possibly transformed) data
        req[source] = result.data;
        next();
    };
}

module.exports = validate;