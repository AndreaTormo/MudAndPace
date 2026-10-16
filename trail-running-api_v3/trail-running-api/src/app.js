require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDatabase } = require('./config/database');
const trailRouteRoutes = require('./routes/trailRoute.routes');
const eventRoutes = require('./routes/event.routes');
const referenceRoutes = require('./routes/reference.routes');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : true;

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'trail-running-api', timestamp: new Date().toISOString() }));
app.use('/api/v1/routes', trailRouteRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/references', referenceRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

async function start() {
  try {
    await connectDatabase();
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`));
  } catch (error) {
    console.error('No se pudo iniciar la aplicación:', error);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = app;
