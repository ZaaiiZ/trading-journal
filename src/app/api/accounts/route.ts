import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/api-auth";

export async function GET() {
  const result = await getApiUserId();
  if (result instanceof NextResponse) return result;
  const userId = result;

  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      strategy: true,
      _count: { select: { trades: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const accountsWithPnl = await Promise.all(
    accounts.map(async (account) => {
      const trades = await prisma.trade.findMany({
        where: { accountId: account.id, status: { not: "OPEN" } },
      });
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnlAmount ?? 0), 0);
      return { ...account, totalPnl };
    })
  );

  return NextResponse.json(accountsWithPnl);
}

export async function POST(request: Request) {
  const result = await getApiUserId();
  if (result instanceof NextResponse) return result;
  const userId = result;

  const body = await request.json();

  let strategy = await prisma.strategy.findFirst({
    where: { userId },
  });
  if (!strategy) {
    strategy = await prisma.strategy.create({
      data: {
        name: "Long Mom",
        description: "Swing trading sur zones psychologiques",
        userId,
      },
    });
  }

  const account = await prisma.account.create({
    data: {
      name: body.name,
      broker: body.broker || "FTMO",
      capital: body.capital,
      currency: body.currency || "EUR",
      type: body.type || "challenge",
      status: "active",
      userId,
      strategyId: body.strategyId || strategy.id,
    },
    include: { strategy: true },
  });

  return NextResponse.json(account, { status: 201 });
}
