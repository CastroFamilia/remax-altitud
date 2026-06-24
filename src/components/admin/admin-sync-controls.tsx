"use client";

import React, { useState } from "react";
import { Play, Unlock, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { unlockSyncProcess, triggerManualSync } from "@/app/actions/admin-sync-actions";
import { useRouter } from "next/navigation";

interface AdminSyncControlsProps {
  locale: string;
}

export function AdminSyncControls({ locale: _locale }: AdminSyncControlsProps) {
  const router = useRouter();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setMessage(null);
    try {
      const res = await unlockSyncProcess();
      if (res.success) {
        setMessage({
          type: "success",
          text: `¡Procesos desbloqueados! (${res.count} registros actualizados)`,
        });
        router.refresh();
      } else {
        setMessage({ type: "error", text: "Error al intentar desbloquear los procesos." });
      }
    } catch (_err) {
      setMessage({ type: "error", text: "Ocurrió un error inesperado." });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      const res = await triggerManualSync();
      if (res.success) {
        setMessage({ type: "success", text: "¡Sincronización iniciada en segundo plano!" });
        // Refresh the UI after a brief delay to show the new 'running' log
        setTimeout(() => router.refresh(), 2000);
      } else {
        setMessage({ type: "error", text: res.error || "Error al iniciar sincronización." });
      }
    } catch (_err) {
      setMessage({ type: "error", text: "Ocurrió un error inesperado." });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="text-sm text-slate-300">
        <h3 className="text-white font-bold mb-1">Controles de Sincronización</h3>
        <p>
          Utiliza estos controles si el proceso automático se queda atascado o si necesitas forzar
          una actualización inmediata de las propiedades.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
        <button
          onClick={handleUnlock}
          disabled={isUnlocking || isSyncing}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
        >
          {isUnlocking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
          <span>Desbloquear</span>
        </button>

        <button
          onClick={handleSync}
          disabled={isUnlocking || isSyncing}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Forzar Sync</span>
        </button>
      </div>

      {message && (
        <div
          className={`absolute top-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
