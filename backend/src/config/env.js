import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "alunimi-947f0",
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA_N9CzEMa7tmvM8m7_otIVCRPXQE5ORdA",
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null,
  adminEmails: (process.env.ADMIN_EMAILS || "admin@alumniportal.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  adminUids: (process.env.ADMIN_UIDS || "iL8SjtYEODUpX778guh7UpNpPhz1")
    .split(",")
    .map((uid) => uid.trim())
    .filter(Boolean),
};
