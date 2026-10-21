import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trade = await prisma.trade.findUnique({
    where: { id },
    include: { account: true },
  });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trade);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const trade = await prisma.trade.update({
    where: { id },
    data: {
      asset: body.asset,
      direction: body.direction,
      entryDate: body.entryDate ? new Date(body.entryDate) : undefined,
      exitDate: body.exitDate ? new Date(body.exitDate) : undefined,
      entryPrice: body.entryPrice,
      exitPrice: body.exitPrice,
      stopLoss: body.stopLoss,
      takeProfit: body.takeProfit,
      riskPercent: body.riskPercent,
      lotSize: body.lotSize,
      pnlAmount: body.pnlAmount,
      pnlPercent: body.pnlPercent,
      screenshotUrl: body.screenshotUrl,
      respectPlan: body.respectPlan,
      notes: body.notes,
      rrTarget: body.rrTarget,
      status: body.status,
    },
  });
  return NextResponse.json(trade);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
