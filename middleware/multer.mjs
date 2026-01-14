import multer from 'multer';

const allowedUploadMimeTypes = JSON.parse(
  process.env.UPLOAD_ALLOWED_MIME_TYPES,
);

const errorMsg = process.env.UPLOAD_MIME_TYPE_ERROR;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.VOLUME_MOUNT_PATH);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniquePrefix + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedUploadMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    return cb(new Error(errorMsg), false);
  }
};

export default multer({ storage, fileFilter });
