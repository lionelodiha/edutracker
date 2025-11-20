
import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from './services/emailService';

const app = express();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// --- Middleware ---

interface AuthRequest extends ExpressRequest {
  user?: { userId: number; role: Role };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireRole = (role: Role) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.sendStatus(403);
    next();
  };
};

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email } });
});

// Sign up (Teacher or Student)
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName, role, classroomId, admissionNumber } = req.body as any;
  try {
    if (![Role.TEACHER, Role.STUDENT].includes(role)) {
      return res.status(400).json({ message: 'Only TEACHER or STUDENT signup allowed' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, fullName, role } });

    if (role === Role.TEACHER) {
      await prisma.teacherProfile.create({ data: { userId: user.id } });
    }
    if (role === Role.STUDENT) {
      if (!classroomId || !admissionNumber) return res.status(400).json({ message: 'classroomId and admissionNumber are required for student signup' });
      await prisma.studentProfile.create({ data: { userId: user.id, classroomId: Number(classroomId), admissionNumber } });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

app.get('/api/me', authenticateToken, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
        studentProfile: { include: { classroom: true } },
        teacherProfile: true
    }
  });
  res.json(user);
});

// Public: list classes for signup convenience
app.get('/api/classes', async (req, res) => {
  const list = await prisma.classroom.findMany();
  res.json(list);
});

// --- Student Routes ---

app.get('/api/student/dashboard', authenticateToken, requireRole(Role.STUDENT), async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const student = await prisma.studentProfile.findUnique({ where: { userId } });

    if (!student) return res.status(404).json({ message: "Profile not found" });

    const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true } });
    if (!currentTerm) return res.status(404).json({ message: "No active term" });

    // Only include subjects the student is enrolled in
    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { studentId: student.id },
      select: { subjectId: true }
    });
    const enrolledSubjectIds = new Set(enrollments.map(e => e.subjectId));

    // Get all scores for enrolled subjects
    const scores = await prisma.score.findMany({
        where: { studentId: student.id, termId: currentTerm.id, subjectId: { in: Array.from(enrolledSubjectIds) } },
        include: { subject: true, category: true }
    });

    // Aggregate scores per subject
    const subjectsMap = new Map<number, any>();

    scores.forEach(s => {
        if (!subjectsMap.has(s.subjectId)) {
            subjectsMap.set(s.subjectId, {
                subjectId: s.subjectId,
                subjectName: s.subject.name,
                subjectCode: s.subject.code,
                totalScore: 0,
                breakdown: []
            });
        }
        const entry = subjectsMap.get(s.subjectId);
        entry.totalScore += s.score;
        entry.breakdown.push({ category: s.category.name, score: s.score, max: s.category.weight });
    });

    const subjects = Array.from(subjectsMap.values()).map(sub => {
        let grade = 'F';
        if (sub.totalScore >= 70) grade = 'A';
        else if (sub.totalScore >= 60) grade = 'B';
        else if (sub.totalScore >= 50) grade = 'C';
        else if (sub.totalScore >= 45) grade = 'D';
        else if (sub.totalScore >= 40) grade = 'E';

        return { ...sub, grade };
    });

    res.json({
        student,
        term: currentTerm,
        subjects,
        overallAverage: subjects.length > 0 ? subjects.reduce((acc, s) => acc + s.totalScore, 0) / subjects.length : 0
    });
});

// --- Teacher Routes ---

app.get('/api/teacher/assignments', authenticateToken, requireRole(Role.TEACHER), async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId } });
    if(!teacher) return res.status(404).send("Teacher profile not found");

    const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: teacher.id },
        include: { subject: true, classroom: true }
    });
    res.json(assignments);
});

app.get('/api/teacher/class/:classId/subject/:subjectId', authenticateToken, requireRole(Role.TEACHER), async (req: AuthRequest, res) => {
    const { classId, subjectId } = req.params;
    const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true } });

    if(!currentTerm) return res.status(400).send("No active term");

    // Ensure the teacher is assigned to this class + subject
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!teacher) return res.status(404).send('Teacher profile not found');
    const assigned = await prisma.teacherAssignment.findFirst({
      where: { teacherId: teacher.id, classroomId: Number(classId), subjectId: Number(subjectId) }
    });
    if (!assigned) return res.status(403).send('Not assigned to this class/subject');

    // Only students in the class who are enrolled in the subject
    const enrolledIds = await prisma.studentSubjectEnrollment.findMany({
      where: { subjectId: Number(subjectId) },
      select: { studentId: true }
    });
    const enrolledStudentIds = enrolledIds.map(e => e.studentId);

    const students = await prisma.studentProfile.findMany({
        where: { classroomId: parseInt(classId), id: { in: enrolledStudentIds } },
        include: {
            user: true,
            scores: {
                where: { subjectId: parseInt(subjectId), termId: currentTerm.id },
                include: { category: true }
            }
        },
        orderBy: { user: { fullName: 'asc' } }
    });

    const categories = await prisma.assessmentCategory.findMany();

    res.json({ students, categories, termId: currentTerm.id });
});

