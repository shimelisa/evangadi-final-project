/**
 * @file rag.service.js  (FRONTEND)
 * @description Frontend service for RAG document API calls.
 * Path: src/services/rag/rag.service.js
 */

import { apiClient } from '../core/api.client.js';

/** List all documents for the logged-in user */
export const listDocuments = () => apiClient.get('/rag/documents');

/** Upload a PDF file */
export const uploadPdf = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/rag/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Delete a document by ID */
export const deleteDocument = (documentId) =>
  apiClient.delete(`/rag/documents/${documentId}`);

/** Semantic search within a document */
export const searchInDocument = (documentId, query) =>
  apiClient.get(`/rag/documents/${documentId}/search`, { params: { query } });

/** AI query grounded in document context */
export const queryDocument = (documentId, query) =>
  apiClient.post(`/rag/documents/${documentId}/query`, { query });

/**
 * YOUR TASK — Stream RAG Document PDF (T-24)
 * Calls GET /api/rag/documents/:documentId/file
 * Returns a blob URL for use in an <iframe>.
 * IMPORTANT: caller must call URL.revokeObjectURL(url) on cleanup.
 */
export const fetchPdfObjectUrl = async (documentId) => {
  const res = await apiClient.get(`/rag/documents/${documentId}/file`, {
    responseType: 'blob', // tells axios to return raw binary
  });
  return URL.createObjectURL(res.data); // creates temporary browser URL
};
