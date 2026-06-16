import {apiClient} from "../core/api.client.js";

// POST /api/questions
export const createQuestion = (data) => apiClient.post("/questions", data);

// POST /api/questions/draft-coach
export const generateQuestionDraftCoach = (data) => apiClient.post("/questions/draft-coach", data);

// GET /api/questions?q=keyword
export const getQuestions = (params) => apiClient.get("/questions", { params });

// GET /api/questions/search?q=...
export const semanticSearch = (q) =>
  apiClient.get("/questions/search", { params: { q } });

// GET /api/questions/:questionHash/similar
export const getSimilarQuestions = (questionHash) =>
  apiClient.get(`/questions/${questionHash}/similar`);

// POST /api/questions/:questionHash/answer-fit
export const assessAnswerFit = (questionHash, data) =>
  apiClient.post(`/questions/${questionHash}/answer-fit`, data);

// GET /api/questions/:questionHash
export const getQuestion = (questionHash) =>
  apiClient.get(`/questions/${questionHash}`);

// DELETE /api/questions/:questionHash
export const deleteQuestion = (questionHash) =>
  apiClient.delete(`/questions/${questionHash}`);