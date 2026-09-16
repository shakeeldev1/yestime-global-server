const multer = require('multer');

const uploadPaymentProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Payment proof must be a JPG, PNG or WEBP image'));
    }
    callback(null, true);
  },
});

module.exports = { uploadPaymentProof };
