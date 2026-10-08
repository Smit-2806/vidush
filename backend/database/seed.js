import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db, isUsingMockDb } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log("🌱 Starting database seeding process...");

  const rawData = fs.readFileSync(path.join(__dirname, "seedData.json"), "utf8");
  const data = JSON.parse(rawData);

  if (isUsingMockDb) {
    console.log("ℹ️  Running in standalone mode (no external service account configured).");
    console.log("Data files verified successfully:");
    console.log(`- ${data.jobs.length} Jobs ready`);
    console.log(`- ${data.events.length} Events ready`);
    console.log(`- ${data.alumni.length} Alumni ready`);
    console.log("✅ Seed verification complete.");
    return;
  }

  try {
    // Seed Jobs
    console.log(`Seeding ${data.jobs.length} jobs to Firestore...`);
    const jobsCollection = db.collection("jobs");
    for (const job of data.jobs) {
      await jobsCollection.doc(job.id).set({
        ...job,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log("✅ Jobs seeded.");

    // Seed Events
    console.log(`Seeding ${data.events.length} events to Firestore...`);
    const eventsCollection = db.collection("events");
    for (const event of data.events) {
      await eventsCollection.doc(event.id).set({
        ...event,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log("✅ Events seeded.");

    // Seed Alumni
    console.log(`Seeding ${data.alumni.length} alumni to Firestore...`);
    const alumniCollection = db.collection("alumni");
    for (const alumnus of data.alumni) {
      await alumniCollection.doc(alumnus.id).set({
        ...alumnus,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log("✅ Alumni seeded.");

    console.log("🎉 Database seeding completed successfully!");
  } catch (err) {
    console.error("❌ Error while seeding Firestore:", err);
    process.exit(1);
  }
}

seed();
