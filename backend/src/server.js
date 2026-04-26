const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// Connect to MongoDB
mongoose
    .connect(config.mongoUri)
    .then(() => {
        logger.info('Connected to MongoDB');
        // After successful connection, start the server
        app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
        });
    })
    .catch((err) => {
        logger.fatal({ err }, 'Failed to connect to MongoDB');
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
});