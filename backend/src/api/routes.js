import express from 'express';
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "./question/routes/question.routes.js";
import answersRoutes from "./answers/routes/answers.routes.js";
import ragRoutes from "./rag/routes/rag.routes.js";

export const mainRouter = express.Router();

// Define your API routes here
// api/auth - Authentication routes
mainRouter.use("/auth", authRoutes);

// api/questions
mainRouter.use("/questions", questionRoutes);

// api/answers
mainRouter.use("/answers", answersRoutes);

// rag

mainRouter.use("/rag/documents", ragRoutes);

export default mainRouter;