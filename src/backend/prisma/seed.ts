import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categories
  const categories = [
    { name: 'Supports', description: 'Supports for joints and muscles' },
    { name: 'Braces', description: 'Medical grade braces' },
    { name: 'Supplements', description: 'Vitamins and minerals' },
    { name: 'Equipment', description: 'Home exercise equipment' },
    { name: 'Therapy', description: 'Therapeutic devices' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Tags
  const tags = [
    { name: 'Joint Pain', type: 'GOAL' },
    { name: 'Sleep Support', type: 'GOAL' },
    { name: 'Mobility', type: 'GOAL' },
    { name: 'Recovery', type: 'GOAL' },
    { name: 'Vegan', type: 'NEED' },
    { name: 'Gluten-Free', type: 'NEED' },
    { name: 'Adjustable', type: 'NEED' },
    { name: 'Latex-Free', type: 'NEED' }
  ];

  for (const tag of tags) {
    const existing = await prisma.wellbeingTag.findFirst({
      where: { name: tag.name }
    });
    if (!existing) {
      await prisma.wellbeingTag.create({ data: tag });
    }
  }

  // Products
  const supports = await prisma.category.findUnique({ where: { name: 'Supports' } });
  const jointPain = await prisma.wellbeingTag.findFirst({ where: { name: 'Joint Pain' } });

  if (supports) {
    const products = [
      {
        name: 'Knee Support Pro',
        description: 'Advanced knee support for active lifestyles.',
        price: 29.99,
        stockStatus: 'IN_STOCK',
        categoryId: supports.id,
        images: ['https://placehold.co/600x400?text=Knee+Support+1', 'https://placehold.co/600x400?text=Knee+Support+2'],
        tags: jointPain ? [jointPain.id] : []
      },
      {
        name: 'Ankle Stabilizer',
        description: 'Lightweight ankle stabilizer.',
        price: 19.99,
        stockStatus: 'IN_STOCK',
        categoryId: supports.id,
        images: ['https://placehold.co/600x400?text=Ankle+Stabilizer'],
        tags: []
      }
    ];

    for (const p of products) {
        const existing = await prisma.product.findFirst({ where: { name: p.name } });
        if (!existing) {
             await prisma.product.create({
                data: {
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    stockStatus: p.stockStatus,
                    categoryId: p.categoryId,
                    tags: {
                        connect: p.tags.map(id => ({ id }))
                    },
                    images: {
                        create: p.images.map((url, index) => ({
                            url,
                            displayOrder: index
                        }))
                    }
                }
             });
        }
    }
  }

  // Admin User
  const adminEmail = 'admin@welbeing.com';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded:', adminUser.email);

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
