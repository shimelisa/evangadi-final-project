import express from "express";
import {
  createQuestionController,
  getSimilarQuestionsController,
  getQuestionsController,
  searchQuestionsSemanticController,
  getSingleQuestionController,
  generateQuestionDraftCoachController,
  assessAnswerAgainstQuestionController,
  deleteQuestionController,
} from "../controller/question.controller.js";

import {
  createQuestionValidation,
  getSimilarQuestionsValidation,
  getQuestionsValidation,
  searchQuestionsSemanticValidation,
  getSingleQuestionValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
  questionHashValidation,
} from "../validations/question.validation.js";

import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

/**
 * @route POST /api/questions
 * @desc Post a new question
 * @access Protected
 */
router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

/**
 * @route GET /api/questions
 * @desc Get questions with optional search filtering //- front Keyword search
 * @access Private
 */
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

/**
 * @route GET /api/questions/search | line 49
 * @desc Semantic search for questions using vector embeddings based on a text query //- also front semantic search
 * @access Private
 */
router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

/**
 * @route POST /api/questions/draft-coach    >>> line 61
 * @desc AI suggestions for a question draft (title + body)
 * @access Private
 */
router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

/**
 * @route GET /api/questions/:questionHash/similar
 * @desc Get similar questions based on vector embeddings
 * @access Private    >>> line 75
 */
router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

/**
 * @route POST /api/questions/:questionHash/answer-fit
 * @desc AI relevance check for an answer draft vs the question
 * @access Private
 */
router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

/**
 * @route GET /api/questions/:questionHash
 * @desc Get one question with answers
 * @access Private    >>> line 99
 */
router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

/**
 * @route DELETE /api/questions/:questionHash
 * @desc Delete one question
 * @access Protected
 */
router.delete(
  "/:questionHash",
  authenticateUser,
  questionHashValidation,
  deleteQuestionController,
);

export default router;
