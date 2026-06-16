import { StatusCodes } from "http-status-codes";
import {
  createAnswerService,
  deleteAnswerService,
  getAnswersService,
  getSingleAnswerService,
  updateAnswerService,
} from "../service/answer.service.js";

/**
 * Handles creating a new answer.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */

export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;

    const answer = await createAnswerService({
      questionId,
      content,
      userId: req.user.id,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Answer posted successfully.",
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles listing answers by question with sorting. Max 100 records.
 *
 * @param {import('express').Request} req - The Express request object.
 *
 */
//! the above is at line 39
//! below is AI suggestion
/**
 * Handles listing answers by question with sorting. Max 100 records.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getAnswersController = async (req, res) => {
  // const { questionId } = req.params;
  const { questionId, sortBy, limit } = req.query;

  const result = await getAnswersService({ questionId, sortBy, limit });

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

/**
 * Retrieves a single answer by its ID.
 *
 * @param {import('express').Request} req - The Express request object.
 */
export const getSingleAnswerController = async (req, res) => {
  const { answerId } = req.params;

  const answer = await getSingleAnswerService(answerId);

  res.status(StatusCodes.OK).json({
    success: true,
    data: answer,
  });
};

/**
 * Handles updating an existing answer.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const updateAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;

    const answer = await updateAnswerService({
      answerId,
      content,
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer updated successfully.",
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles deleting an existing answer.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const deleteAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;

    const result = await deleteAnswerService({
      answerId,
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};