"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  broker: string;
  capital: number;
  currency: string;
  type: string;
  status: string;
  totalPnl: number;
  _count: { trades: number };
  strategy: { name: string };
  createdAt: string;
}

const typeLabels: Record<string, { label: string; bg: string; text: string }> = {
  challenge: { label: "Challenge", bg: "bg-orange-500/20", text: "text-orange-400" },
  funded: { label: "Funded", bg: "bg-emerald-500/20", text: "text-emerald-400" },
};

const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Actif", bg: "bg-emerald-500/20", text: "text-emerald-400" },
  failed: { label: "Echoue", bg: "bg-red-500/20", text: "text-red-400" },
  archived: { label: "Archive", bg: "bg-zinc-500/20", text: "text-zinc-400" },
};

function currencySymbol(c: string) {
  return c === "USD" ? "$" : "€";
}

function formatMoney(amount: number, currency: string) {
  const sym = currencySymbol(currency);
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${sym}`;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [broker, setBroker] = useState("FTMO");
  const [capital, setCapital] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [type, setType] = useState("challenge");

  const loadAccounts = useCallback(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          broker,
          capital: parseFloat(capital),
          currency,
          type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      setName("");
      setBroker("FTMO");
      setCapital("");
      setCurrency("EUR");
      setType("challenge");
      setShowForm(false);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  const totalCapital = accounts
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.capital, 0);

  const totalPnl = accounts
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.totalPnl, 0);

  const activeCount = accounts.filter((a) => a.status === "active").length;

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Comptes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          {showForm ? "Annuler" : "+ Nouveau Compte"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Capital Total</p>
          <p className="text-xl font-bold text-white">
            {totalCapital.toLocaleString("fr-FR")}&euro;
          </p>
          <p className="text-xs text-zinc-500 mt-1">{activeCount} compte(s) actif(s)</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">PnL Total</p>
          <p className={`text-xl font-bold tabular-nums ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatMoney(totalPnl, "EUR")}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Capital Effectif</p>
          <p className="text-xl font-bold text-white">
            {(totalCapital + totalPnl).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}&euro;
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4"
        >
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom du compte</label>
              <input
                type="text"
                required
                placeholder="ex: FTMO Challenge 10k"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Broker / Prop Firm</label>
              <input
                type="text"
                required
                placeholder="ex: FTMO, The5ers, MFF"
                className={inputClass}
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Capital</label>
              <input
                type="number"
                step="any"
                required
                placeholder="10000"
                className={inputClass}
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Devise</label>
              <select
                className={inputClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="EUR">EUR (&euro;)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={inputClass}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="challenge">Challenge</option>
                <option value="funded">Funded</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creation..." : "Creer le compte"}
          </button>
        </form>
      )}

      {/* Accounts list */}
      {accounts.length === 0 ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-12 text-center">
          <p className="text-zinc-400">Aucun compte configure.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const tp = typeLabels[account.type] ?? typeLabels.challenge;
            const st = statusLabels[account.status] ?? statusLabels.active;
            const effectiveCapital = account.capital + account.totalPnl;

            return (
              <div
                key={account.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tp.bg} ${tp.text}`}>
                        {tp.label}
                      </span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span>{account.broker}</span>
                      <span>&middot;</span>
                      <span>{account.strategy.name}</span>
                      <span>&middot;</span>
                      <span>{account._count.trades} trade(s)</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold text-white tabular-nums">
                      {account.capital.toLocaleString("fr-FR")}{currencySymbol(account.currency)}
                    </p>
                    {account.totalPnl !== 0 && (
                      <p className={`text-sm font-medium tabular-nums ${account.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatMoney(account.totalPnl, account.currency)}
                      </p>
                    )}
                    {account.totalPnl !== 0 && (
                      <p className="text-xs text-zinc-500 tabular-nums">
                        Effectif: {effectiveCapital.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{currencySymbol(account.currency)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-zinc-600">
        <Link href="/journal" className="hover:text-zinc-400 transition-colors">
          &larr; Retour au journal
        </Link>
      </div>
    </div>
  );
}
