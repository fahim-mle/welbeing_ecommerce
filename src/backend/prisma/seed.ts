import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        categoryId: supports.id,
        images: ['https://placehold.co/600x400?text=Knee+Support+1', 'https://placehold.co/600x400?text=Knee+Support+2'],
        tags: jointPain ? [jointPain.id] : []
      },
      {
        name: 'Ankle Stabilizer',
        description: 'Lightweight ankle stabilizer.',
        price: 19.99,
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
  const adminPassword = 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
      const user = await prisma.user.create({
          data: {
              email: adminEmail,
              role: 'ADMIN',
              identities: {
                  create: {
                      provider: 'EMAIL',
                      providerId: adminEmail,
                      passwordHash
                  }
              }
          }
      });
      console.log('Admin user created:', user.email);
  } else {
      // Ensure identity exists
      const identity = await prisma.userIdentity.findUnique({
          where: {
              provider_providerId: {
                  provider: 'EMAIL',
                  providerId: adminEmail
              }
          }
      });
      
      if (!identity) {
          await prisma.userIdentity.create({
              data: {
                  userId: existingAdmin.id,
                  provider: 'EMAIL',
                  providerId: adminEmail,
                  passwordHash
              }
          });
          console.log('Admin identity created');
      } else {
          // Update password just in case
          await prisma.userIdentity.update({
              where: { id: identity.id },
              data: { passwordHash }
          });
          console.log('Admin password updated');
      }
      
      // Ensure role is ADMIN
      if (existingAdmin.role !== 'ADMIN') {
          await prisma.user.update({
              where: { id: existingAdmin.id },
              data: { role: 'ADMIN' }
          });
          console.log('User promoted to ADMIN');
      }
  }

  // Test Users
  const testUsers = [
    { email: 'user1@welbeing.com', password: 'user123', role: 'USER' },
    { email: 'user2@welbeing.com', password: 'user123', role: 'USER' },
    { email: 'user3@welbeing.com', password: 'user123', role: 'USER' }
  ];

  for (const testUser of testUsers) {
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const existingUser = await prisma.user.findUnique({ where: { email: testUser.email } });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: testUser.email,
          role: testUser.role,
          identities: {
            create: {
              provider: 'EMAIL',
              providerId: testUser.email,
              passwordHash
            }
          }
        }
      });
      console.log(`Test user created: ${testUser.email}`);
    } else {
        // Ensure identity exists
        const identity = await prisma.userIdentity.findUnique({
            where: {
                provider_providerId: {
                    provider: 'EMAIL',
                    providerId: testUser.email
                }
            }
        });
        
        if (!identity) {
            await prisma.userIdentity.create({
                data: {
                    userId: existingUser.id,
                    provider: 'EMAIL',
                    providerId: testUser.email,
                    passwordHash
                }
            });
            console.log(`Identity created for existing user: ${testUser.email}`);
        }
    }
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
