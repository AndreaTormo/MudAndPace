require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDatabase } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const eventRoutes = require('./routes/event.routes');
const referenceRoutes = require('./routes/reference.routes');
const validate = require('./middlewares/validate.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : true;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'trail-running-api', timestamp: new Date().toISOString() }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1d' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/references', referenceRoutes);
app.use(validate.notFound);
app.use(errorMiddleware);

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está definida');
    }
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
