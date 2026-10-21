import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const accounts = await prisma.account.findMany({
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
  const body = await request.json();

  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 400 });
  }

  let strategy = await prisma.strategy.findFirst({
    where: { userId: user.id },
  });
  if (!strategy) {
    strategy = await prisma.strategy.create({
      data: {
        name: "Long Mom",
        description: "Swing trading sur zones psychologiques",
        userId: user.id,
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
      userId: user.id,
      strategyId: body.strategyId || strategy.id,
    },
    include: { strategy: true },
  });

  return NextResponse.json(account, { status: 201 });
}
