const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const multer = require("multer");
const upload = multer({ dest: "/tmp/" });

const app = express();

const MODELS_DIR = path.join(__dirname, "models"); // secured models folder

const commonHash = "$2b$10$fZ9fqFsySFL/.45WwxRtLO3XtNZxJnXNX/qqwfUgZWcAdTDHWYWP6";

const users = {
  Akash: { username: "Akash", passwordHash: commonHash },
  Aryan: { username: "Aryan", passwordHash: commonHash },
  Isha: { username: "Isha", passwordHash: commonHash },
  guest: { username: "guest", passwordHash: commonHash }
};

app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/");
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/models", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "models.html"));
});

app.get("/user", isAuthenticated, (req, res) => {
  res.json({ username: req.session.user });
});

app.get("/api/models", isAuthenticated, (req, res) => {
  const models = [];

  fs.readdirSync(MODELS_DIR).forEach(folder => {
    const modelPath = path.join(MODELS_DIR, folder);

    // skip if it's not a directory (e.g., .DS_Store file)
    if (!fs.lstatSync(modelPath).isDirectory()) return;

    const descPath = path.join(modelPath, "description.txt");
    let description = "No description available";

    if (fs.existsSync(descPath)) {
      description = fs.readFileSync(descPath, "utf-8").split("\n")[0];
    }

    const files = fs.readdirSync(modelPath).filter(file => file !== "description.txt");

    models.push({ name: folder.replace(/_/g, " "), dir: folder, description, files });
  });

  res.json(models);
});

app.get("/api/models/:folder/:file", isAuthenticated, (req, res) => {
  const { folder, file } = req.params;
  const filePath = path.join(MODELS_DIR, folder, file);

  if (!filePath.startsWith(MODELS_DIR)) {
    return res.status(403).send("Access denied");
  }

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.post("/upload-model", isAuthenticated, upload.array("files"), (req, res) => {
  const modelName = req.body.modelName.trim().replace(/\s+/g, "_");
  const modelDir = path.join(__dirname, "models", modelName);

  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  req.files.forEach(file => {
    const dest = path.join(modelDir, file.originalname);
    fs.renameSync(file.path, dest);
  });

  res.redirect("/models");
});

app.delete("/api/models/:folder", isAuthenticated, (req, res) => {
  const modelFolder = req.params.folder;
  const fullPath = path.join(__dirname, "models", modelFolder);

  if (fs.existsSync(fullPath)) {
    fs.rm(fullPath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error("Error deleting model:", err);
        return res.status(500).send("Failed to delete model.");
      }
      res.send(`Model "${modelFolder}" deleted successfully.`);
    });
  } else {
    res.status(404).send("Model not found.");
  }
});

module.exports = app;