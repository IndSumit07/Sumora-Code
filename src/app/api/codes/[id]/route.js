import { connectDB } from "@/app/lib/db";
import CodeFile from "@/app/lib/models/CodeFile";
import { requireAuth } from "@/app/lib/auth";

export const GET = requireAuth(async (userId, _request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const file = await CodeFile.findOne({ _id: id, userId }).lean();
    if (!file) return Response.json({ error: "File not found" }, { status: 404 });
    return Response.json(file);
  } catch (err) {
    console.error("GET /api/codes/[id] error:", err);
    return Response.json({ error: "Failed to fetch file" }, { status: 500 });
  }
});

export const PUT = requireAuth(async (userId, request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const file = await CodeFile.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true, runValidators: true }
    ).lean();
    if (!file) return Response.json({ error: "File not found" }, { status: 404 });
    return Response.json(file);
  } catch (err) {
    console.error("PUT /api/codes/[id] error:", err);
    return Response.json({ error: "Failed to update file" }, { status: 500 });
  }
});

export const DELETE = requireAuth(async (userId, _request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    await CodeFile.findOneAndDelete({ _id: id, userId });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/codes/[id] error:", err);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
});
