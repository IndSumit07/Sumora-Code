import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Folder || mongoose.model("Folder", folderSchema);
