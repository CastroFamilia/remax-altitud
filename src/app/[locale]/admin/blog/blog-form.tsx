"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost, updateBlogPost } from "@/app/actions/blog-actions";
import { BlogPostRow } from "@/lib/db/schema";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BlogForm({ post, locale }: { post?: BlogPostRow; locale: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      slug: formData.get("slug") as string,
      titleEn: formData.get("titleEn") as string,
      titleEs: formData.get("titleEs") as string,
      excerptEn: formData.get("excerptEn") as string,
      excerptEs: formData.get("excerptEs") as string,
      contentEn: formData.get("contentEn") as string,
      contentEs: formData.get("contentEs") as string,
      category: formData.get("category") as string,
      location: formData.get("location") as string,
      author: formData.get("author") as string,
      featuredImage: formData.get("featuredImage") as string,
      publishedAt: formData.get("isPublished") === "on" ? new Date() : null,
    };

    let result;
    if (post) {
      result = await updateBlogPost(post.id, data);
    } else {
      result = await createBlogPost(data);
    }

    if (result.success) {
      router.push(`/${locale}/admin/blog`);
      router.refresh();
    } else {
      setError(result.error || "An unknown error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
            <input
              required
              name="slug"
              defaultValue={post?.slug}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="e.g. moving-to-costa-rica"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title (English)</label>
            <input
              required
              name="titleEn"
              defaultValue={post?.titleEn}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Excerpt (English)
            </label>
            <textarea
              required
              name="excerptEn"
              defaultValue={post?.excerptEn}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Content (English) [Markdown Supported]
            </label>
            <textarea
              required
              name="contentEn"
              defaultValue={post?.contentEn}
              rows={15}
              className="w-full font-mono text-sm bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <input
                required
                name="category"
                defaultValue={post?.category}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
              <input
                required
                name="location"
                defaultValue={post?.location}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Author</label>
              <input
                required
                name="author"
                defaultValue={post?.author || "RE/MAX Altitud"}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Featured Image URL
              </label>
              <input
                name="featuredImage"
                defaultValue={post?.featuredImage || ""}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="block text-sm font-medium text-slate-300 mb-1">Title (Spanish)</label>
            <input
              required
              name="titleEs"
              defaultValue={post?.titleEs}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Excerpt (Spanish)
            </label>
            <textarea
              required
              name="excerptEs"
              defaultValue={post?.excerptEs}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Content (Spanish) [Markdown Supported]
            </label>
            <textarea
              required
              name="contentEs"
              defaultValue={post?.contentEs}
              rows={10}
              className="w-full font-mono text-sm bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              defaultChecked={!!post?.publishedAt}
              className="w-5 h-5 rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-900"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-slate-200">
              Publish Post Instantly
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-800">
        <Link
          href={`/${locale}/admin/blog`}
          className="px-6 py-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : "Save Post"}
        </button>
      </div>
    </form>
  );
}
