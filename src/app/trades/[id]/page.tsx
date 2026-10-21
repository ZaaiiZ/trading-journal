import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteTradeButton from "./DeleteButton";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const statusLabel: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  WON: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  LOST: { bg: "bg-red-500/20", text: "text-red-400" },
};

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trade = await prisma.trade.findUnique({
    where: { id },
    include: { account: { include: { strategy: true } } },
  });

  if (!trade) notFound();

  const status = statusLabel[trade.status] ?? {
    bg: "bg-zinc-700",
    text: "text-zinc-300",
  };

  const rows: [string, string | null][] = [
    ["Asset", trade.asset],
    ["Direction", trade.direction],
    ["Date d'entrée", formatDate(trade.entryDate)],
    ["Date de sortie", trade.exitDate ? formatDate(trade.exitDate) : null],
    ["Prix d'entrée", trade.entryPrice.toFixed(2)],
    ["Prix de sortie", trade.exitPrice?.toFixed(2) ?? null],
    ["Stop Loss", trade.stopLoss.toFixed(2)],
    ["Take Profit", trade.takeProfit.toFixed(2)],
    ["Risque", `${trade.riskPercent.toFixed(2)}%`],
    ["RR Target", trade.rrTarget.toFixed(1)],
    ["Stratégie", trade.account.strategy.name],
    ["Compte", `${trade.account.name} (${trade.account.broker})`],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {trade.asset}{" "}
          <span className="text-emerald-400">{trade.direction}</span>
        </h1>
        <Link
          href="/journal"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Retour au journal
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${status.bg} ${status.text}`}
          >
            {trade.status}
          </span>
          {trade.pnlAmount != null && (
            <span
              className={`text-lg font-bold tabular-nums ${trade.pnlAmount >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {trade.pnlAmount >= 0 ? "+" : ""}
              {trade.pnlAmount.toFixed(2)}€
            </span>
          )}
          {trade.pnlPercent != null && (
            <span
              className={`text-sm tabular-nums ${trade.pnlPercent >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}
            >
              ({trade.pnlPercent >= 0 ? "+" : ""}
              {trade.pnlPercent.toFixed(2)}%)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="text-sm text-zinc-200 tabular-nums">
                {value ?? <span className="text-zinc-600">—</span>}
              </dd>
            </div>
          ))}
        </div>

        {trade.respectPlan != null && (
          <div>
            <dt className="text-xs text-zinc-500">Respect du plan</dt>
            <dd className="text-sm">
              {trade.respectPlan ? (
                <span className="text-emerald-400">Oui</span>
              ) : (
                <span className="text-red-400">Non</span>
              )}
            </dd>
          </div>
        )}

        {trade.notes && (
          <div>
            <dt className="text-xs text-zinc-500 mb-1">Notes</dt>
            <dd className="rounded-lg bg-zinc-800 p-3 text-sm text-zinc-300 whitespace-pre-wrap">
              {trade.notes}
            </dd>
          </div>
        )}

        {trade.screenshotUrl && (
          <div>
            <dt className="text-xs text-zinc-500 mb-2">Screenshot</dt>
            <img
              src={trade.screenshotUrl}
              alt={`Screenshot ${trade.asset}`}
              className="rounded-lg border border-zinc-800 max-w-full"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-zinc-800">
          <Link
            href={`/trades/${trade.id}/edit`}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 transition-colors"
          >
            Modifier
          </Link>
          <DeleteTradeButton tradeId={trade.id} />
        </div>
      </div>
    </div>
  );
}
