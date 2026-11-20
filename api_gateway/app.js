require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:4200']);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN no está definida');
}

const apiTarget = process.env.API_TARGET || 'http://localhost:3000';
const aiTarget = process.env.AI_TARGET || 'http://localhost:3001';

app.set('trust proxy', 1);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

async function checkService(name, url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    const body = await response.json();
    return {
      name,
      status: response.ok && body.status === 'ok' ? 'ok' : 'error',
      httpStatus: response.status
    };
  } catch (error) {
    return { name, status: 'error', message: error.message };
  }
}

app.get('/health', async (req, res) => {
  const services = await Promise.all([
    checkService('api', `${apiTarget}/health`),
    checkService('ia', `${aiTarget}/health`)
  ]);
  const healthy = services.every((service) => service.status === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'error',
    service: 'api-gateway',
    services: Object.fromEntries(services.map(({ name, ...details }) => [name, details])),
    timestamp: new Date().toISOString()
  });
});

function proxyTo(target, pathFilter) {
  return createProxyMiddleware({
    target,
    pathFilter,
    changeOrigin: true,
    xfwd: true,
    secure: false,
    proxyTimeout: 120000,
    on: {
      proxyRes: (proxyRes) => {
        Object.keys(proxyRes.headers).forEach((header) => {
          if (header.toLowerCase().startsWith('access-control-')) {
            delete proxyRes.headers[header];
          }
        });
      },
      error: (error, req, res) => {
        console.error('Error del gateway:', error.message);
        if (res.headersSent) {
          res.end();
          return;
        }
        res.status(502).json({
          error: { code: 'GATEWAY_ERROR', message: 'No se pudo contactar con el servicio solicitado' }
        });
      }
    }
  });
}

app.use(proxyTo(aiTarget, '/api/v1/agent'));
app.use(proxyTo(apiTarget, '/api/v1'));
app.use(proxyTo(apiTarget, '/uploads'));

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API Gateway escuchando en http://localhost:${port}`));