app.post('/api/teacher/scores', authenticateToken, requireRole(Role.TEACHER), async (req: AuthRequest, res) => {
    const { studentId, subjectId, termId, categoryId, score } = req.body;
    const scoreValue = parseFloat(score);

    const updatedScore = await prisma.score.upsert({
        where: {
            studentId_subjectId_termId_categoryId: {
                studentId, subjectId, termId, categoryId
            }
        },
        update: { score: scoreValue },
        create: { studentId, subjectId, termId, categoryId, score: scoreValue }
    });

    // LOW SCORE NOTIFICATION
    // If score is roughly failing (assuming specific assignment weight logic, but here we check raw low value)
    // A better check would be calculating the total, but for this prompt, let's alert on low individual entry
    if (scoreValue < 5) { // Arbitrary low threshold for a single assignment
        const teacherUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        const studentProfile = await prisma.studentProfile.findUnique({ 
            where: { id: studentId },
            include: { user: true, classroom: true } 
        });
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        const category = await prisma.assessmentCategory.findUnique({ where: { id: categoryId }});

        if (teacherUser && studentProfile && subject && category) {
             await sendEmail(
                teacherUser.email,
                `Warning: Low Score Alert - ${studentProfile.user.fullName}`,
                `Dear ${teacherUser.fullName},\n\n` +
                `Student ${studentProfile.user.fullName} (${studentProfile.classroom.name}) scored ${scoreValue} in ${subject.name} - ${category.name}.\n` +
                `Please review their performance.`
             );
        }
    }

    res.json(updatedScore);
});

// Batch upsert scores
app.post('/api/teacher/scores/batch', authenticateToken, requireRole(Role.TEACHER), async (req: AuthRequest, res) => {
  const { entries } = req.body as { entries: Array<{ studentId: number; subjectId: number; termId: number; categoryId: number; score: number }> };
  if (!Array.isArray(entries)) return res.status(400).json({ message: 'entries[] required' });
  const ops = entries.map(e => prisma.score.upsert({
    where: { studentId_subjectId_termId_categoryId: { studentId: e.studentId, subjectId: e.subjectId, termId: e.termId, categoryId: e.categoryId } },
    update: { score: e.score },
    create: { studentId: e.studentId, subjectId: e.subjectId, termId: e.termId, categoryId: e.categoryId, score: e.score }
  }));
  const results = await prisma.$transaction(ops);
  res.json({ count: results.length });
});

// --- Admin Routes ---

app.get('/api/admin/stats', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
    const [teachers, students, classes] = await Promise.all([
        prisma.teacherProfile.count(),
        prisma.studentProfile.count(),
        prisma.classroom.count()
    ]);
    res.json({ teachers, students, classes });
});

// New: Assign Teacher Endpoint
app.post('/api/admin/assignments', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
    const { teacherId, subjectId, classroomId } = req.body;

    try {
        const assignment = await prisma.teacherAssignment.create({
            data: { teacherId, subjectId, classroomId },
            include: {
                teacher: { include: { user: true } },
                subject: true,
                classroom: true
            }
        });

        // ASSIGNMENT NOTIFICATION
        const teacherEmail = assignment.teacher.user.email;
        await sendEmail(
            teacherEmail,
            'New Class Assignment - EduTrack',
            `Dear ${assignment.teacher.user.fullName},\n\n` +
            `You have been assigned to teach ${assignment.subject.name} for class ${assignment.classroom.name}.\n` +
            `Please log in to your dashboard to view details.`
        );

        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign teacher' });
    }
});

// List assignments
app.get('/api/admin/assignments', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const list = await prisma.teacherAssignment.findMany({ include: { teacher: { include: { user: true } }, subject: true, classroom: true } });
  res.json(list);
});

// Teachers
app.post('/api/admin/teachers', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const { email, fullName, password } = req.body as any;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, fullName, passwordHash, role: Role.TEACHER } });
    const prof = await prisma.teacherProfile.create({ data: { userId: user.id } });
    res.json({ id: prof.id, user });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create teacher' }); }
});

app.get('/api/admin/teachers', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const list = await prisma.teacherProfile.findMany({ include: { user: true } });
  res.json(list);
});

// Students
app.post('/api/admin/students', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const { email, fullName, password, classroomId, admissionNumber } = req.body as any;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, fullName, passwordHash, role: Role.STUDENT } });
    const prof = await prisma.studentProfile.create({ data: { userId: user.id, classroomId: Number(classroomId), admissionNumber } });
    res.json({ id: prof.id, user });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create student' }); }
});

app.get('/api/admin/students', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const list = await prisma.studentProfile.findMany({ include: { user: true, classroom: true } });
  res.json(list);
});

// Classes
app.post('/api/admin/classes', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const { name } = req.body as any;
  try { const c = await prisma.classroom.create({ data: { name } }); res.json(c); }
  catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create class' }); }
});

app.get('/api/admin/classes', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const list = await prisma.classroom.findMany();
  res.json(list);
});

// Subjects
app.post('/api/admin/subjects', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const { name, code } = req.body as any;
  try { const s = await prisma.subject.create({ data: { name, code } }); res.json(s); }
  catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create subject' }); }
});

app.get('/api/admin/subjects', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const list = await prisma.subject.findMany();
  res.json(list);
});

// Enrollments
app.post('/api/admin/enrollments', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const { studentId, subjectId, classroomId } = req.body as any;
  try {
    const e = await prisma.studentSubjectEnrollment.upsert({
      where: { studentId_subjectId: { studentId: Number(studentId), subjectId: Number(subjectId) } },
      update: { classroomId: classroomId ? Number(classroomId) : null },
      create: { studentId: Number(studentId), subjectId: Number(subjectId), classroomId: classroomId ? Number(classroomId) : null },
    });
    res.json(e);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to enroll' }); }
});

app.get('/api/admin/enrollments', authenticateToken, requireRole(Role.ADMIN), async (req, res) => {
  const { studentId } = req.query as any;
  const where: any = {};
  if (studentId) where.studentId = Number(studentId);
  const list = await prisma.studentSubjectEnrollment.findMany({ where, include: { subject: true, classroom: true } });
  res.json(list);
});


// Start Server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
