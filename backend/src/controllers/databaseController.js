import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db, isUsingMockDb, inMemoryDb } from "../config/db.js";
import { config } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/database/seed
export async function seedDatabase(req, res) {
  try {
    const seedDataPath = path.resolve(__dirname, "../../database/seedData.json");
    const rawData = fs.readFileSync(seedDataPath, "utf8");
    const data = JSON.parse(rawData);

    if (isUsingMockDb) {
      inMemoryDb.jobs = [...data.jobs];
      inMemoryDb.events = [...data.events];
      inMemoryDb.alumni = [...data.alumni];
      return res.json({
        success: true,
        message: "Database seeded in local/mock mode",
        summary: {
          jobsCount: inMemoryDb.jobs.length,
          eventsCount: inMemoryDb.events.length,
          alumniCount: inMemoryDb.alumni.length,
        },
      });
    }

    // Seed to Cloud Firestore
    const jobsCollection = db.collection("jobs");
    for (const job of data.jobs) {
      await jobsCollection.doc(job.id).set(job, { merge: true });
    }

    const eventsCollection = db.collection("events");
    for (const event of data.events) {
      await eventsCollection.doc(event.id).set(event, { merge: true });
    }

    const alumniCollection = db.collection("alumni");
    for (const alumnus of data.alumni) {
      await alumniCollection.doc(alumnus.id).set(alumnus, { merge: true });
    }

    res.json({
      success: true,
      message: "Database seeded successfully into Firestore",
      summary: {
        jobsCount: data.jobs.length,
        eventsCount: data.events.length,
        alumniCount: data.alumni.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database seeding failed",
      error: error.message,
    });
  }
}

// GET /api/database/status
export async function getDatabaseStatus(req, res) {
  try {
    const jobsSnap = await db.collection("jobs").get();
    const eventsSnap = await db.collection("events").get();
    const alumniSnap = await db.collection("alumni").get();

    res.json({
      success: true,
      mode: isUsingMockDb ? "local-adapter" : "google-cloud-firestore",
      projectId: config.firebaseProjectId,
      collections: {
        jobs: jobsSnap.docs.length,
        events: eventsSnap.docs.length,
        alumni: alumniSnap.docs.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get database status",
      error: error.message,
    });
  }
}
