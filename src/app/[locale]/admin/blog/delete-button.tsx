"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteBlogPost } from "@/app/actions/blog-actions";
import { useRouter } from "next/navigation";

export function DeleteBlogButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    setIsDeleting(true);
    await deleteBlogPost(id);
    setIsDeleting(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
