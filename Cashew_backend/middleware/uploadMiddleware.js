/**
 * uploadMiddleware.js
 *
 * Handles product image uploads. Supports two modes:
 *
 *   CLOUDINARY (production — set CLOUDINARY_CLOUD_NAME, KEY, SECRET in env)
 *     Images are uploaded to Cloudinary CDN and the secure_url is stored in DB.
 *     Files are NOT saved to disk on Render's ephemeral filesystem.
 *
 *   LOCAL DISK (development fallback — when Cloudinary env vars are absent)
 *     Images are saved to /uploads on the local filesystem.
 *     The request path /uploads is served as static by server.js.
 *
 * Usage in routes:
 *   const { upload, getImageUrl } = require('../middleware/uploadMiddleware');
 *   router.post('/add', verifyToken, adminOnly, upload.single('image'), handler);
 */

const multer           = require('multer');
const cloudinary       = require('cloudinary').v2;
const path             = require('path');
const fs               = require('fs');

/* ── Shared file filter ────────────────────────────────────────── */
const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|avif/;
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files (jpg, png, gif, webp, avif) are allowed.'));
};

/* ── Choose storage backend based on env vars ──────────────────── */
const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (useCloudinary) {
  /* ── Cloudinary storage ──────────────────────────────────────── */
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });

  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:         'petrichor-naturals/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
      transformation: [
        /* Resize to max 800×800, maintain aspect ratio, good quality */
        { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      ],
      public_id: `product-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    }),
  });

  upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });

  console.log('[upload] Using Cloudinary storage');
} else {
  /* ── Local disk storage (dev fallback) ──────────────────────── */
  const uploadsDir = path.join(__dirname, '../uploads/products');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, name);
    },
  });

  upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });

  console.log('[upload] Using local disk storage (set CLOUDINARY_* env vars for production)');
}

/**
 * getImageUrl — extract the public URL from the uploaded file.
 *
 * Cloudinary: req.file.path  (CloudinaryStorage sets this to the CDN URL)
 * Local disk: build a /uploads/products/<filename> URL
 */
function getImageUrl(req) {
  if (!req.file) return null;

  if (useCloudinary) {
    /* CloudinaryStorage sets req.file.path to the CDN URL */
    return req.file.path;
  }

  /* Local: build a URL relative to the server origin */
  const filename = req.file.filename;
  return `/uploads/products/${filename}`;
}

module.exports = { upload, getImageUrl };
