import { db } from "../config/db.js";

// GET /api/events
export async function getEvents(req, res) {
  try {
    const { virtual } = req.query;
    const snapshot = await db.collection("events").get();
    let events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (virtual !== undefined) {
      const isVirt = virtual === "true";
      events = events.filter((e) => Boolean(e.isVirtual) === isVirt);
    }

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
}

// GET /api/events/:id
export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection("events").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
}

// POST /api/events
export async function createEvent(req, res) {
  try {
    const { title, month, day, date, location, isVirtual, imageUrl, description } = req.body;

    if (!title || !location) {
      return res.status(400).json({
        success: false,
        message: "Title and location are required fields",
      });
    }

    let finalMonth = month;
    let finalDay = day;

    if ((!finalMonth || !finalDay) && date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        finalMonth = parsed.toLocaleString("en-US", { month: "short" }).toUpperCase();
        finalDay = String(parsed.getDate()).padStart(2, "0");
      }
    }

    if (!finalMonth || !finalDay) {
      const now = new Date();
      finalMonth = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
      finalDay = String(now.getDate()).padStart(2, "0");
    }

    const newEvent = {
      title,
      month: finalMonth,
      day: finalDay,
      date: date || "",
      status: "live",
      location,
      description: description || "",
      isVirtual: Boolean(isVirtual),
      createdBy: req.user.uid,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("events").add(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { id: docRef.id, ...newEvent },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
}
