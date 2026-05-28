"use server";

import { getSyncLogs, getSyncDashboardStats } from "@/lib/db/queries/sync-log";
import { cookies } from "next/headers";

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
  const page = params.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  let startDate: Date | undefined;
  if (params.startDateStr) {
    const parsed = new Date(params.startDateStr);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed;
    }
  }

  let endDate: Date | undefined;
  if (params.endDateStr) {
    const parsed = new Date(params.endDateStr);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(23, 59, 59, 999);
      endDate = parsed;
    }
  }

  const [logs, stats] = await Promise.all([
    getSyncLogs({
      status,
      startDate,
      endDate,
      limit,
      offset,
    }),
    getSyncDashboardStats(),
  ]);

  return {
    logs,
    stats,
  };
}

/**
 * Server Action to authenticate admin using a simple cookie-based session.
 */
export async function loginAdmin(password: string): Promise<{ success: boolean }> {
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");
  if (!adminPassword) {
    console.warn("WARNING: ADMIN_PASSWORD environment variable is not configured. Admin access is disabled in production.");
    return { success: false };
  }
  if (password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
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
