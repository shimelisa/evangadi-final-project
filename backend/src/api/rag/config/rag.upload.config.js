/**
 * @file rag.upload.config.js
 * @description Multer configuration for RAG PDF uploads.
 * Accepts only PDF files, enforces size limit from .env.
 */

import multer from "multer";
import path from "path";
import fs from "fs";

const RAG_UPLOAD_DIR = process.env.RAG_UPLOAD_DIR ?? "uploads/rag";
const RAG_MAX_UPLOAD_MB = parseInt(process.env.RAG_MAX_UPLOAD_MB ?? "5", 10);

// ensure upload directory exists
if (!fs.existsSync(RAG_UPLOAD_DIR)) {
  fs.mkdirSync(RAG_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RAG_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

export const ragUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: RAG_MAX_UPLOAD_MB * 1024 * 1024 },
});

/**
 * Handles multer-specific errors (file too large, wrong type).
 * Must be placed after ragUpload middleware in the route chain.
 */
export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${RAG_MAX_UPLOAD_MB}MB.`,
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message === "Only PDF files are allowed") {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};
