import mongoose from "mongoose";
import { connectDB } from "@/app/lib/db";
import Folder from "@/app/lib/models/Folder";
import CodeFile from "@/app/lib/models/CodeFile";
import { requireAuth } from "@/app/lib/auth";

// GET /api/folders - list folders for the current user
// Query params:
//   ?parentId=root          → top-level folders (parentId = null)
//   ?parentId=<id>          → children of that folder
//   (no parentId)           → all folders (legacy behaviour)
//   &withCount=1            → include fileCount per folder
export const GET = requireAuth(async (userId, request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get("parentId");
    const withCount = searchParams.get("withCount") === "1";

    const query = { userId };
    if (parentIdParam === "root") {
      query.parentId = null;
    } else if (parentIdParam) {
      query.parentId = parentIdParam;
    }

    const folders = await Folder.find(query).sort({ name: 1 }).lean();

    if (withCount) {
      const folderIds = folders.map((f) => f._id);
      const counts = await CodeFile.aggregate([
        { $match: { folderId: { $in: folderIds }, userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$folderId", count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
      const foldersWithCount = folders.map((f) => ({
        ...f,
        fileCount: countMap[String(f._id)] ?? 0,
      }));
      return Response.json(foldersWithCount);
    }

    return Response.json(folders);
  } catch (err) {
    console.error("GET /api/folders error:", err);
    return Response.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
});

// POST /api/folders - create a new folder
export const POST = requireAuth(async (userId, request) => {
  try {
    await connectDB();
    const { name, parentId } = await request.json();

    if (!name?.trim()) {
      return Response.json({ error: "Folder name is required" }, { status: 400 });
    }

    const folder = await Folder.create({
      name: name.trim(),
      userId,
      parentId: parentId || null,
    });

    return Response.json(folder.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/folders error:", err);
    return Response.json({ error: "Failed to create folder" }, { status: 500 });
  }
});
