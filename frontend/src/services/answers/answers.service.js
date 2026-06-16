/**
 * @file answer.service.js
 * @description Service for handling answer-related API requests.
 */

import { apiClient } from "../core/api.client.js";

/**
 * Post a new answer to a question.
 * @param {{ questionId: number, content: string }} data
 */
export const postAnswer = (data) => apiClient.post("/answers", data);

/**
 * Get all answers for a question.
 * @param {{ questionId: number, sortBy?: string }} params
 */
export const getAnswers = (params) => apiClient.get("/answers", { params });

/**
 * Get a single answer by ID.
 * @param {number} answerId
 */
export const getSingleAnswer = (answerId) =>
  apiClient.get(`/answers/${answerId}`);

/**
 * Update an existing answer.
 * @param {number} answerId
 * @param {{ content: string }} data
 */
export const updateAnswer = (answerId, data) =>
  apiClient.patch(`/answers/${answerId}`, data);

/**
 * Delete an answer by ID.
 * @param {number} answerId
 */
export const deleteAnswer = (answerId) =>
  apiClient.delete(`/answers/${answerId}`);
