import { getBlogPosts, getCategories } from "@/lib/data/blog";
import { BlogFilter } from "@/components/blog/blog-filter";
import { getReadingTime } from "@/lib/blog/reading-time";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Tag, ArrowRight } from "lucide-react";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const categoryFilter = typeof sp.category === "string" ? sp.category : undefined;

  let posts = await getBlogPosts(locale);
  const categories = await getCategories();

  if (categoryFilter) posts = posts.filter((p) => p.category === categoryFilter);

  const featuredPost = !categoryFilter && posts.length > 0 ? posts[0] : null;
  const regularPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="container mx-auto px-4 py-8 md:py-14 max-w-7xl">
      {/* Header Banner */}
      <div className="max-w-3xl mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-navy tracking-tight mb-3">
          {locale === "es"
            ? "Centro de Estilo de Vida y Reubicación"
            : "Lifestyle & Relocation Hub"}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          {locale === "es"
            ? "Todo lo que necesitas saber sobre invertir, comprar propiedades y vivir en el Pacífico Sur de Costa Rica."
            : "Everything you need to know about investing, purchasing property, and living in Costa Rica's breathtaking Southern Zone."}
        </p>
      </div>

      <BlogFilter categories={categories} />

      {posts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <p className="text-lg font-semibold text-slate-700 mb-2">
            {locale === "es" ? "No se encontraron artículos" : "No articles found"}
          </p>
          <p className="text-sm text-slate-500">
            {locale === "es"
              ? "Prueba a seleccionar otra categoría."
              : "Try selecting a different category filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Spotlight Hero Article */}
          {featuredPost && (
            <Link
              href={`/${locale}/blog/${featuredPost.slug}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {featuredPost.featuredImage && (
                  <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[280px] lg:min-h-[380px] bg-slate-900 overflow-hidden">
                    <Image
                      src={featuredPost.featuredImage}
                      alt={featuredPost.title}
                      fill
                      priority
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                )}
                <div
                  className={`${
                    featuredPost.featuredImage ? "lg:col-span-5" : "lg:col-span-12"
                  } p-6 sm:p-8 md:p-10 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-navy text-white">
                        <Tag className="w-3 h-3" />
                        {featuredPost.category}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy mb-3 group-hover:text-brand-burgundy transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="text-slate-600 text-sm sm:text-base mb-6 line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">By {featuredPost.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getReadingTime(featuredPost.content)} min
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-navy group-hover:text-brand-burgundy group-hover:translate-x-1 transition-all">
                      {locale === "es" ? "Leer Guía" : "Read Guide"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => {
              const readingTime = getReadingTime(post.content);
              return (
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  key={post.id}
                  className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200/80 hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  {post.featuredImage ? (
                    <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-navy/90 text-white backdrop-blur-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-brand-navy to-brand-navy-light p-6 flex flex-col justify-end">
                      <span className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
                        {post.category}
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <article className="flex flex-col flex-1 p-6">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {post.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {readingTime}m
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-burgundy transition-colors leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">By {post.author}</span>
                      <span className="font-bold text-brand-navy group-hover:text-brand-burgundy flex items-center gap-1">
                        {locale === "es" ? "Leer más" : "Read more"} &rarr;
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
