import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

interface MonthRow {
  month: number;
  year: number;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
}

export default async function MonthlyPage() {
  const userId = await requireUserId();

  const trades = await prisma.trade.findMany({
    where: { status: { not: "OPEN" }, account: { userId } },
    orderBy: { entryDate: "desc" },
  });

  const grouped = new Map<string, MonthRow>();

  for (const t of trades) {
    const d = new Date(t.entryDate);
    const month = d.getMonth();
    const year = d.getFullYear();
    const key = `${year}-${month}`;

    let row = grouped.get(key);
    if (!row) {
      row = { month, year, total: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 };
      grouped.set(key, row);
    }

    row.total++;
    if (t.status === "WON") row.wins++;
    if (t.status === "LOST") row.losses++;
    row.pnl += t.pnlAmount ?? 0;
  }

  const rows = Array.from(grouped.values())
    .map((r) => ({
      ...r,
      winRate: r.total > 0 ? (r.wins / r.total) * 100 : 0,
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month);

  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const totalTrades = rows.reduce((s, r) => s + r.total, 0);
  const totalWins = rows.reduce((s, r) => s + r.wins, 0);
  const overallWinRate =
    totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Stats Mensuelles</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Total PnL</p>
          <p
            className={`text-xl font-bold tabular-nums ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {totalPnl.toFixed(2)}€
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Trades clôturés</p>
          <p className="text-xl font-bold text-white">{totalTrades}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Win Rate global</p>
          <p className="text-xl font-bold text-white">
            {overallWinRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-12 text-center">
          <p className="text-zinc-400">
            Aucun trade clôturé pour le moment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Mois</th>
                <th className="px-4 py-3 font-medium text-right">Trades</th>
                <th className="px-4 py-3 font-medium text-right">Wins</th>
                <th className="px-4 py-3 font-medium text-right">Losses</th>
                <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                <th className="px-4 py-3 font-medium text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr
                  key={`${row.year}-${row.month}`}
                  className="bg-zinc-900/50 hover:bg-zinc-800/70 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-200">
                    {MONTH_NAMES[row.month]} {row.year}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 tabular-nums">
                    {row.wins}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 tabular-nums">
                    {row.losses}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">
                    {row.winRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span
                      className={
                        row.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      {row.pnl >= 0 ? "+" : ""}
                      {row.pnl.toFixed(2)}€
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
