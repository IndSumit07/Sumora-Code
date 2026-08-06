import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://MainSumitHoon:MainSumitHoon@sumora-ai-cluster-01.jqqjemq.mongodb.net/?appName=sumora-ai-cluster-01";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const email = process.argv[2] || "admin@sumora.com";
  const password = process.argv[3] || "admin123";

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`User already exists: ${email}`);
    console.log("Try logging in with this email.");
  } else {
    await User.create({ email: email.toLowerCase(), password });
    console.log(`✅ Created user: ${email} / ${password}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
