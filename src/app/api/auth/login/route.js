import { connectDB } from "@/app/lib/db";
import User from "@/app/lib/models/User";
import { setAuthCookie } from "@/app/lib/auth";

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.password !== password) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setAuthCookie(user._id.toString());
    return Response.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
