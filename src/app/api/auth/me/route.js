import { getAuthUser } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import User from "@/app/lib/models/User";

export async function GET() {
  try {
    const userId = await getAuthUser();
    if (!userId) {
      return Response.json({ authenticated: false });
    }

    await connectDB();
    const user = await User.findById(userId).select("email").lean();
    if (!user) {
      return Response.json({ authenticated: false });
    }

    return Response.json({ authenticated: true, email: user.email });
  } catch {
    return Response.json({ authenticated: false });
  }
}
