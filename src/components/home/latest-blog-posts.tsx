import { getTranslations } from "next-intl/server";
import { getBlogPosts } from "@/lib/data/blog";
import { getReadingTime } from "@/lib/blog/reading-time";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";

interface LatestBlogPostsProps {
  locale: string;
}

export async function LatestBlogPosts({ locale }: LatestBlogPostsProps) {
  const t = await getTranslations({ locale, namespace: "HomePage.latestBlogPosts" });

  let posts = await getBlogPosts(locale);
  // Show only the 3 most recent posts
  posts = posts.slice(0, 3);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section
      data-testid="latest-blog-posts"
      aria-labelledby="latest-blog-posts-heading"
      className="scroll-mt-16"
    >
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div>
          <h2
            id="latest-blog-posts-heading"
            className="text-3xl font-extrabold text-brand-navy tracking-tight sm:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-2 text-base text-text-muted max-w-2xl font-medium">{t("description")}</p>
        </div>
        <a
          href={`/${locale}/blog`}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-bold text-brand-navy underline underline-offset-4 hover:text-brand-navy/80 transition-colors md:inline-flex"
        >
          {t("viewAll")} →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const readingTime = getReadingTime(post.content);
          return (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              key={post.id}
              className="group flex flex-col h-full"
            >
              <article className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200/80 hover:-translate-y-1">
                {post.featuredImage ? (
                  <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-navy/90 text-white backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-brand-navy to-brand-navy-light p-5 flex flex-col justify-end">
                    <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                )}

                <div className="flex flex-col flex-1 p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {readingTime} min read
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-burgundy transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-navy group-hover:text-brand-burgundy">
                    <span>By {post.author}</span>
                    <span>Read Guide &rarr;</span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center md:hidden">
        <a
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-navy underline underline-offset-4 hover:text-brand-navy/80 transition-colors"
        >
          {t("viewAll")} →
        </a>
      </div>
    </section>
  );
}
