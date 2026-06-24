CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title_en" text NOT NULL,
	"title_es" text NOT NULL,
	"excerpt_en" text DEFAULT '' NOT NULL,
	"excerpt_es" text DEFAULT '' NOT NULL,
	"content_en" text DEFAULT '' NOT NULL,
	"content_es" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"location" text NOT NULL,
	"author" text NOT NULL,
	"featured_image" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
