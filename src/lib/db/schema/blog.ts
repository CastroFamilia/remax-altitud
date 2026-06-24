import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  titleEn: text("title_en").notNull(),
  titleEs: text("title_es").notNull(),
  excerptEn: text("excerpt_en").notNull().default(""),
  excerptEs: text("excerpt_es").notNull().default(""),
  contentEn: text("content_en").notNull().default(""),
  contentEs: text("content_es").notNull().default(""),
  category: text("category").notNull(),
  location: text("location").notNull(),
  author: text("author").notNull(),
  featuredImage: text("featured_image"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type NewBlogPostRow = typeof blogPosts.$inferInsert;
