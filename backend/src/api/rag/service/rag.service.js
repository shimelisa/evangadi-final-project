/**
 * @file rag.service.js (BACKEND)
 * @description All RAG document service functions.
 *
 * IMPORTANT — storage_path convention:
 *   Stored in DB as a relative path from the backend root:
 *   e.g. "uploads/rag/1234567-abc.pdf"
 *
 *   To get the absolute path use:
 *   path.join(process.cwd(), storage_path)
 *
 *   Do NOT use path.resolve(storage_path) alone — it can
 *   double the backend folder on Windows.
 */
import path from "path";
import fs from "fs/promises";
import { safeExecute } from "../../../../db/config.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
import { readFile } from "fs/promises";
import {PDFParse} from "pdf-parse";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash-lite";
const RAG_CHUNK_CHARS = parseInt(process.env.RAG_CHUNK_CHARS ?? "900", 10);
const RAG_CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP ?? "120", 10);
const RAG_SEARCH_K = parseInt(process.env.RAG_SEARCH_K ?? "10", 10);
const RAG_SEARCH_THRESHOLD = parseFloat(
  process.env.RAG_SEARCH_THRESHOLD ?? "0.45",
);

// ── Helper: resolve storage_path safely ─────────────────────────────────────
/**
 * Converts a relative storage_path to an absolute path.
 * Uses process.cwd() (backend root) to avoid path doubling on Windows.
 * @param {string} storagePath - e.g. "uploads/rag/file.pdf"
 * @returns {string} absolute path
 */
const resolveStoragePath = (storagePath) =>
  path.join(process.cwd(), storagePath);

// ── Shared: assertOwnedDocument ──────────────────────────────────────────────
/**
 * Verifies that a document exists and belongs to the requesting user.
 * Reusable across all RAG controllers (file, search, query, delete, meta).
 *
 * @param {number} documentId - The document ID from the route param.
 * @param {number} userId - The authenticated user's ID from req.user.id.
 * @returns {Promise<Object>} The full document row from the DB.
 * @throws {Error} 404 if not found or not owned by this user.
 */
export const assertOwnedDocument = async (documentId, userId) => {
  const rows = await safeExecute(
    `SELECT
       document_id, user_id, title,
       storage_path, mime_type, byte_size,
       status, error_message, created_at, updated_at
     FROM documents
     WHERE document_id = ? AND user_id = ?
     LIMIT 1`,
    [documentId, userId],
  );

  if (rows.length === 0) {
    const err = new Error("Document not found");
    err.statusCode = 404;
    throw err;
  }

  return rows[0];
};

// ── T-22: Upload & Process ───────────────────────────────────────────────────
const chunkText = (text) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + RAG_CHUNK_CHARS));
    start += RAG_CHUNK_CHARS - RAG_CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.trim().length > 0);
};

const embedText = async (text, taskType = "RETRIEVAL_DOCUMENT") => {
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { taskType },
  });  
  return result.embeddings[0].values;
};

export const createDocumentFromUploadService = async ({ file, userId }) => {
  // storage_path saved as relative path e.g. "uploads/rag/file.pdf"
  const storagePath = file.path.replace(/\\/g, "/"); // normalize Windows backslashes

  const insertResult = await safeExecute(
    `INSERT INTO documents (user_id, title, mime_type, storage_path, byte_size, status)
     VALUES (?, ?, ?, ?, ?, 'processing')`,
    [userId, file.originalname, file.mimetype, storagePath, file.size],
  );
  const documentId = insertResult.insertId;

  try {   

    const buffer = await fs.readFile(resolveStoragePath(storagePath));
    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();
    const rawText = result.text;

    const chunks = chunkText(rawText);

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const chunkResult = await safeExecute(
        `INSERT INTO document_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)`,
        [documentId, i, content],
      );
      const embedding = await embedText(content, "RETRIEVAL_DOCUMENT");
      
      await safeExecute(
        `INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding, status)
         VALUES (?, ?, ?, 'ready')`,
        [chunkResult.insertId, content, JSON.stringify(embedding)],
      );
    }

    await safeExecute(
      `UPDATE documents SET status = 'ready' WHERE document_id = ?`,
      [documentId],
    );
  } catch (err) {    
    await safeExecute(
      `UPDATE documents SET status = 'failed', error_message = ? WHERE document_id = ?`,
      [err.message, documentId],
    );
  }

  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = ? LIMIT 1",
    [documentId],
  );
  return rows[0];
};

