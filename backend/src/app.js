const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

const app = express();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDoc = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// --- Security & Parsing ---
app.use(helmet());
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,   // allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// --- Logging ---
app.use(requestLogger);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// --- Health check (handy) ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- 404 & Error handling (order matters) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;