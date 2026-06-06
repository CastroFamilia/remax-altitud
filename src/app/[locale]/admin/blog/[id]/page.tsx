import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BlogForm } from "../blog-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);

  if (!post) {
    notFound();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <Link
          href={`/${locale}/admin/blog`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog Posts
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Post: {post.titleEn}</h1>
      </div>

      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
        <BlogForm locale={locale} post={post} />
      </div>
    </div>
  );
}
