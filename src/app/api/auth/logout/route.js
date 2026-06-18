import { clearAuthCookie } from "@/app/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return Response.json({ ok: true });
}
