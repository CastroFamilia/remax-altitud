import { getBlogPostBySlug } from "@/lib/data/blog";
import { notFound } from "next/navigation";
import { FeaturedPropertiesWidget } from "@/components/blog/featured-properties-widget";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { getReadingTime } from "@/lib/blog/reading-time";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const readingTime = getReadingTime(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
    image: post.featuredImage || undefined,
  };

  return (
    <article className="container mx-auto px-4 py-8 md:py-14 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back to Blog Hub Navigation */}
      <div className="mb-8">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-burgundy transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{locale === "es" ? "Volver al Blog" : "Back to Lifestyle & Relocation Hub"}</span>
        </Link>
      </div>

      {/* Editorial Header */}
      <header className="mb-8 md:mb-10">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-navy text-white shadow-sm">
            <Tag className="w-3 h-3" />
            {post.category}
          </span>
        </div>

        {/* Post Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-navy tracking-tight leading-[1.15] mb-6">
          {post.title}
        </h1>

        {/* Minimal Byline */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pb-6 border-b border-brand-warm">
          <div className="flex items-center gap-2 font-semibold text-brand-navy">
            <span>By {post.author}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{post.date}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              {readingTime} {locale === "es" ? "min de lectura" : "min read"}
            </span>
          </div>
        </div>
      </header>

      {/* Featured Hero Image */}
      {post.featuredImage && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] mb-10 rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-900">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 900px, 1000px"
          />
        </div>
      )}

      {/* Lead Excerpt if available */}
      {post.excerpt && (
        <div className="mb-8 p-5 bg-brand-warm/30 rounded-xl border-l-4 border-brand-navy text-lg md:text-xl font-medium text-slate-700 leading-relaxed italic">
          {post.excerpt}
        </div>
      )}

      {/* Structured Article Body */}
      <div className="mb-14">
        <MarkdownContent content={post.content} />
      </div>

      {/* Contextual Properties Widget */}
      <div className="mt-14 pt-10 border-t border-brand-warm">
        <FeaturedPropertiesWidget location={post.location} locale={locale} />
      </div>
    </article>
  );
}
