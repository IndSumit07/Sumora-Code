import { connectDB } from "@/app/lib/db";
import Folder from "@/app/lib/models/Folder";
import CodeFile from "@/app/lib/models/CodeFile";
import { requireAuth } from "@/app/lib/auth";

// GET /api/folders - list all folders for the current user
export const GET = requireAuth(async (userId) => {
  try {
    await connectDB();
    const folders = await Folder.find({ userId })
      .sort({ name: 1 })
      .lean();
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
