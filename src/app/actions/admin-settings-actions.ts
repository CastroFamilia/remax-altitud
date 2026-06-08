"use server";

import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema/settings";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export async function updateSettingAction(key: string, value: string) {
  try {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });

    // Invalidate settings cache and revalidate layout
    revalidateTag("settings");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Failed to update setting:", error);
    return { success: false, error: "Failed to update setting" };
  }
}

export async function getSettingAction(key: string) {
  try {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return { success: true, value: result[0]?.value || null };
  } catch (error) {
    console.error("Failed to get setting:", error);
    return { success: false, error: "Failed to get setting" };
  }
}
