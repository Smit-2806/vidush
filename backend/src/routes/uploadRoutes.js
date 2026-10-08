import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// POST /api/upload
// Supports multipart/form-data ('file') and JSON base64 payload ('dataUrl' or 'image')
router.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "File upload error: " + err.message,
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    let filename = "";

    if (req.file) {
      filename = req.file.filename;
    } else if (req.body && (req.body.dataUrl || req.body.image)) {
      const rawData = req.body.dataUrl || req.body.image;
      const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = ".jpg";
      let buffer;

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("png")) ext = ".png";
        else if (mime.includes("webp")) ext = ".webp";
        else if (mime.includes("gif")) ext = ".gif";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(rawData, "base64");
      }

      filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);
    } else {
      return res.status(400).json({
        success: false,
        message: "No image file or base64 data provided",
      });
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const fileUrl = `${protocol}://${host}/uploads/${filename}`;

    return res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      url: fileUrl,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload photo",
      error: error.message,
    });
  }
});

export default router;
