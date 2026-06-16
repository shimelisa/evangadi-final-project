import dotenv from "dotenv";
dotenv.config(); // the two dotenv lines can be "import 'dotenv/config';"
import express from "express";
import cors from "cors";
import { db } from "./db/config.js";
import mainRouter from "./src/api/routes.js";
import { errorHandler } from "./src/middleware/error-handler.js";
import { authenticateUser } from "./src/middleware/authentication.js";

// added for creating users table if it doesn't exist
import fs from "fs/promises";
import path from "path";

const app = express();
const port = process.env.PORT || 3777;

//%Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//%Health check route
app.get("/health", authenticateUser, (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

//% API routes
app.use("/api", mainRouter);

//error handler middleware should be used after all routes and before starting the server
app.use(errorHandler);

//! Create users table if it doesn't exist - added

const runUsersTable = async () => {
  const sql = await fs.readFile(
    path.join(process.cwd(), "db/users.sql"),
    "utf8",
  );

  await db.query(sql);
  console.log("Users table created");
};
//Start server
const startServer = async () => {
  try {
    // 1. Test database connection
    const connection = await db.getConnection();
    if (connection.config.host === "31.97.208.132") {
      console.log("Successfully connected to 'Remote' Database.");
    } else {
      console.log("Successfully connected to 'Local' Database.");
    }
    connection.release();

    // 2. Run schema BEFORE starting server
    // await runUsersTable(); >>> to create users table from users.sql file

    // 3. Start Express server
    app.listen(port, (err) => {
      if (err) {
        console.error(`Failed to start server on port ${port}:`, err.message);
        process.exit(1);
      } else {
        console.log(`Server is running on port http://localhost:${port}`);
      }
    });
  } catch (err) {
    console.error(
      "Failed to connect to database. Server not started.",
      err.message,
    );
    process.exit(1);
  }
};

startServer();
