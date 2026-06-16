import "dotenv/config";
import mysql from "mysql2/promise";

// Mock connection or real connection if env vars provided
// For this demonstration, we'll just export a pool that would work with the schema we designed
const useRemote = process.env.DB_MODE === "remote";
console.log("DB_MODE =", process.env.DB_MODE);

const env = (key) => process.env[useRemote ? `${key}_R` : key];

export const db = mysql.createPool({
  host: env("DB_HOST"),
  user: env("DB_USER"),
  password: env("DB_PASS"),
  database: env("DB_NAME"),
});

const ensureParams = (params) => {
  if (params === undefined || params === null) {
    throw new Error("SQL parameters are required");
  }

  const isArray = Array.isArray(params);
  const isObject = !isArray && typeof params === "object";
  if (!isArray && !isObject) {
    throw new Error("SQL parameters must be an array or object");
  }
};

export const safeExecute = async (sql, params) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }

  ensureParams(params);
  const [result] = await db.execute(sql, params);
  return result;
};
