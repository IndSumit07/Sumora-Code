import { connectDB } from "@/app/lib/db";
import CodeFile from "@/app/lib/models/CodeFile";

export async function GET(_, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const file = await CodeFile.findById(id).lean();
    if (!file) return Response.json({ error: "File not found" }, { status: 404 });
    return Response.json(file);
  } catch (err) {
    console.error("GET /api/codes/[id] error:", err);
    return Response.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const file = await CodeFile.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();
    if (!file) return Response.json({ error: "File not found" }, { status: 404 });
    return Response.json(file);
  } catch (err) {
    console.error("PUT /api/codes/[id] error:", err);
    return Response.json({ error: "Failed to update file" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    await CodeFile.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/codes/[id] error:", err);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