// ── T-23: Semantic Search ────────────────────────────────────────────────────
const cosineSimilarity = (a, b) => {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const searchInDocumentService = async ({
  documentId,
  userId,
  query,
  k = RAG_SEARCH_K,
}) => {
  const doc = await assertOwnedDocument(documentId, userId);
  if (doc.status !== "ready") {
    const err = new Error(`Document is not ready. Status: ${doc.status}`);
    err.statusCode = 409;
    throw err;
  }

  const queryVector = await embedText(query, "RETRIEVAL_QUERY");
  
  const vectors = await safeExecute(
    `SELECT dcv.chunk_id, dcv.source_text, dcv.embedding, dc.chunk_index
     FROM document_chunk_vectors dcv
     JOIN document_chunks dc ON dc.chunk_id = dcv.chunk_id
     WHERE dc.document_id = ? AND dcv.status = 'ready'`,
    [documentId],
  );  

  const scored = vectors
    .map((row) => {
      try {
        // const embedding = JSON.parse(row.embedding);
        const embedding =
          typeof row.embedding === "string"
            ? JSON.parse(row.embedding)
            : row.embedding;
        const score = cosineSimilarity(queryVector, embedding);
        return {
          chunkId: row.chunk_id,
          chunkIndex: row.chunk_index,
          excerpt: row.source_text,
          score,
        };
      } catch (e) {        
        return null;
      }
    })
    .filter(Boolean)
    .filter((r) => r.score >= RAG_SEARCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, k); 
 
  return { query, results: scored };
};

// ── T-23: AI Query ───────────────────────────────────────────────────────────
export const queryDocumentService = async ({ documentId, userId, query }) => {
  const { results } = await searchInDocumentService({
    documentId,
    userId,
    query,
    k: 5,
  });

  if (results.length === 0) {
    return {
      answer: "No relevant content found in this document for your query.",
      citations: [],
      chunksUsed: [],
    };
  }

  const context = results.map((r, i) => `[${i + 1}] ${r.excerpt}`).join("\n\n");

  const prompt = `You are an assistant that answers questions strictly based on provided document excerpts.
If the answer is not in the excerpts, say "This document does not cover that topic."

Document excerpts:
${context}

Question: ${query}

Answer (cite excerpt numbers like [1], [2] where relevant):`;

  const result = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
  });
  const answer = result.text;

  return {
    answer,
    citations: results.map((r, i) => ({
      ref: i + 1,
      chunkIndex: r.chunkIndex,
    })),
    chunksUsed: results.map((r) => r.chunkId),
  };
};

// ── T-24: Get Metadata ───────────────────────────────────────────────────────
export const getDocumentMetaService = async (documentId, userId) =>
  assertOwnedDocument(documentId, userId);

// ── T-24: Stream File ────────────────────────────────────────────────────────
/**
 * Retrieves document metadata and resolves the absolute file path.
 * @param {number} documentId
 * @param {number} userId
 * @returns {{ absolutePath, title, mimeType }}
 */
export const getRagDocumentFile = async (documentId, userId) => {
  const { storage_path, title, mime_type } = await assertOwnedDocument(
    documentId,
    userId,
  );

  return {
    absolutePath: resolveStoragePath(storage_path),
    title,
    mimeType: mime_type,
  };
};

// ── T-24: List Documents ─────────────────────────────────────────────────────
export const listDocumentsForUserService = async (userId) =>
  safeExecute(
    `SELECT document_id, title, mime_type, byte_size, status,
            error_message, created_at, updated_at
     FROM documents
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

// ── T-24: Delete ─────────────────────────────────────────────────────────────
export const deleteDocumentService = async (documentId, userId) => {
  const doc = await assertOwnedDocument(documentId, userId);

  try {
    await fs.unlink(resolveStoragePath(doc.storage_path));
  } catch (err) {
    if (err.code !== "ENOENT") throw err; // ignore if already deleted
  }

  await safeExecute("DELETE FROM documents WHERE document_id = ?", [
    documentId,
  ]);
  return { id: documentId };
};
