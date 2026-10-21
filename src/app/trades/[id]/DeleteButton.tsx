"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/journal");
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Suppression..." : "Confirmer"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
    >
      Supprimer
    </button>
  );
}
