"use server";

import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateSettingAction(key: string, value: string) {
  try {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });

    // Revalidate the layout so the new setting takes effect immediately
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Failed to update setting:", error);
    return { success: false, error: "Failed to update setting" };
  }
}

export async function getSettingAction(key: string) {
  try {
    const result = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });
    return { success: true, value: result?.value || null };
  } catch (error) {
    console.error("Failed to get setting:", error);
    return { success: false, error: "Failed to get setting" };
  }
}
