import multer from 'multer';

// Multer handles multipart/form-data (file uploads from Postman or HTML forms).
// We use memory storage so the file stays in RAM as req.file.buffer — no disk write needed.
const uploadTextFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Reject files larger than 5 MB
  fileFilter: (req, file, cb) => {
    // Only accept plain-text files (check MIME type or .txt extension)
    const isText =
      file.mimetype === 'text/plain' || file.originalname.endsWith('.txt');

    if (!isText) {
      const error = new Error('Only .txt files are allowed.');
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true); // File is valid — continue
  },
}).single('file'); // Expect one file in the form field named "file"

// Express middleware used on POST /api/mysql, /api/pinecone, /api/chroma-db
// Wraps multer's callback style so upload errors reach our central error handler
export const handleTextUpload = (req, res, next) => {
  uploadTextFile(req, res, err => {
    if (err) {
      err.statusCode = err.statusCode || 400;
      return next(err);
    }
    next(); // No error — continue to the controller
  });
};
