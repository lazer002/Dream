// middleware/upload.js
//
// Uploads are held in memory, so multer itself must stop big files BEFORE they
// are buffered (otherwise one huge request can crash the server). The real
// file type is checked from the file's first bytes (sniffImage), never trusted
// from the client's filename or Content-Type.

import multer from "multer";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const imageFilter = (_req, file, cb) => {
  if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);

  const err = new Error("Only JPG, PNG or WEBP images are allowed");
  err.status = 400;

  return cb(err);
};

/** Customer uploads (profile photo, return/product-request photos): 1 file, 1MB. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: imageFilter,
});

/** Admin product images: up to 10 files, 8MB each. */
export const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10, fields: 20 },
  fileFilter: imageFilter,
});

/** Real image type from magic bytes -> { ext, mime } or null. */
export function sniffImage(buffer) {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }

  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png", mime: "image/png" };
  }

  if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }

  return null;
}

/** Turn multer errors (too big, too many files) into clean 400/413 responses. */
export function handleUploadErrors(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File too large" : "Invalid upload";

    return res.status(status).json({ error: message });
  }

  if (err?.status === 400) return res.status(400).json({ error: err.message });

  return next(err);
}

const withErrors = (middleware) => (req, res, next) =>
  middleware(req, res, (err) => (err ? handleUploadErrors(err, req, res, next) : next()));

/** Route middleware: one customer image in field `name`. */
export const singleImage = (name) => withErrors(upload.single(name));

/** Route middleware: up to `max` admin images in field `name`. */
export const adminImages = (name, max = 10) => withErrors(adminUpload.array(name, max));
