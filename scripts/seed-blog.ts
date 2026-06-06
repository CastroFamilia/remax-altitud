import { db } from "../src/lib/db/client";
import { blogPosts } from "../src/lib/db/schema";

const MOCK_BLOG_POSTS = [
  {
    slug: "moving-to-perez-zeledon-logistics",
    titleEn: "Moving to Pérez Zeledón: The Ultimate Logistics Guide",
    titleEs: "Mudarse a Pérez Zeledón: La Guía de Logística Definitiva",
    excerptEn: "Everything you need to know about the logistics of relocating to the heart of the Southern Zone.",
    excerptEs: "Todo lo que necesitas saber sobre la logística de reubicarte en el corazón de la Zona Sur.",
    contentEn: "Pérez Zeledón is the fastest-growing hub in the Southern Zone. Whether you are shipping containers, opening a bank account, or finding schools, this guide covers it all.",
    contentEs: "Pérez Zeledón es el centro de más rápido crecimiento en la Zona Sur. Ya sea que estés enviando contenedores, abriendo una cuenta bancaria o buscando escuelas, esta guía lo cubre todo.",
    category: "Logistics",
    location: "Pérez Zeledón",
    author: "Local Expert",
    featuredImage: "/images/blog/pz-logistics.jpg",
    publishedAt: new Date(),
  },
  {
    slug: "dominical-beach-lifestyle",
    titleEn: "The Dominical Beach Lifestyle",
    titleEs: "El Estilo de Vida de Playa Dominical",
    excerptEn: "Embrace the pura vida lifestyle on the Pacific coast.",
    excerptEs: "Abraza el estilo de vida pura vida en la costa del Pacífico.",
    contentEn: "Dominical offers world-class surfing, vibrant community events, and spectacular sunsets.",
    contentEs: "Dominical ofrece surf de clase mundial, vibrantes eventos comunitarios y atardeceres espectaculares.",
    category: "Lifestyle",
    location: "Dominical",
    author: "Beach Guide",
    featuredImage: "/images/blog/dominical-beach.jpg",
    publishedAt: new Date(),
  }
];

async function seedBlogPosts() {
  console.log("Seeding blog posts...");
  try {
    for (const post of MOCK_BLOG_POSTS) {
      await db.insert(blogPosts).values(post).onConflictDoNothing({ target: blogPosts.slug });
      console.log(`Inserted: ${post.slug}`);
    }
    console.log("Seed complete.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedBlogPosts();
