import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const account = await prisma.account.update({
    where: { id },
    data: {
      name: body.name,
      broker: body.broker,
      capital: body.capital,
      currency: body.currency,
      type: body.type,
      status: body.status,
    },
    include: { strategy: true },
  });

  return NextResponse.json(account);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tradeCount = await prisma.trade.count({ where: { accountId: id } });
  if (tradeCount > 0) {
    return NextResponse.json(
      { error: `Ce compte a ${tradeCount} trade(s). Supprime-les d'abord.` },
      { status: 400 }
    );
  }

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
