/**
 * Virtual Crowd Simulator: Generate 500 fake transactions and 200 users
 * distributed over 24 hours for realistic charts.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const COUNTRIES = ["SA", "ID", "VN", "PH", "MY", "EG", "AE", "IN", "US", "RO", "DE", "GB"];

const GIFT_TYPES = ["heart", "fire", "rocket", "rose", "diamond"] as const;
const GIFT_AMOUNTS: Record<string, number> = {
  heart: 5,
  fire: 50,
  rocket: 500,
  rose: 25,
  diamond: 100,
};

function randomId(): string {
  return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function randomCountry(): string {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
}

function randomGiftType(): string {
  return GIFT_TYPES[Math.floor(Math.random() * GIFT_TYPES.length)];
}

function randomAmount(giftType: string): number {
  return GIFT_AMOUNTS[giftType] ?? 5;
}

async function main() {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const runId = Date.now().toString(36);

  console.log("Creating 200 seed users...");
  const userIds: string[] = [];
  for (let i = 0; i < 200; i++) {
    const id = `seed_${runId}_${i}`;
    userIds.push(id);
  }

  await prisma.user.createMany({
    data: userIds.map((id, i) => ({
      id,
      name: `SeedUser${runId}_${i}`,
      email: `seed_${runId}_${i}@neonlive.seed`,
      coins: 100 + Math.floor(Math.random() * 500),
      country: randomCountry(),
    })),
    skipDuplicates: true,
  });

  console.log("Creating 500 transactions over 24h...");
  const transactions: {
    id: string;
    senderId: string;
    receiverId: string;
    amount: number;
    type: string;
    giftType: string;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < 500; i++) {
    const senderIdx = Math.floor(Math.random() * userIds.length);
    let receiverIdx = Math.floor(Math.random() * userIds.length);
    while (receiverIdx === senderIdx) {
      receiverIdx = Math.floor(Math.random() * userIds.length);
    }
    const giftType = randomGiftType();
    const amount = randomAmount(giftType);
    const offsetMs = Math.random() * oneDayMs;
    const createdAt = new Date(now - oneDayMs + offsetMs);

    transactions.push({
      id: randomId(),
      senderId: userIds[senderIdx],
      receiverId: userIds[receiverIdx],
      amount,
      type: "GIFT",
      giftType,
      createdAt,
    });
  }

  await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      id: t.id,
      senderId: t.senderId,
      receiverId: t.receiverId,
      amount: t.amount,
      type: t.type,
      giftType: t.giftType,
      createdAt: t.createdAt,
    })),
    skipDuplicates: true,
  });

  console.log("Done. 200 users, 500 transactions seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
