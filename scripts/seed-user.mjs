/**
 * Seed script — creates a user in MongoDB.
 *
 * Usage:
 *   node scripts/seed-user.mjs <email> <password>
 *
 * Reads MONGO_URI from .env.local automatically via dotenv.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

// ── Load .env.local manually (no dotenv dependency needed) ────────────────
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("⚠  Could not read .env.local — make sure MONGO_URI is set.");
  }
}

loadEnv();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not defined. Add it to .env.local.");
  process.exit(1);
}

// ── Minimal User schema ───────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ── Main ──────────────────────────────────────────────────────────────────
async function seed() {
  const email    = (process.argv[2] || "").trim();
  const password = (process.argv[3] || "").trim();

  if (!email || !password) {
    console.error("Usage: node scripts/seed-user.mjs <email> <password>");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✓  Connected to MongoDB");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`ℹ  User already exists: ${email}`);
  } else {
    await User.create({ email: email.toLowerCase(), password });
    console.log(`✅  Created user: ${email}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
