"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
          <p className="text-sm text-zinc-400 mt-1">Connecte-toi pour accéder à ton journal</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Pas de compte ?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
