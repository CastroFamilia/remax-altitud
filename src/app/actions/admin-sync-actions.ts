"use server";

import { getSyncLogs, getSyncDashboardStats } from "@/lib/db/queries/sync-log";
import { cookies } from "next/headers";
import { createHash } from "crypto";

/**
 * Server Action for fetching sync dashboard data with pagination and filtering.
 */
export async function fetchAdminSyncDashboardData(params: {
  status?: string;
  startDateStr?: string;
  endDateStr?: string;
  page?: number;
}) {
  const status = params.status;

  // Normalize page parameter to prevent NaN or negative/zero values causing DB offset errors
  let page = typeof params.page === "number" ? params.page : parseInt(String(params.page), 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else {
    page = Math.trunc(page);
  }

  const limit = 20;
  const offset = (page - 1) * limit;

  let startDate: Date | undefined;
  if (params.startDateStr) {
    const parsed = new Date(params.startDateStr);
    // Boundary check: ensure date is valid and within reasonable years to prevent DB errors
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970 && parsed.getFullYear() <= 2100) {
      startDate = parsed;
    }
  }

  let endDate: Date | undefined;
  if (params.endDateStr) {
    const parsed = new Date(params.endDateStr);
    // Boundary check: ensure date is valid and within reasonable years to prevent DB errors
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970 && parsed.getFullYear() <= 2100) {
      parsed.setUTCHours(23, 59, 59, 999);
      endDate = parsed;
    }
  }

  // Fetch limit + 1 to determine true hasMore status
  const [logs, stats] = await Promise.all([
    getSyncLogs({
      status,
      startDate,
      endDate,
      limit: limit + 1,
      offset,
    }),
    getSyncDashboardStats(),
  ]);

  const hasMore = logs.length > limit;
  const slicedLogs = hasMore ? logs.slice(0, limit) : logs;

  return {
    logs: slicedLogs,
    stats,
    hasMore,
  };
}

/**
 * Server Action to authenticate admin using a simple cookie-based session.
 */
export async function loginAdmin(password: string): Promise<{ success: boolean }> {
  const adminPassword =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");
  if (!adminPassword) {
    console.warn(
      "WARNING: ADMIN_PASSWORD environment variable is not configured. Admin access is disabled in production.",
    );
    return { success: false };
  }
  if (password === adminPassword) {
    const cookieStore = await cookies();
    const sessionToken = createHash("sha256").update(adminPassword).digest("hex");
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
      sameSite: "strict",
    });
    return { success: true };
  }
  return { success: false };
}

/**
 * Server Action to logout admin.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}
