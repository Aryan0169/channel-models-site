const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const multer = require("multer");
const upload = multer({ dest: "/tmp/" });
const { v4: uuidv4 } = require("uuid");

const bucket = require("./gcs");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Needed for JSON body parsing
app.use(express.static(path.join(__dirname, "public")));

const commonHash = "$2b$10$fZ9fqFsySFL/.45WwxRtLO3XtNZxJnXNX/qqwfUgZWcAdTDHWYWP6";

const users = {
  Akash: { username: "Akash", passwordHash: commonHash },
  Aryan: { username: "Aryan", passwordHash: commonHash },
  Isha: { username: "Isha", passwordHash: commonHash },
  guest: { username: "guest", passwordHash: commonHash },
};

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false,
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/");
}

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    req.session.user = username;
    res.redirect("/dashboard");
  } else {
    res.send("Invalid credentials. <a href='/'>Try again</a>");
  }
});

// Dashboard
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Models UI
app.get("/models", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "models.html"));
});

// User info
app.get("/user", isAuthenticated, (req, res) => {
  res.json({ username: req.session.user });
});

// ✅ NEW: Generate Signed URL for direct upload
app.post("/api/get-signed-url", isAuthenticated, async (req, res) => {
  const { modelName, fileName, contentType } = req.body;

  try {
    const destination = `${modelName}/${fileName}`;
    const file = bucket.file(destination);
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType || "application/octet-stream",
    });
~
    res.json({ url });
  } catch (err) {
    console.error("Signed URL error:", err);
    res.status(500).json({ error: "Failed to get signed URL" });
  }
});


// ✅ List all models from GCS
app.get("/api/models", isAuthenticated, async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    const models = {};

    files.forEach((file) => {
      const [folder, fileName] = file.name.split("/", 2);
      if (!models[folder]) models[folder] = [];
      if (fileName) models[folder].push(file.name);
    });

    const response = Object.entries(models).map(([folder, files]) => ({
      name: folder.replace(/_/g, " "),
      dir: folder,
      description: "Stored on GCS",
      files: files.map((file) => file.split("/")[1]),
    }));

    res.json(response);
  } catch (err) {
    console.error("Error listing models:", err);
    res.status(500).send("Failed to list models.");
  }
});

// ✅ Download individual file from GCS
app.get("/api/models/:folder/:file", isAuthenticated, async (req, res) => {
  const { folder, file } = req.params;
  const remoteFile = bucket.file(`${folder}/${file}`);

  try {
    const [exists] = await remoteFile.exists();
    if (!exists) return res.status(404).send("File not found");

    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    remoteFile.createReadStream().pipe(res);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Failed to download file.");
  }
});

// ✅ Delete a model folder and its files from GCS
app.delete("/api/models/:folder", isAuthenticated, async (req, res) => {
  const { folder } = req.params;

  try {
    const [files] = await bucket.getFiles({ prefix: `${folder}/` });

    if (files.length === 0) {
      return res.status(404).send("No files found in this model folder.");
    }

    await Promise.all(files.map((file) => file.delete()));
    res.status(200).send("Model folder deleted successfully.");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Failed to delete model.");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});

module.exports = app;
