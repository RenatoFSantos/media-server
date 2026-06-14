const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || "https://media-server.midilabs.com.br";

app.use(cors());

const uploadDir = path.join(__dirname, "uploads", "avatars");

fs.mkdirSync(uploadDir, { recursive: true });

app.use("/avatars", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas imagens são permitidas."));
    }
    cb(null, true);
  }
});

app.post("/upload/avatar", upload.single("file"), (req, res) => {
  const imageUrl = `${BASE_URL}/avatars/${req.file.filename}`;

  return res.json({
    url: imageUrl
  });
});

app.listen(PORT, () => {
  console.log(`Media server running on port ${PORT}`);
});