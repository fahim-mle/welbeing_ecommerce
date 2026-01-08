import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Categories
  const categories = ['Supports', 'Braces', 'Supplements', 'Equipment', 'Therapy'];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Category for ${name}` },
    });
  }

  // Seed Tags
  const goals = ['Joint Pain', 'Sleep Support', 'Mobility', 'Recovery'];
  const needs = ['Vegan', 'Gluten-Free', 'Adjustable', 'Latex-Free'];

  for (const name of goals) {
    await prisma.wellbeingTag.create({
      data: { name, type: 'GOAL' },
    });
  }

  for (const name of needs) {
    await prisma.wellbeingTag.create({
      data: { name, type: 'NEED' },
    });
  }

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
