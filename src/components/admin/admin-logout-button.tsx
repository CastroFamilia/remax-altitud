"use client";

import React, { useTransition } from "react";
import { logoutAdmin } from "@/app/actions/admin-sync-actions";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 text-left cursor-pointer"
    >
      <LogOut className="w-5 h-5 text-red-500" />
      <span>{isPending ? "Logging out..." : "Log Out"}</span>
    </button>
  );
}
