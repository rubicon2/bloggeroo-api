import getFileExtFromMimeType from '../helpers/getFileExtFromMimeType.mjs';
import multer from 'multer';

const allowedUploadMimeTypes = JSON.parse(
  process.env.UPLOAD_ALLOWED_MIME_TYPES,
);

const maxSizeBytes = process.env.UPLOAD_MAX_SIZE_MB * 1024 * 1024;

const errorMsg = process.env.UPLOAD_MIME_TYPE_ERROR;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.VOLUME_MOUNT_PATH);
  },
  filename: (req, file, cb) => {
    const fileExt = getFileExtFromMimeType(file.mimetype);
    if (!fileExt) {
      return cb(
        new Error(
          `Invalid mimetype: ${file.mimetype}. Could not extract file extension`,
        ),
      );
    }
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniquePrefix + '.' + fileExt);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedUploadMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    return cb(new Error(errorMsg), false);
  }
};

const limits = {
  fileSize: maxSizeBytes,
};

export default multer({
  storage,
  fileFilter,
  limits,
});
