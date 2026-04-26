const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Middleware that:
 * - Generates a UUID request ID and attaches it to `req`.
 * - Logs the incoming request (method, url, requestId).
 * - Logs the outgoing response (status, duration).
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    logger.info(
        { requestId, method: req.method, url: req.originalUrl },
        'Incoming request'
    );

    // Listen for the finish event to log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(
            {
                requestId,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: duration,
            },
            'Request completed'
        );
    });

    next();
}

module.exports = requestLogger;