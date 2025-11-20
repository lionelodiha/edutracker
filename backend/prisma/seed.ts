import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up
  await prisma.score.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.term.deleteMany();
  await prisma.assessmentCategory.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Terms
  const term1 = await prisma.term.create({
    data: { name: '1st Term', academicSession: '2024/2025', isCurrent: true },
  });
  await prisma.term.create({
    data: { name: '2nd Term', academicSession: '2024/2025', isCurrent: false },
  });

  // 2. Categories
  const catAssign = await prisma.assessmentCategory.create({ data: { name: 'Assignment', weight: 10 } });
  const catTest = await prisma.assessmentCategory.create({ data: { name: 'Test', weight: 20 } });
  const catProject = await prisma.assessmentCategory.create({ data: { name: 'Project', weight: 10 } });
  const catExam = await prisma.assessmentCategory.create({ data: { name: 'Exam', weight: 60 } });

  // 3. Classes
  const classA = await prisma.classroom.create({ data: { name: 'SS1 Green' } });
  const classB = await prisma.classroom.create({ data: { name: 'SS1 Yellow' } });

  // 4. Subjects
  const math = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MTH101' } });
  const eng = await prisma.subject.create({ data: { name: 'English Language', code: 'ENG101' } });
  const bio = await prisma.subject.create({ data: { name: 'Biology', code: 'BIO101' } });
  const phy = await prisma.subject.create({ data: { name: 'Physics', code: 'PHY101' } });

  // 5. Users & Profiles

  // Admin
  await prisma.user.create({
    data: {
      email: 'admin@school.com',
      passwordHash,
      fullName: 'Principal Skinner',
      role: Role.ADMIN,
    },
  });

  // Teacher
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@school.com',
      passwordHash,
      fullName: 'Mrs. Krabappel',
      role: Role.TEACHER,
    },
  });
  const teacherProfile = await prisma.teacherProfile.create({
    data: { userId: teacherUser.id },
  });

  // Assign Teacher to ClassA (Math & Bio)
  await prisma.teacherAssignment.create({
    data: { teacherId: teacherProfile.id, classroomId: classA.id, subjectId: math.id },
  });
  await prisma.teacherAssignment.create({
    data: { teacherId: teacherProfile.id, classroomId: classA.id, subjectId: bio.id },
  });

  // Students
  const student1User = await prisma.user.create({
    data: { email: 'student1@school.com', passwordHash, fullName: 'Bart Simpson', role: Role.STUDENT },
  });
  const student1 = await prisma.studentProfile.create({
    data: { userId: student1User.id, admissionNumber: 'ADM001', classroomId: classA.id },
  });

  const student2User = await prisma.user.create({
    data: { email: 'student2@school.com', passwordHash, fullName: 'Lisa Simpson', role: Role.STUDENT },
  });
  const student2 = await prisma.studentProfile.create({
    data: { userId: student2User.id, admissionNumber: 'ADM002', classroomId: classA.id },
  });

  // Enroll students to subjects
  for (const sub of [math, bio, eng, phy]) {
    await prisma.studentSubjectEnrollment.upsert({
      where: { studentId_subjectId: { studentId: student1.id, subjectId: sub.id } },
      update: {},
      create: { studentId: student1.id, subjectId: sub.id, classroomId: classA.id },
    });
    await prisma.studentSubjectEnrollment.upsert({
      where: { studentId_subjectId: { studentId: student2.id, subjectId: sub.id } },
      update: {},
      create: { studentId: student2.id, subjectId: sub.id, classroomId: classA.id },
    });
  }

  // 6. Seed Scores for Student 1 (Bart) - Average Student
  const subjects = [math, bio, eng, phy];
  for (const sub of subjects) {
    await prisma.score.create({ data: { studentId: student1.id, subjectId: sub.id, termId: term1.id, categoryId: catAssign.id, score: Math.floor(Math.random() * 5) + 5 } }); // 5-10
    await prisma.score.create({ data: { studentId: student1.id, subjectId: sub.id, termId: term1.id, categoryId: catTest.id, score: Math.floor(Math.random() * 10) + 5 } }); // 5-15
    await prisma.score.create({ data: { studentId: student1.id, subjectId: sub.id, termId: term1.id, categoryId: catExam.id, score: Math.floor(Math.random() * 30) + 20 } }); // 20-50
  }

  // Seed Scores for Student 2 (Lisa) - Top Student
  for (const sub of subjects) {
    await prisma.score.create({ data: { studentId: student2.id, subjectId: sub.id, termId: term1.id, categoryId: catAssign.id, score: 9 } });
    await prisma.score.create({ data: { studentId: student2.id, subjectId: sub.id, termId: term1.id, categoryId: catTest.id, score: 18 } });
    await prisma.score.create({ data: { studentId: student2.id, subjectId: sub.id, termId: term1.id, categoryId: catExam.id, score: 55 } });
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
