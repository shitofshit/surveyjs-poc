import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_DATABASE || "surveyjs",
  options: {
    encrypt: true, // Use this if you're on Azure
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
    trustedConnection: true, // For Windows Auth
  },
};

export const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed", err);
  }
};

export { sql };
