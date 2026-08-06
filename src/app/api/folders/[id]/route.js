import { connectDB } from "@/app/lib/db";
import Folder from "@/app/lib/models/Folder";
import CodeFile from "@/app/lib/models/CodeFile";
import { requireAuth } from "@/app/lib/auth";

// PUT /api/folders/[id] - rename a folder or move it
export const PUT = requireAuth(async (userId, request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    if (body.name !== undefined) folder.name = body.name.trim() || folder.name;
    if (body.parentId !== undefined) folder.parentId = body.parentId || null;

    await folder.save();
    return Response.json(folder.toObject());
  } catch (err) {
    console.error("PUT /api/folders/[id] error:", err);
    return Response.json({ error: "Failed to update folder" }, { status: 500 });
  }
});

// DELETE /api/folders/[id] - delete folder and move its files to root
export const DELETE = requireAuth(async (userId, request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    // Recursively collect all descendant folder IDs
    const allFolderIds = await getAllDescendantIds(id, userId);
    allFolderIds.push(id);

    // Move all files in these folders to root (folderId = null)
    await CodeFile.updateMany(
      { folderId: { $in: allFolderIds }, userId },
      { $set: { folderId: null } }
    );

    // Delete all folders
    await Folder.deleteMany({ _id: { $in: allFolderIds }, userId });

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/folders/[id] error:", err);
    return Response.json({ error: "Failed to delete folder" }, { status: 500 });
  }
});

async function getAllDescendantIds(parentId, userId) {
  const children = await Folder.find({ parentId, userId }, "_id").lean();
  const ids = [];
  for (const child of children) {
    ids.push(String(child._id));
    const nested = await getAllDescendantIds(String(child._id), userId);
    ids.push(...nested);
  }
  return ids;
}
