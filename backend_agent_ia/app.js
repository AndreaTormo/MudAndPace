const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const agentRoutes = require('./routes/agent_ia_routes');
const { connectDatabase } = require('./config/database');
const validate = require('./middlewares/validate.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:4200']);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN no está definida');
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'mudandpace-agent-ia', timestamp: new Date().toISOString() })
);
app.use('/api/v1/agent', agentRoutes);
app.use(validate.notFound);
app.use(errorMiddleware);

const port = Number(process.env.PORT) || 3001;

if (require.main === module) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY no está definida: el chat del asistente no funcionará.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET no está definida: el análisis de sentimiento no funcionará.');
  }
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI no está definida: las actividades no funcionarán.');
  } else {
    connectDatabase().catch((error) => {
      console.error('No se pudo conectar a MongoDB:', error.message);
      console.warn('Las actividades no funcionarán hasta que MongoDB esté disponible.');
    });
  }
  app.listen(port, () => console.log(`Agent IA escuchando en http://localhost:${port}`));
}

module.exports = app;
