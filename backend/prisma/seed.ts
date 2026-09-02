import { PrismaClient, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const DEMO_USER_EMAIL = 'demo@foodsearch.io';

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_USER_EMAIL,
      subscriptionStatus: SubscriptionStatus.INACTIVE,
    },
  });

  console.log(`[AEGIS SEED] Demo user initialized: ${user.email} (ID: ${user.id}, Status: ${user.subscriptionStatus})`);
}

main()
  .catch((error: unknown) => {
    console.error('[AEGIS SEED ERROR]', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });