import { getTranslations } from "next-intl/server";
import { getBlogPosts } from "@/lib/data/blog";
import Link from "next/link";

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
        {posts.map((post) => (
          <Link href={`/${locale}/blog/${post.slug}`} key={post.id} className="group block h-full">
            <article className="flex flex-col h-full bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-text-secondary text-sm mb-4 line-clamp-3">{post.excerpt}</p>
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-text-muted font-medium">
                <span>{post.location}</span>
                <span>{post.category}</span>
              </div>
            </article>
          </Link>
        ))}
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
