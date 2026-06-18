import { connectDB } from "@/app/lib/db";
import CodeFile from "@/app/lib/models/CodeFile";

export async function GET() {
  try {
    await connectDB();
    const files = await CodeFile.find({}, "question language updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json(files);
  } catch (err) {
    console.error("GET /api/codes error:", err);
    return Response.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { question, language, code, input } = await request.json();

    if (!question?.trim()) {
      return Response.json({ error: "Question name is required" }, { status: 400 });
    }

    const file = await CodeFile.create({
      question: question.trim(),
      language: language || "java",
      code: code || "",
      input: input || "",
    });

    return Response.json(file.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/codes error:", err);
    return Response.json({ error: "Failed to create file" }, { status: 500 });
  }
}
