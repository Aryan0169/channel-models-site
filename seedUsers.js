const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seedUsers() {
  const users = [
    { username: "Akash", role: "admin" },
    { username: "Aryan", role: "admin" },
    { username: "Isha", role: "user" },
    { username: "guest", role: "user" },
  ];

  const password = "test123"; // Common password for now
  const passwordHash = await bcrypt.hash(password, 10);

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [user.username, passwordHash, user.role]
    );
  }

  console.log("✅ Users seeded.");
  await pool.end();
}

seedUsers().catch((err) => console.error("❌ Error seeding users:", err));
