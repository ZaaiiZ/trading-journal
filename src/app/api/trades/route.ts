import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/api-auth";

export async function GET() {
  const result = await getApiUserId();
  if (result instanceof NextResponse) return result;
  const userId = result;

  const trades = await prisma.trade.findMany({
    where: { account: { userId } },
    include: { account: { include: { strategy: true } } },
    orderBy: { entryDate: "desc" },
  });
  return NextResponse.json(trades);
}

export async function POST(request: Request) {
  const result = await getApiUserId();
  if (result instanceof NextResponse) return result;
  const userId = result;

  try {
    const body = await request.json();

    const account = await prisma.account.findUnique({ where: { id: body.accountId } });
    if (!account || account.userId !== userId) {
      return NextResponse.json({ error: "Compte non trouvé" }, { status: 404 });
    }

    const trade = await prisma.trade.create({
      data: {
        accountId: body.accountId,
        asset: body.asset,
        direction: body.direction || "LONG",
        entryDate: new Date(body.entryDate),
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        entryPrice: body.entryPrice,
        exitPrice: body.exitPrice ?? null,
        stopLoss: body.stopLoss,
        takeProfit: body.takeProfit,
        riskPercent: body.riskPercent ?? 1,
        lotSize: body.lotSize ?? null,
        pnlAmount: body.pnlAmount ?? null,
        pnlPercent: body.pnlPercent ?? null,
        screenshotUrl: body.screenshotUrl ?? null,
        respectPlan: body.respectPlan ?? null,
        notes: body.notes ?? null,
        rrTarget: body.rrTarget,
        status: body.status || "OPEN",
      },
    });
    return NextResponse.json(trade, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
