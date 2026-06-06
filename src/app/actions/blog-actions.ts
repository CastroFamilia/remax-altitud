"use server";

import { db } from "@/lib/db/client";
import { blogPosts, NewBlogPostRow } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createBlogPost(data: NewBlogPostRow) {
  try {
    const [newPost] = await db.insert(blogPosts).values(data).returning();
    revalidatePath("/[locale]/blog", "layout");
    revalidatePath("/[locale]/admin/blog", "layout");
    return { success: true, post: newPost };
  } catch (error: unknown) {
    console.error("Failed to create blog post:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateBlogPost(id: string, data: Partial<NewBlogPostRow>) {
  try {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    revalidatePath("/[locale]/blog", "layout");
    revalidatePath("/[locale]/admin/blog", "layout");
    return { success: true, post: updatedPost };
  } catch (error: unknown) {
    console.error("Failed to update blog post:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    revalidatePath("/[locale]/blog", "layout");
    revalidatePath("/[locale]/admin/blog", "layout");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete blog post:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
