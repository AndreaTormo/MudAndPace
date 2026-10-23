const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { AppError } = require('../utils/appError');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 8;
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'events');

const MIME_EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const eventId = req.params.id;
    if (!/^[a-f\d]{24}$/i.test(eventId || '')) {
      return callback(new AppError('ID de evento inválido', 400, 'INVALID_ID'));
    }

    const directory = path.join(UPLOAD_ROOT, eventId);
    fs.mkdirSync(directory, { recursive: true });
    return callback(null, directory);
  },
  filename(req, file, callback) {
    const extension = MIME_EXTENSIONS.get(file.mimetype) || path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    return callback(null, filename);
  }
});

function fileFilter(req, file, callback) {
  if (!MIME_EXTENSIONS.has(file.mimetype)) {
    return callback(new AppError('Solo se permiten imágenes JPG, PNG o WebP', 400, 'INVALID_IMAGE_TYPE'));
  }
  return callback(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});
