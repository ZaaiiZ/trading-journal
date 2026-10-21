import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "adrien@trading.com" },
    update: {},
    create: {
      email: "adrien@trading.com",
      name: "Adrien",
      passwordHash,
    },
  });

  const strategy = await prisma.strategy.upsert({
    where: { id: "default-strategy" },
    update: {},
    create: {
      id: "default-strategy",
      name: "Long Mom",
      description:
        "Swing trading sur zones psychologiques — break de resistance avec SMA 100/150, RR 1.5-5",
      userId: user.id,
    },
  });

  const existing = await prisma.account.findFirst();
  if (!existing) {
    await prisma.account.create({
      data: {
        name: "FTMO Challenge 10k",
        broker: "FTMO",
        capital: 10000,
        currency: "EUR",
        type: "challenge",
        userId: user.id,
        strategyId: strategy.id,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
