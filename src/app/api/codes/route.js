import { connectDB } from "@/app/lib/db";
import CodeFile from "@/app/lib/models/CodeFile";
import { requireAuth } from "@/app/lib/auth";

// GET /api/codes - list files for the current user
// Query params:
//   ?folderId=root    → root-level files (folderId = null)
//   ?folderId=<id>    → files inside a specific folder
//   (no folderId)     → all files (legacy behaviour)
export const GET = requireAuth(async (userId, request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const folderIdParam = searchParams.get("folderId");

    const query = { userId };
    if (folderIdParam === "root") {
      query.folderId = null;
    } else if (folderIdParam) {
      query.folderId = folderIdParam;
    }

    const files = await CodeFile.find(query, "question language updatedAt folderId")
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json(files);
  } catch (err) {
    console.error("GET /api/codes error:", err);
    return Response.json({ error: "Failed to fetch files" }, { status: 500 });
  }
});


export const POST = requireAuth(async (userId, request) => {
  try {
    await connectDB();
    const { question, language, code, input, folderId } = await request.json();

    if (!question?.trim()) {
      return Response.json({ error: "Question name is required" }, { status: 400 });
    }

    const file = await CodeFile.create({
      question: question.trim(),
      language: language || "java",
      code: code || "",
      input: input || "",
      userId,
      folderId: folderId || null,
    });

    return Response.json(file.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/codes error:", err);
    return Response.json({ error: "Failed to create file" }, { status: 500 });
  }
});
