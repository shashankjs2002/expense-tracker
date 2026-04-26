const { AppError } = require('../utils/AppError');

function notFound(req, res, next) {
    next(new AppError(`Not found - ${req.originalUrl}`, 404));
}

module.exports = notFound;