import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const accounts = await prisma.account.findMany({
    where: { status: "active" },
  });

  const trades = await prisma.trade.findMany({
    where: {
      status: { not: "OPEN" },
      account: { status: "active" },
    },
    orderBy: { entryDate: "asc" },
  });

  const totalCapital = accounts.reduce((s, a) => s + a.capital, 0);
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnlAmount ?? 0), 0);
  const wins = trades.filter((t) => (t.pnlAmount ?? 0) > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  const equityCurve = trades.reduce<{ date: string; equity: number }[]>(
    (acc, trade) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].equity : totalCapital;
      acc.push({
        date: new Date(trade.exitDate ?? trade.entryDate).toISOString().slice(0, 10),
        equity: prev + (trade.pnlAmount ?? 0),
      });
      return acc;
    },
    []
  );

  return NextResponse.json({
    totalCapital,
    currentCapital: totalCapital + totalPnl,
    totalPnl,
    totalTrades: trades.length,
    wins,
    winRate,
    equityCurve,
    accountCount: accounts.length,
  });
}
