import { getBlogPosts, getCategories, getLocations } from "@/lib/data/blog";
import { BlogFilter } from "@/components/blog/blog-filter";
import Link from "next/link";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const categoryFilter = typeof sp.category === "string" ? sp.category : undefined;
  const locationFilter = typeof sp.location === "string" ? sp.location : undefined;

  let posts = await getBlogPosts(locale);
  const categories = await getCategories();
  const locations = await getLocations();

  if (categoryFilter) posts = posts.filter((p) => p.category === categoryFilter);
  if (locationFilter) posts = posts.filter((p) => p.location === locationFilter);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Lifestyle and Relocation Hub</h1>
      <p className="text-lg text-gray-600 max-w-3xl mb-8">
        Discover everything you need to know about moving to and living in Costa Rica&apos;s
        Southern Zone.
      </p>

      <BlogFilter categories={categories} locations={locations} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link href={`/${locale}/blog/${post.slug}`} key={post.id} className="group block h-full">
            <article className="flex flex-col h-full bg-white rounded-xl shadow border p-6 hover:shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
              <div className="mt-auto text-xs text-gray-500">
                {post.location} &bull; {post.category}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
