import app from "./app.js";
import { config } from "./config/env.js";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Alumni Portal Backend Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔥 Environment: ${config.nodeEnv}`);
  console.log(`💾 Database: Google Cloud Firestore (Project: ${config.firebaseProjectId})`);
  console.log(`===============================================`);
});
