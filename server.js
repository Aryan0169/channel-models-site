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

function requireSuperuser(req, res, next) {
  if (req.session.user && req.session.user.isSuperuser) {
    next();
  } else {
    res.status(403).send("Access denied: Superusers only.");
  }
}


const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) {
      return res.send("Invalid credentials. <a href='/'>Try again</a>");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.send("Invalid credentials. <a href='/'>Try again</a>");
    }

    req.session.user = {
    username: user.username,
    isSuperuser: user.role === "admin",
  };


    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Internal server error");
  }
});

// Dashboard
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// View all users (Superuser only)
app.get("/admin/users", requireSuperuser, async (req, res) => {
  try {
    const result = await pool.query("SELECT username, role FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Internal server error");
  }
});

// Add a new user (Superuser only) with default password 'test123'
app.post("/admin/users/add", requireSuperuser, async (req, res) => {
  const { username, isSuperuser } = req.body;

  if (!username) {
    return res.status(400).send("Username is required.");
  }

  try {
    const defaultPassword = "test123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const role = isSuperuser ? "admin" : "user";

    // Check if the username already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).send("User already exists.");
    }

    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      [username, passwordHash, role]
    );

    res.status(201).send(`User added successfully as ${role} with default password.`);
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).send("Internal server error");
  }
});


// Delete a user (Superuser only)
app.post("/admin/users/delete", requireSuperuser, async (req, res) => {
  const { username } = req.body;
  try {
    await pool.query("DELETE FROM users WHERE username = $1", [username]);
    res.send("User deleted.");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Internal server error");
  }
});

// Update password
app.post("/update-password", isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).send("Both current and new passwords are required.");
  }

  try {
    const result = await pool.query("SELECT password_hash FROM users WHERE username = $1", [req.session.user.username]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).send("Current password is incorrect.");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE username = $2", [newHash, req.session.user.username]);

    res.send("Password updated successfully.");
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).send("Failed to update password.");
  }
});



// Models UI
app.get("/models", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "models.html"));
});

// User info
app.get("/user", isAuthenticated, (req, res) => {
  res.json({
  username: req.session.user.username,
  isSuperuser: req.session.user.isSuperuser
});
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
