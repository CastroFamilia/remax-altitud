"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost, updateBlogPost } from "@/app/actions/blog-actions";
import { BlogPostRow } from "@/lib/db/schema";
import {
  Save,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  ImageIcon,
  Eye,
  Edit3,
  Columns,
  Image as LucideImage,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { normalizeImageUrl } from "@/lib/blog/image-utils";

export function BlogForm({ post, locale }: { post?: BlogPostRow; locale: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Controlled states for rich features
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage || "");
  const [imageValid, setImageValid] = useState<boolean | null>(null);

  const [contentEn, setContentEn] = useState(post?.contentEn || "");
  const [contentEs, setContentEs] = useState(post?.contentEs || "");

  const [viewModeEn, setViewModeEn] = useState<"edit" | "preview" | "split">("edit");
  const [viewModeEs, setViewModeEs] = useState<"edit" | "preview" | "split">("edit");

  const textareaEnRef = useRef<HTMLTextAreaElement>(null);
  const textareaEsRef = useRef<HTMLTextAreaElement>(null);

  // Markdown insertion helper
  const insertMarkdown = (
    lang: "en" | "es",
    before: string,
    after: string = "",
    defaultText: string = "",
  ) => {
    const textarea = lang === "en" ? textareaEnRef.current : textareaEsRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = lang === "en" ? contentEn : contentEs;
    const selected = currentVal.substring(start, end) || defaultText;

    const updated =
      currentVal.substring(0, start) + before + selected + after + currentVal.substring(end);

    if (lang === "en") {
      setContentEn(updated);
    } else {
      setContentEs(updated);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

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
      contentEn: contentEn,
      contentEs: contentEs,
      category: formData.get("category") as string,
      location: formData.get("location") as string,
      author: formData.get("author") as string,
      featuredImage: normalizeImageUrl(featuredImage.trim()),
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

  const renderToolbar = (lang: "en" | "es") => (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-800/90 border border-slate-700 rounded-t-lg text-slate-300">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "**", "**", "Bold text")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Bold (**text**)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "*", "*", "Italic text")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Italic (*text*)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "\n## ", "\n", "Section Title")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Heading 2 (## Title)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "\n### ", "\n", "Subheading Title")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Heading 3 (### Title)"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "\n- ", "", "List item")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Bullet List (- item)"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "\n1. ", "", "Numbered item")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Numbered List (1. item)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "\n> ", "\n", "Key highlight or quote")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Quote Block (> quote)"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown(lang, "[", "](https://example.com)", "Link text")}
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Link ([text](url))"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            insertMarkdown(lang, "![", "](https://image-url.com/photo.jpg)", "Image description")
          }
          className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
          title="Image (![alt](url))"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-700 text-xs">
        <button
          type="button"
          onClick={() => (lang === "en" ? setViewModeEn("edit") : setViewModeEs("edit"))}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            (lang === "en" ? viewModeEn : viewModeEs) === "edit"
              ? "bg-red-600 text-white font-medium"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => (lang === "en" ? setViewModeEn("split") : setViewModeEs("split"))}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            (lang === "en" ? viewModeEn : viewModeEs) === "split"
              ? "bg-red-600 text-white font-medium"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          Split
        </button>
        <button
          type="button"
          onClick={() => (lang === "en" ? setViewModeEn("preview") : setViewModeEs("preview"))}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            (lang === "en" ? viewModeEn : viewModeEs) === "preview"
              ? "bg-red-600 text-white font-medium"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Global Article Settings */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <LucideImage className="w-4 h-4 text-red-500" />
          General Metadata & Media
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              URL Slug (Unique identifier)
            </label>
            <input
              required
              name="slug"
              defaultValue={post?.slug}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. moving-to-costa-rica-guide"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Author Name
            </label>
            <input
              required
              name="author"
              defaultValue={post?.author || "RE/MAX Altitud"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. RE/MAX Altitud Editorial Team"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <input
              required
              name="category"
              defaultValue={post?.category || "Relocation Guide"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. Real Estate, Legal & Taxes, Area Guides"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Related Property Zone{" "}
              <span className="text-slate-500 font-normal normal-case">
                (Links bottom property widget)
              </span>
            </label>
            <input
              name="location"
              defaultValue={post?.location || "Dominical"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              placeholder="e.g. Dominical, Uvita, Ojochal, Perez Zeledon"
            />
          </div>
        </div>

        {/* Featured Image with Live Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Featured Image URL{" "}
            <span className="text-slate-400 font-normal normal-case">
              (Direct link or Google Drive link)
            </span>
          </label>
          <input
            name="featuredImage"
            value={featuredImage}
            onChange={(e) => {
              setFeaturedImage(e.target.value);
              setImageValid(null);
            }}
            placeholder="https://drive.google.com/file/d/... or direct image URL"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Supports direct image links and{" "}
            <span className="text-amber-300 font-medium">Google Drive sharing links</span>. (For
            Google Drive, make sure the file permission is set to{" "}
            <em>&ldquo;Anyone with the link can view&rdquo;</em>).
          </p>

          {/* Live Thumbnail Preview */}
          {featuredImage.trim() && (
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-36 h-20 bg-slate-900 rounded-md overflow-hidden shrink-0 border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizeImageUrl(featuredImage.trim())}
                  alt="Featured Preview"
                  className="w-full h-full object-cover"
                  onLoad={() => setImageValid(true)}
                  onError={() => setImageValid(false)}
                />
              </div>
              <div className="text-xs space-y-1">
                {imageValid === true && (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Image verified &amp; ready! (Automatically converted to direct stream).
                    </span>
                  </div>
                )}
                {imageValid === false && (
                  <div className="flex items-center gap-1.5 text-red-400 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Unable to load image. If using Google Drive, check that access is set to
                      &ldquo;Anyone with the link&rdquo;.
                    </span>
                  </div>
                )}
                <p className="text-slate-400">
                  This image will be displayed on the post header and listing cards.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* English Version */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          🇺🇸 English Content
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Title (English)
          </label>
          <input
            required
            name="titleEn"
            defaultValue={post?.titleEn}
            placeholder="e.g. The Complete Guide to Buying Property in Costa Rica"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Short Excerpt (English)
          </label>
          <textarea
            required
            name="excerptEn"
            defaultValue={post?.excerptEn}
            rows={2}
            placeholder="Brief 1-2 sentence summary displayed on card previews..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Main Content (English)
          </label>
          {renderToolbar("en")}

          <div className="grid grid-cols-1 gap-4">
            {viewModeEn === "edit" && (
              <textarea
                ref={textareaEnRef}
                required
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                rows={16}
                placeholder="Write your article in Markdown. Use headings (##), bold (**text**), bullet points (- item), and line breaks..."
                className="w-full font-mono text-sm bg-slate-950 border border-t-0 border-slate-700 rounded-b-lg p-4 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none leading-relaxed"
              />
            )}

            {viewModeEn === "preview" && (
              <div className="w-full border border-t-0 border-slate-700 rounded-b-lg p-6 bg-white text-slate-900 min-h-[380px] max-h-[600px] overflow-y-auto">
                {contentEn.trim() ? (
                  <MarkdownContent content={contentEn} />
                ) : (
                  <p className="text-slate-400 italic">No content typed yet.</p>
                )}
              </div>
            )}

            {viewModeEn === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 border border-t-0 border-slate-700 rounded-b-lg overflow-hidden bg-slate-950">
                <textarea
                  ref={textareaEnRef}
                  required
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  rows={16}
                  placeholder="Write your article in Markdown..."
                  className="w-full font-mono text-sm bg-slate-950 p-4 text-white focus:outline-none leading-relaxed border-b lg:border-b-0 lg:border-r border-slate-800"
                />
                <div className="p-5 bg-white text-slate-900 max-h-[450px] overflow-y-auto">
                  <MarkdownContent content={contentEn} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spanish Version */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          🇨🇷 Spanish Content (Español)
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Title (Spanish)
          </label>
          <input
            required
            name="titleEs"
            defaultValue={post?.titleEs}
            placeholder="e.g. Guía Completa para Comprar Propiedades en Costa Rica"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Short Excerpt (Spanish)
          </label>
          <textarea
            required
            name="excerptEs"
            defaultValue={post?.excerptEs}
            rows={2}
            placeholder="Resumen breve para tarjetas..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Main Content (Spanish)
          </label>
          {renderToolbar("es")}

          <div className="grid grid-cols-1 gap-4">
            {viewModeEs === "edit" && (
              <textarea
                ref={textareaEsRef}
                required
                value={contentEs}
                onChange={(e) => setContentEs(e.target.value)}
                rows={16}
                placeholder="Escribe el artículo en Markdown..."
                className="w-full font-mono text-sm bg-slate-950 border border-t-0 border-slate-700 rounded-b-lg p-4 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none leading-relaxed"
              />
            )}

            {viewModeEs === "preview" && (
              <div className="w-full border border-t-0 border-slate-700 rounded-b-lg p-6 bg-white text-slate-900 min-h-[380px] max-h-[600px] overflow-y-auto">
                {contentEs.trim() ? (
                  <MarkdownContent content={contentEs} />
                ) : (
                  <p className="text-slate-400 italic">No hay contenido escrito todavía.</p>
                )}
              </div>
            )}

            {viewModeEs === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 border border-t-0 border-slate-700 rounded-b-lg overflow-hidden bg-slate-950">
                <textarea
                  ref={textareaEsRef}
                  required
                  value={contentEs}
                  onChange={(e) => setContentEs(e.target.value)}
                  rows={16}
                  placeholder="Escribe el artículo en Markdown..."
                  className="w-full font-mono text-sm bg-slate-950 p-4 text-white focus:outline-none leading-relaxed border-b lg:border-b-0 lg:border-r border-slate-800"
                />
                <div className="p-5 bg-white text-slate-900 max-h-[450px] overflow-y-auto">
                  <MarkdownContent content={contentEs} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Toggle & Save Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            defaultChecked={!!post?.publishedAt}
            className="w-5 h-5 rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-900 cursor-pointer"
          />
          <label
            htmlFor="isPublished"
            className="text-sm font-medium text-slate-200 cursor-pointer"
          >
            Publish Post Immediately
          </label>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href={`/${locale}/admin/blog`}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-7 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-red-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : post ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
