require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDatabase } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const eventRoutes = require('./routes/event.routes');
const { router: departureRoutes, eventRouter: eventDepartureRoutes } = require('./routes/departure.routes');
const { router: commentRoutes, departureRouter: departureCommentRoutes } = require('./routes/comment.routes');
const ratingRoutes = require('./routes/rating.routes');
const referenceRoutes = require('./routes/reference.routes');
const shopRoutes = require('./routes/shop.routes');
const validate = require('./middlewares/validate.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const { AppError } = require('./utils/appError');

const COMMENT_BODY_LIMIT = 8 * 1024;

function isCommentWrite(req) {
  return (
    (req.method === 'POST' || req.method === 'PATCH') &&
    /\/comments(?:\/[^/]+(?:\/(?:report|status))?)?\/?$/.test(req.path)
  );
}

function tooLargeCommentBody() {
  return new AppError('La petición de comentario es demasiado grande', 413, 'PAYLOAD_TOO_LARGE');
}

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
app.use(cookieParser());
app.use((req, res, next) => {
  if (isCommentWrite(req) && Number(req.headers['content-length']) > COMMENT_BODY_LIMIT) {
    return next(tooLargeCommentBody());
  }
  next();
});
app.use(
  express.json({
    limit: '2mb',
    verify(req, res, buffer) {
      if (isCommentWrite(req) && buffer.length > COMMENT_BODY_LIMIT) {
        throw tooLargeCommentBody();
      }
    }
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'trail-running-api', timestamp: new Date().toISOString() }));
app.use('/uploads/carousel', express.static(path.join(__dirname, '..', 'uploads', 'carousel'), { maxAge: 0 }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1d' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/events/:eventId/departures', eventDepartureRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/departures/:departureId/comments', departureCommentRoutes);
app.use('/api/v1/departures/:departureId/ratings', ratingRoutes);
app.use('/api/v1/departures', departureRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/references', referenceRoutes);
app.use('/api/v1/shop', shopRoutes);
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
