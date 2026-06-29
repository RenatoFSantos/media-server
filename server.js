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

app.use(express.json({ limit: "10mb" }));

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

app.post("/upload/avatar", (req, res) => {
  // Caso 1: upload normal via arquivo
  upload.single("file")(req, res, async function (err) {
    if (err) {
      console.error("Erro no upload:", err);
      return res.status(400).json({ error: err.message });
    }

    if (req.file) {
      const imageUrl = `${BASE_URL}/avatars/${req.file.filename}`;
      return res.json({ url: imageUrl });
    }

    // Caso 2: upload via Base64
    try {
      const base64Image = req.body.image;

      if (!base64Image) {
        return res.status(400).json({
          error: "Envie um arquivo no campo file ou uma imagem base64 no campo image"
        });
      }

      // Remove prefixo caso venha assim: data:image/png;base64,...
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const buffer = Buffer.from(cleanBase64, "base64");

      const filename = `${uuidv4()}.png`;
      const filePath = path.join(uploadDir, filename);

      await fs.promises.writeFile(filePath, buffer);

      const imageUrl = `${BASE_URL}/avatars/${filename}`;

      return res.json({
        url: imageUrl
      });

    } catch (error) {
      console.error("Erro ao salvar base64:", error);
      return res.status(500).json({
        error: "Erro ao salvar imagem base64"
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Media server running on port ${PORT}`);
});