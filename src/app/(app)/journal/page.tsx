import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import Link from "next/link";

const statusColor: Record<string, string> = {
  OPEN: "bg-yellow-500/20 text-yellow-400",
  WON: "bg-emerald-500/20 text-emerald-400",
  LOST: "bg-red-500/20 text-red-400",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function JournalPage() {
  const userId = await requireUserId();

  const trades = await prisma.trade.findMany({
    where: { account: { userId } },
    orderBy: { entryDate: "desc" },
    include: { account: { include: { strategy: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Journal de Trading</h1>
        <Link
          href="/trades/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          + Nouveau Trade
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-12 text-center">
          <p className="text-zinc-400">Aucun trade enregistré.</p>
          <Link
            href="/trades/new"
            className="mt-4 inline-block text-emerald-400 hover:text-emerald-300"
          >
            Ajouter votre premier trade
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Direction</th>
                <th className="px-4 py-3 font-medium">Entrée</th>
                <th className="px-4 py-3 font-medium">Sortie</th>
                <th className="px-4 py-3 font-medium">SL</th>
                <th className="px-4 py-3 font-medium">TP</th>
                <th className="px-4 py-3 font-medium">Risque</th>
                <th className="px-4 py-3 font-medium">RR</th>
                <th className="px-4 py-3 font-medium">PnL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className="bg-zinc-900/50 hover:bg-zinc-800/70 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/trades/${trade.id}`}
                      className="text-zinc-300 hover:text-white"
                    >
                      {formatDate(trade.entryDate)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    <Link href={`/trades/${trade.id}`}>{trade.asset}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-400">{trade.direction}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">
                    {trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">
                    {trade.exitPrice?.toFixed(2) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">
                    {trade.stopLoss.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">
                    {trade.takeProfit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">
                    {trade.riskPercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">
                    {trade.rrTarget.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {trade.pnlAmount != null ? (
                      <span
                        className={
                          trade.pnlAmount >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {trade.pnlAmount >= 0 ? "+" : ""}
                        {trade.pnlAmount.toFixed(2)}€
                      </span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[trade.status] ?? "bg-zinc-700 text-zinc-300"}`}
                    >
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/trades/${trade.id}/edit`}
                      className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                      Modifier
                    </Link>
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
