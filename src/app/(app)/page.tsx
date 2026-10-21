import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import StatCard from "@/components/StatCard";
import EquityCurve from "@/components/EquityCurve";
import Link from "next/link";

function currSym(c: string) {
  return c === "USD" ? "$" : "€";
}

export default async function Dashboard() {
  const userId = await requireUserId();

  const accounts = await prisma.account.findMany({
    where: { status: "active", userId },
    include: { strategy: true },
  });

  const allTrades = await prisma.trade.findMany({
    where: {
      account: { status: "active", userId },
    },
    orderBy: { entryDate: "desc" },
  });

  const closedTrades = allTrades.filter((t) => t.status !== "OPEN");
  const openTrades = allTrades.filter((t) => t.status === "OPEN");
  const recentTrades = allTrades.slice(0, 5);

  const totalCapital = accounts.reduce((s, a) => s + a.capital, 0);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnlAmount ?? 0), 0);
  const riskUnit = totalCapital * 0.01;
  const totalR = riskUnit > 0 ? totalPnl / riskUnit : 0;
  const currentCapital = totalCapital + totalPnl;
  const wins = closedTrades.filter((t) => (t.pnlAmount ?? 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  const sortedClosed = [...closedTrades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );
  const equityData = sortedClosed.reduce<{ date: string; equity: number }[]>(
    (acc, trade) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].equity : totalCapital;
      acc.push({
        date: new Date(trade.exitDate ?? trade.entryDate).toLocaleDateString("fr-FR", {
          month: "short",
          day: "numeric",
        }),
        equity: prev + (trade.pnlAmount ?? 0),
      });
      return acc;
    },
    []
  );

  const fmt = (n: number) =>
    `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€`;

  const accountsByPnl = await Promise.all(
    accounts.map(async (a) => {
      const trades = await prisma.trade.findMany({
        where: { accountId: a.id, status: { not: "OPEN" }, account: { userId } },
      });
      const pnl = trades.reduce((s, t) => s + (t.pnlAmount ?? 0), 0);
      return { ...a, pnl, tradeCount: trades.length };
    })
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {accounts.length} compte(s) actif(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/accounts"
            className="border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Comptes
          </Link>
          <Link
            href="/trades/new"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nouveau Trade
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Capital Total" value={fmt(currentCapital)} trend={totalPnl >= 0 ? "positive" : "negative"} />
        <StatCard title="Total R" value={`${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R`} subtitle={`${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}`} trend={totalR >= 0 ? "positive" : "negative"} />
        <StatCard title="Win Rate" value={`${winRate.toFixed(1)}%`} trend={winRate >= 50 ? "positive" : "negative"} />
        <StatCard
          title="Trades"
          value={`${closedTrades.length}`}
          suffix={openTrades.length > 0 ? `(${openTrades.length} open)` : undefined}
        />
      </div>

      {/* Per-account breakdown */}
      {accounts.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accountsByPnl.map((a) => (
            <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{a.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${a.type === "funded" ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}`}>
                    {a.type === "funded" ? "Funded" : "Challenge"}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-white tabular-nums">
                  {a.capital.toLocaleString("fr-FR")}{currSym(a.currency)}
                </span>
                {a.pnl !== 0 && (
                  <span className={`text-sm font-medium tabular-nums ${a.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {a.pnl >= 0 ? "+" : ""}{a.pnl.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{currSym(a.currency)}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">{a.tradeCount} trade(s) &middot; {a.broker}</p>
            </div>
          ))}
        </div>
      )}

      <EquityCurve data={equityData} startingCapital={totalCapital} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">Trades Recents</h3>
          <Link href="/journal" className="text-xs text-emerald-500 hover:text-emerald-400">
            Voir tout
          </Link>
        </div>
        {recentTrades.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            Aucun trade enregistre.{" "}
            <Link href="/trades/new" className="text-emerald-500 hover:underline">
              Ajouter un trade
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs">
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Asset</th>
                <th className="text-left p-3 font-medium">Compte</th>
                <th className="text-right p-3 font-medium">Entry</th>
                <th className="text-right p-3 font-medium">PnL</th>
                <th className="text-right p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => {
                const acc = accounts.find((a) => a.id === trade.accountId);
                return (
                  <tr key={trade.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                    <td className="p-3 text-zinc-300">
                      {new Date(trade.entryDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3 font-medium">
                      <Link href={`/trades/${trade.id}`} className="hover:text-emerald-400">
                        {trade.asset}
                      </Link>
                    </td>
                    <td className="p-3 text-zinc-400 text-xs">{acc?.name ?? "—"}</td>
                    <td className="p-3 text-right text-zinc-300 tabular-nums">{trade.entryPrice.toFixed(2)}</td>
                    <td
                      className={`p-3 text-right font-medium tabular-nums ${
                        (trade.pnlAmount ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {trade.pnlAmount != null
                        ? `${trade.pnlAmount >= 0 ? "+" : ""}${trade.pnlAmount.toFixed(2)}${currSym(acc?.currency ?? "EUR")}`
                        : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          trade.status === "WON"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : trade.status === "LOST"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
