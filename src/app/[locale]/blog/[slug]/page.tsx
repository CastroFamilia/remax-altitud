import { getBlogPostBySlug } from "@/lib/data/blog";
import { notFound } from "next/navigation";
import { FeaturedPropertiesWidget } from "@/components/blog/featured-properties-widget";
import ReactMarkdown from "react-markdown";

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
  };

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{post.title}</h1>
        <div className="flex gap-4 text-sm text-slate-500">
          <span>By {post.author}</span>
          <span>{post.date}</span>
          <span>{post.location}</span>
        </div>
      </header>
      <div className="prose prose-lg max-w-none text-slate-700">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      <FeaturedPropertiesWidget location={post.location} locale={locale} />
    </article>
  );
}
