"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  broker: string;
  capital: number;
  currency: string;
  type: string;
  strategy: { name: string };
}

interface Trade {
  id: string;
  accountId: string;
  asset: string;
  direction: string;
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number;
  lotSize: number | null;
  pnlAmount: number | null;
  pnlPercent: number | null;
  screenshotUrl: string | null;
  respectPlan: boolean | null;
  notes: string | null;
  rrTarget: number;
  status: string;
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [accountId, setAccountId] = useState("");
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState("LONG");
  const [entryDate, setEntryDate] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [rrTarget, setRrTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("OPEN");

  useEffect(() => {
    Promise.all([
      fetch(`/api/trades/${id}`).then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([tradeData, accountsData]: [Trade, Account[]]) => {
      setTrade(tradeData);
      setAccounts(accountsData);
      setAccountId(tradeData.accountId);
      setAsset(tradeData.asset);
      setDirection(tradeData.direction);
      setEntryDate(toLocalDatetime(tradeData.entryDate));
      setExitDate(tradeData.exitDate ? toLocalDatetime(tradeData.exitDate) : "");
      setEntryPrice(String(tradeData.entryPrice));
      setExitPrice(tradeData.exitPrice != null ? String(tradeData.exitPrice) : "");
      setStopLoss(String(tradeData.stopLoss));
      setTakeProfit(String(tradeData.takeProfit));
      setRiskPercent(String(tradeData.riskPercent));
      setRrTarget(String(tradeData.rrTarget));
      setNotes(tradeData.notes ?? "");
      setStatus(tradeData.status);
    });
  }, [id]);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currSym = selectedAccount?.currency === "USD" ? "$" : "€";
  const capital = selectedAccount?.capital ?? 10000;

  const riskAmount = riskPercent
    ? (capital * parseFloat(riskPercent)) / 100
    : null;

  const pnlEstimate =
    exitPrice && entryPrice && stopLoss && riskPercent
      ? (() => {
          const entry = parseFloat(entryPrice);
          const exit = parseFloat(exitPrice);
          const sl = parseFloat(stopLoss);
          const slDistance = Math.abs(entry - sl);
          if (slDistance === 0) return null;
          const riskAmt = (capital * parseFloat(riskPercent)) / 100;
          return (direction === "LONG" ? 1 : -1) * (exit - entry) * (riskAmt / slDistance);
        })()
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const entry = parseFloat(entryPrice);
      const exitRaw = exitPrice.trim();
      const exitParsed = exitRaw ? parseFloat(exitRaw) : NaN;
      const exit = !isNaN(exitParsed) && exitParsed > 0 ? exitParsed : null;
      const sl = parseFloat(stopLoss);
      const tp = parseFloat(takeProfit);
      const risk = parseFloat(riskPercent);
      const rr = parseFloat(rrTarget);

      const hasExit = exit != null;
      const slDistance = Math.abs(entry - sl);
      const riskAmt = (capital * risk) / 100;

      let pnlAmount: number | null = null;
      if (hasExit && slDistance > 0) {
        pnlAmount =
          (direction === "LONG" ? 1 : -1) * (exit - entry) * (riskAmt / slDistance);
      }
      const pnlPct = pnlAmount != null ? (pnlAmount / capital) * 100 : null;

      let computedStatus = status;
      if (hasExit && status === "OPEN") {
        computedStatus = pnlAmount! >= 0 ? "WON" : "LOST";
      }
      if (!hasExit) {
        computedStatus = "OPEN";
      }

      const body = {
        accountId,
        asset,
        direction,
        entryDate,
        exitDate: exitDate || null,
        entryPrice: entry,
        exitPrice: exit,
        stopLoss: sl,
        takeProfit: tp,
        riskPercent: risk,
        lotSize: trade?.lotSize ?? null,
        rrTarget: rr,
        pnlAmount,
        pnlPercent: pnlPct,
        status: computedStatus,
        notes: notes || null,
        screenshotUrl: trade?.screenshotUrl ?? null,
        respectPlan: trade?.respectPlan ?? null,
      };

      const res = await fetch(`/api/trades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `Erreur serveur (${res.status})`;
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {
          const text = await res.text().catch(() => "");
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      router.push(`/trades/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSubmitting(false);
    }
  }

  if (!trade) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Chargement...
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Modifier {trade.asset}</h1>
        <Link
          href={`/trades/${id}`}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          &larr; Retour
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6"
      >
        {accounts.length > 0 && (
          <div>
            <label htmlFor="accountId" className={labelClass}>Compte</label>
            <select
              id="accountId"
              className={inputClass}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.broker}) &mdash; {a.capital.toLocaleString("fr-FR")}{a.currency === "USD" ? "$" : "€"} {a.type === "funded" ? "Funded" : "Challenge"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="asset" className={labelClass}>Asset</label>
            <input id="asset" type="text" required className={inputClass} value={asset} onChange={(e) => setAsset(e.target.value)} />
          </div>
          <div>
            <label htmlFor="direction" className={labelClass}>Direction</label>
            <select id="direction" className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryDate" className={labelClass}>Date d&apos;entree</label>
            <input id="entryDate" type="datetime-local" required className={inputClass} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="exitDate" className={labelClass}>Date de sortie</label>
            <input id="exitDate" type="datetime-local" className={inputClass} value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryPrice" className={labelClass}>Prix d&apos;entree</label>
            <input id="entryPrice" type="number" step="any" required className={inputClass} value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
          </div>
          <div>
            <label htmlFor="exitPrice" className={labelClass}>Prix de sortie</label>
            <input id="exitPrice" type="number" step="any" className={inputClass} value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="stopLoss" className={labelClass}>Stop Loss</label>
            <input id="stopLoss" type="number" step="any" required className={inputClass} value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
          </div>
          <div>
            <label htmlFor="takeProfit" className={labelClass}>Take Profit</label>
            <input id="takeProfit" type="number" step="any" required className={inputClass} value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
          </div>
          <div>
            <label htmlFor="riskPercent" className={labelClass}>Risque (%)</label>
            <input id="riskPercent" type="number" step="any" min="0.01" max="100" required className={inputClass} value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
            {riskAmount != null && (
              <p className="text-xs text-zinc-500 mt-1">
                = {riskAmount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}{currSym} risque
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rrTarget" className={labelClass}>RR Target</label>
            <input id="rrTarget" type="number" step="any" required className={inputClass} value={rrTarget} onChange={(e) => setRrTarget(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>PnL estime</label>
            <div className="flex h-[42px] items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3">
              {pnlEstimate != null ? (
                <span className={`font-medium tabular-nums ${pnlEstimate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pnlEstimate >= 0 ? "+" : ""}{pnlEstimate.toFixed(2)}{currSym}
                </span>
              ) : (
                <span className="text-zinc-500">&mdash;</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>Notes</label>
          <textarea id="notes" rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <Link
            href={`/trades/${id}`}
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
