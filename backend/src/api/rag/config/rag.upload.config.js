/**
 * @file rag.upload.config.js
 * @description Multer configuration for RAG PDF uploads.
 * Accepts only PDF files, enforces size limit from .env.
 */

import fs from "fs";
import path from "path";
import multer from "multer";
// import { CLIENT_RENEG_WINDOW } from "tls";

const RAG_UPLOAD_DIR = process.env.RAG_UPLOAD_DIR ?? "uploads/documents";
const RAG_MAX_UPLOAD_MB = parseInt(process.env.RAG_MAX_UPLOAD_MB ?? "5", 10);

// ensure upload directory exists
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user?.id;
    const uploadPath = path.join(process.cwd(), RAG_UPLOAD_DIR, String(userId));

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
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
