import { cookies } from "next/headers";
import { createHash } from "crypto";

/**
 * Helper to enforce admin authorization in server actions and pages.
 */
export async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const adminPassword =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");
  const expectedSession = adminPassword
    ? createHash("sha256").update(adminPassword).digest("hex")
    : undefined;
  const isAuthenticated = !!expectedSession && session === expectedSession;
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }
}
