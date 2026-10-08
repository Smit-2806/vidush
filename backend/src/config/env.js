import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "alunimi-947f0",
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null,
};
