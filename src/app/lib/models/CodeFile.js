import mongoose from "mongoose";

const codeFileSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    language: { type: String, required: true, default: "java" },
    code: { type: String, default: "" },
    input: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CodeFile || mongoose.model("CodeFile", codeFileSchema);
