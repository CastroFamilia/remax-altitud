import { BlogPost } from "@/types/blog";

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "moving-to-perez-zeledon-logistics",
    title: "Moving to Pérez Zeledón: The Ultimate Logistics Guide",
    excerpt:
      "Everything you need to know about the logistics of relocating to the heart of the Southern Zone.",
    content: "Pérez Zeledón is the fastest-growing hub...",
    category: "Logistics",
    location: "Pérez Zeledón",
    author: "Local Expert",
    date: "2026-06-01",
    featuredImage: "/images/blog/pz-logistics.jpg",
  },
  {
    id: "2",
    slug: "dominical-beach-lifestyle",
    title: "The Dominical Beach Lifestyle",
    excerpt: "Embrace the pura vida lifestyle on the Pacific coast.",
    content: "Dominical offers world-class surfing...",
    category: "Lifestyle",
    location: "Dominical",
    author: "Beach Guide",
    date: "2026-06-02",
    featuredImage: "/images/blog/dominical-beach.jpg",
  },
];

export async function getBlogPosts(): Promise<BlogPost[]> {
  return MOCK_BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return MOCK_BLOG_POSTS.find((post) => post.slug === slug);
}

export async function getCategories(): Promise<string[]> {
  return Array.from(new Set(MOCK_BLOG_POSTS.map((p) => p.category)));
}

export async function getLocations(): Promise<string[]> {
  return Array.from(new Set(MOCK_BLOG_POSTS.map((p) => p.location)));
}
