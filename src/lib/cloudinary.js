const { v2: cloudinary } = require('cloudinary');
const env = require('../config/env');
const isConfigured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const uploadImageBuffer = (buffer, options = {}) => {
  if (!isConfigured) {
    const error = new Error('Cloudinary is not configured');
    error.statusCode = 503;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'yestime-global/payment-proofs', resource_type: 'image', ...options },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

const getCloudinaryPublicId = (imageUrl) => {
  let url;
  try {
    url = new URL(imageUrl);
  } catch {
    return null;
  }
  if (url.hostname !== 'res.cloudinary.com') return null;

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] !== env.CLOUDINARY_CLOUD_NAME) return null;
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex < 0 || segments[uploadIndex + 1] === undefined) return null;
  const versionIndex = segments.findIndex((segment, index) => index > uploadIndex && /^v\d+$/.test(segment));
  if (versionIndex < 0) return null;

  const publicIdSegments = segments.slice(versionIndex + 1);
  if (publicIdSegments.length === 0) return null;
  publicIdSegments[publicIdSegments.length - 1] = publicIdSegments[publicIdSegments.length - 1].replace(/\.[^.]+$/, '');
  return publicIdSegments.join('/') || null;
};

const deleteCloudinaryImages = async (publicIds) => {
  if (publicIds.length === 0) return;
  if (!isConfigured) {
    const error = new Error('Account data was permanently deleted, but linked Cloudinary images could not be removed because Cloudinary is not configured.');
    error.statusCode = 502;
    throw error;
  }

  const failures = [];
  for (const publicId of publicIds) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      if (result.result !== 'ok' && result.result !== 'not found') {
        failures.push(result.result || 'Unknown Cloudinary response');
      }
    } catch (error) {
      failures.push(error.message || 'Unknown Cloudinary error');
    }
  }

  if (failures.length > 0) {
    const error = new Error(`Account data was permanently deleted, but ${failures.length} linked Cloudinary image(s) could not be removed: ${failures[0]}`);
    error.statusCode = 502;
    throw error;
  }
};

module.exports = { uploadImageBuffer, getCloudinaryPublicId, deleteCloudinaryImages };
