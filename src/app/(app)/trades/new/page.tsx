"use client";

import { useState, useEffect } from "react";
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

export default function NewTradePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [accountId, setAccountId] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [riskPercent, setRiskPercent] = useState("1");
  const [direction, setDirection] = useState("LONG");

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: Account[]) => {
        setAccounts(data);
        if (data.length > 0 && !accountId) setAccountId(data[0].id);
      });
  }, []);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currSym = selectedAccount?.currency === "USD" ? "$" : "€";
  const capital = selectedAccount?.capital ?? 10000;

  const riskAmount =
    riskPercent ? (capital * parseFloat(riskPercent)) / 100 : null;

  const pnlEstimate =
    exitPrice && entryPrice && stopLoss && riskPercent
      ? (() => {
          const entry = parseFloat(entryPrice);
          const exit = parseFloat(exitPrice);
          const sl = parseFloat(stopLoss);
          const slDistance = Math.abs(entry - sl);
          if (slDistance === 0) return null;
          const riskAmt = (capital * parseFloat(riskPercent)) / 100;
          const pnl =
            (direction === "LONG" ? 1 : -1) *
            (exit - entry) *
            (riskAmt / slDistance);
          return pnl;
        })()
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      let screenshotUrl: string | null = null;
      const file = formData.get("screenshot") as File | null;
      if (file && file.size > 0) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          screenshotUrl = url;
        }
      }

      const entry = parseFloat(formData.get("entryPrice") as string);
      const exitRaw = (formData.get("exitPrice") as string)?.trim();
      const exitParsed = exitRaw ? parseFloat(exitRaw) : NaN;
      const exit = !isNaN(exitParsed) && exitParsed > 0 ? exitParsed : null;
      const sl = parseFloat(formData.get("stopLoss") as string);
      const tp = parseFloat(formData.get("takeProfit") as string);
      const risk = parseFloat(formData.get("riskPercent") as string);
      const dir = formData.get("direction") as string;
      const rr = parseFloat(formData.get("rrTarget") as string);

      const hasExit = exit != null && !isNaN(exit);
      const slDistance = Math.abs(entry - sl);
      const riskAmt = (capital * risk) / 100;

      let pnlAmount: number | null = null;
      if (hasExit && slDistance > 0) {
        pnlAmount =
          (dir === "LONG" ? 1 : -1) * (exit - entry) * (riskAmt / slDistance);
      }
      const pnlPercent =
        pnlAmount != null ? (pnlAmount / capital) * 100 : null;
      const status = hasExit ? (pnlAmount! >= 0 ? "WON" : "LOST") : "OPEN";

      const body = {
        accountId: accountId || accounts[0]?.id,
        asset: formData.get("asset"),
        direction: dir,
        entryDate: formData.get("entryDate"),
        exitDate: formData.get("exitDate") || null,
        entryPrice: entry,
        exitPrice: hasExit ? exit : null,
        stopLoss: sl,
        takeProfit: tp,
        riskPercent: risk,
        lotSize: null,
        rrTarget: rr,
        pnlAmount,
        pnlPercent,
        status,
        notes: formData.get("notes") || null,
        screenshotUrl,
        respectPlan: null,
      };

      const res = await fetch("/api/trades", {
        method: "POST",
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

      router.push("/journal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Nouveau Trade</h1>
        <Link
          href="/journal"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          &larr; Retour au journal
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
            <label htmlFor="accountId" className={labelClass}>
              Compte
            </label>
            <select
              id="accountId"
              name="accountId"
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
            <label htmlFor="asset" className={labelClass}>
              Asset
            </label>
            <input
              id="asset"
              name="asset"
              type="text"
              required
              placeholder="ex: DAX, CADJPY, AAPL"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="direction" className={labelClass}>
              Direction
            </label>
            <select
              id="direction"
              name="direction"
              className={inputClass}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryDate" className={labelClass}>
              Date d&apos;entree
            </label>
            <input
              id="entryDate"
              name="entryDate"
              type="datetime-local"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exitDate" className={labelClass}>
              Date de sortie (optionnel)
            </label>
            <input
              id="exitDate"
              name="exitDate"
              type="datetime-local"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryPrice" className={labelClass}>
              Prix d&apos;entree
            </label>
            <input
              id="entryPrice"
              name="entryPrice"
              type="number"
              step="any"
              required
              placeholder="0.00"
              className={inputClass}
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="exitPrice" className={labelClass}>
              Prix de sortie (optionnel)
            </label>
            <input
              id="exitPrice"
              name="exitPrice"
              type="number"
              step="any"
              placeholder="0.00"
              className={inputClass}
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="stopLoss" className={labelClass}>
              Stop Loss
            </label>
            <input
              id="stopLoss"
              name="stopLoss"
              type="number"
              step="any"
              required
              placeholder="0.00"
              className={inputClass}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="takeProfit" className={labelClass}>
              Take Profit
            </label>
            <input
              id="takeProfit"
              name="takeProfit"
              type="number"
              step="any"
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="riskPercent" className={labelClass}>
              Risque (%)
            </label>
            <input
              id="riskPercent"
              name="riskPercent"
              type="number"
              step="any"
              min="0.01"
              max="100"
              required
              placeholder="1"
              className={inputClass}
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
            />
            {riskAmount != null && (
              <p className="text-xs text-zinc-500 mt-1">
                = {riskAmount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}{currSym} risque
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rrTarget" className={labelClass}>
              RR Target
            </label>
            <input
              id="rrTarget"
              name="rrTarget"
              type="number"
              step="any"
              required
              placeholder="2.0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>PnL estime</label>
            <div className="flex h-[42px] items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3">
              {pnlEstimate != null ? (
                <span
                  className={`font-medium tabular-nums ${pnlEstimate >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {pnlEstimate >= 0 ? "+" : ""}
                  {pnlEstimate.toFixed(2)}{currSym}
                </span>
              ) : (
                <span className="text-zinc-500">&mdash;</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Notes sur le trade..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="screenshot" className={labelClass}>
            Screenshot
          </label>
          <input
            id="screenshot"
            name="screenshot"
            type="file"
            accept="image/*"
            className="w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-600"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Enregistrement..." : "Enregistrer le trade"}
          </button>
          <Link
            href="/journal"
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
