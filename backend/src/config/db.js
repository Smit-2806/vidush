import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local DB store with file persistence
const storeFilePath = path.resolve(__dirname, "../../database/store.json");
const seedDataPath = path.resolve(__dirname, "../../database/seedData.json");

let inMemoryDb = {
  jobs: [],
  events: [],
  alumni: [],
  users: {},
  applications: [],
};

// Load existing data from store.json or seedData.json
try {
  if (fs.existsSync(storeFilePath)) {
    const raw = fs.readFileSync(storeFilePath, "utf8");
    const parsed = JSON.parse(raw);
    inMemoryDb.jobs = parsed.jobs || [];
    inMemoryDb.events = parsed.events || [];
    inMemoryDb.alumni = parsed.alumni || [];
    inMemoryDb.users = parsed.users || {};
    inMemoryDb.applications = parsed.applications || [];
  } else if (fs.existsSync(seedDataPath)) {
    const raw = fs.readFileSync(seedDataPath, "utf8");
    const parsed = JSON.parse(raw);
    inMemoryDb.jobs = parsed.jobs || [];
    inMemoryDb.events = parsed.events || [];
    inMemoryDb.alumni = parsed.alumni || [];
  }
} catch (e) {
  console.warn("Notice: Initializing blank database store:", e.message);
}

function persistStore() {
  try {
    fs.writeFileSync(storeFilePath, JSON.stringify(inMemoryDb, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist local store:", err.message);
  }
}

export let isUsingMockDb = true;
export let db = null;

// Mock database adapter that mirrors Firestore collection API with file persistence
const mockFirestore = {
  collection: (collectionName) => ({
    get: async () => {
      const raw = inMemoryDb[collectionName] || [];
      const items = Array.isArray(raw)
        ? raw
        : Object.entries(raw).map(([id, val]) => ({ id, ...val }));
      return {
        empty: items.length === 0,
        docs: items.map((doc) => ({
          id: doc.id || doc.uid,
          data: () => doc,
        })),
      };
    },
    doc: (docId) => ({
      get: async () => {
        if (collectionName === "users") {
          const user = inMemoryDb.users[docId];
          return {
            exists: !!user,
            id: docId,
            data: () => user || null,
          };
        }
        const items = inMemoryDb[collectionName] || [];
        const item = items.find((i) => i.id === docId);
        return {
          exists: !!item,
          id: docId,
          data: () => item || null,
        };
      },
      set: async (data, options = {}) => {
        if (collectionName === "users") {
          inMemoryDb.users[docId] = options.merge
            ? { ...inMemoryDb.users[docId], ...data, uid: docId }
            : { ...data, uid: docId };
          persistStore();
          return;
        }
        const items = inMemoryDb[collectionName] || [];
        const idx = items.findIndex((i) => i.id === docId);
        const record = { id: docId, ...data };
        if (idx >= 0) {
          items[idx] = options.merge ? { ...items[idx], ...record } : record;
        } else {
          items.push(record);
        }
        persistStore();
      },
      update: async (data) => {
        if (collectionName === "users") {
          if (inMemoryDb.users[docId]) {
            inMemoryDb.users[docId] = { ...inMemoryDb.users[docId], ...data, uid: docId };
            persistStore();
          }
          return;
        }
        const items = inMemoryDb[collectionName] || [];
        const idx = items.findIndex((i) => i.id === docId);
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...data };
          persistStore();
        }
      },
      delete: async () => {
        if (collectionName === "users") {
          delete inMemoryDb.users[docId];
          persistStore();
          return;
        }
        inMemoryDb[collectionName] = (inMemoryDb[collectionName] || []).filter(
          (i) => i.id !== docId
        );
        persistStore();
      },
    }),
    add: async (data) => {
      const id = `${collectionName.slice(0, 3)}-${Date.now()}`;
      const record = { id, ...data };
      if (!inMemoryDb[collectionName]) inMemoryDb[collectionName] = [];
      inMemoryDb[collectionName].push(record);
      persistStore();
      return { id };
    },
  }),
};

// Check if Firebase Admin can be initialized with service account
if (config.serviceAccountPath && fs.existsSync(config.serviceAccountPath)) {
  try {
    const adminModule = await import("firebase-admin");
    const admin = adminModule.default;
    const serviceAccount = JSON.parse(
      fs.readFileSync(config.serviceAccountPath, "utf8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebaseProjectId,
    });
    db = admin.firestore();
    isUsingMockDb = false;
    console.log(`Connected to Google Cloud Firestore (Project: ${config.firebaseProjectId})`);
  } catch (err) {
    console.warn("⚠️ Firebase Admin initialization failed, using persistent database adapter:", err.message);
    db = mockFirestore;
    isUsingMockDb = true;
  }
} else {
  db = mockFirestore;
  isUsingMockDb = true;
  console.log(`Database adapter initialized with project ${config.firebaseProjectId} (Persistent Local Mode)`);
}

export { inMemoryDb, persistStore };
