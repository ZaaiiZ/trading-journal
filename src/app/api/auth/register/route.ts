import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mot de passe trop court (min 6)" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    await prisma.strategy.create({
      data: {
        name: "Long Mom",
        description: "Swing trading sur zones psychologiques",
        userId: user.id,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
