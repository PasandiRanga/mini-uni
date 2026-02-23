import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@miniuni.com' },
    update: {},
    create: {
      email: 'admin@miniuni.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@miniuni.com' },
    update: {},
    create: {
      email: 'teacher@miniuni.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: UserRole.TEACHER,
      isActive: true,
      emailVerified: true,
      teacherProfile: {
        create: {
          bio: 'Experienced mathematics teacher with 10 years of experience',
          experience: 10,
          subjects: ['Mathematics', 'Physics'],
          hourlyRate: 50.00,
          verificationStatus: VerificationStatus.APPROVED,
        },
      },
      wallet: {
        create: {},
      },
    },
  });

  console.log('Created teacher user:', teacher.email);

  // Create sample student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@miniuni.com' },
    update: {},
    create: {
      email: 'student@miniuni.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: UserRole.STUDENT,
      isActive: true,
      emailVerified: true,
      studentProfile: {
        create: {
          grade: '12',
          interests: ['Mathematics', 'Physics'],
        },
      },
    },
  });

  console.log('Created student user:', student.email);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

