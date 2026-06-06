import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { BlogPost } from "@/types/blog";
import { eq, desc, isNotNull, and, lte } from "drizzle-orm";

function mapRowToBlogPost(row: typeof blogPosts.$inferSelect, locale: string): BlogPost {
  const isEn = locale === "en";
  return {
    id: row.id,
    slug: row.slug,
    title: isEn ? row.titleEn : row.titleEs,
    excerpt: isEn ? row.excerptEn : row.excerptEs,
    content: isEn ? row.contentEn : row.contentEs,
    category: row.category,
    location: row.location,
    author: row.author,
    date: row.publishedAt
      ? row.publishedAt.toISOString().split("T")[0]
      : row.createdAt.toISOString().split("T")[0],
    featuredImage: row.featuredImage || "/images/blog/placeholder.jpg",
  };
}

export async function getBlogPosts(locale: string = "en"): Promise<BlogPost[]> {
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(and(isNotNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date())))
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map((r) => mapRowToBlogPost(r, locale));
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return [];
  }
}

export async function getBlogPostBySlug(
  slug: string,
  locale: string = "en",
): Promise<BlogPost | undefined> {
  try {
    const rows = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (rows.length === 0) return undefined;
    return mapRowToBlogPost(rows[0], locale);
  } catch (error) {
    console.error("Failed to fetch blog post by slug:", error);
    return undefined;
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(and(isNotNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date())));
    return rows.map((r) => r.category);
  } catch (error) {
    return [];
  }
}

export async function getLocations(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ location: blogPosts.location })
      .from(blogPosts)
      .where(and(isNotNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date())));
    return rows.map((r) => r.location);
  } catch (error) {
    return [];
  }
}
