import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./server/database.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = "smart-attendance-secret-key-2024";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- AUTH ROUTES ---

  app.post("/api/register", (req, res) => {
    const { name, email, password, role, studentId, department, year, semester } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const userResult = db.prepare(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
      ).run(name, email, hashedPassword, role);

      const userId = userResult.lastInsertRowid;

      if (role === "student") {
        db.prepare(
          "INSERT INTO students (user_id, student_id, department, year, semester) VALUES (?, ?, ?, ?, ?)"
        ).run(userId, studentId, department, year, semester);
      } else {
        db.prepare(
          "INSERT INTO faculty (user_id, department) VALUES (?, ?)"
        ).run(userId, department);
      }

      res.json({ success: true, message: "User registered successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password, role } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = ?").get(email, role) as any;

    if (user && bcrypt.compareSync(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
      
      let profileData = null;
      if (role === 'student') {
        profileData = db.prepare("SELECT * FROM students WHERE user_id = ?").get(user.id);
      } else {
        profileData = db.prepare("SELECT * FROM faculty WHERE user_id = ?").get(user.id);
      }

      res.json({ success: true, token, user: { ...user, profile: profileData } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // --- ATTENDANCE ROUTES ---

  app.post("/api/attendance/initialize-session", (req, res) => {
    const { date, sessionId, subject, year, semester, sessionType, facultyName } = req.body;
    try {
      // Find all students in this year and semester
      const students = db.prepare("SELECT id FROM students WHERE year = ? AND semester = ?").all(year, semester) as any[];
      
      if (students.length === 0) {
        return res.json({ success: true, count: 0, message: "No students found for this class." });
      }

      const checkExisting = db.prepare(
        "SELECT id FROM attendance WHERE student_id = ? AND date = ? AND session_id = ?"
      );
      
      const insert = db.prepare(
        "INSERT INTO attendance (student_id, date, session_id, subject, year, semester, session_type, faculty_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Absent')"
      );

      const transaction = db.transaction((studentList) => {
        let created = 0;
        for (const student of studentList) {
          const existing = checkExisting.get(student.id, date, sessionId);
          if (!existing) {
            insert.run(student.id, date, sessionId, subject, year, semester, sessionType, facultyName);
            created++;
          }
        }
        return created;
      });

      const count = transaction(students);
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/attendance/mark", (req, res) => {
    const { studentId, date, sessionId } = req.body;
    try {
      // Update status to Present if record exists
      db.prepare(
        "UPDATE attendance SET status = 'Present' WHERE student_id = ? AND date = ? AND session_id = ?"
      ).run(studentId, date, sessionId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/students/update-profile", (req, res) => {
    const { userId, name, department, year, semester } = req.body;
    try {
      db.transaction(() => {
        db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
        db.prepare(
          "UPDATE students SET department = ?, year = ?, semester = ? WHERE user_id = ?"
        ).run(department, year, semester, userId);
      })();
      
      const updatedUser = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(userId) as any;
      const studentInfo = db.prepare("SELECT * FROM students WHERE user_id = ?").get(userId) as any;
      updatedUser.profile = studentInfo;

      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/attendance/update-status", (req, res) => {
    const { recordId, status } = req.body;
    try {
      db.prepare("UPDATE attendance SET status = ? WHERE id = ?").run(status, recordId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/attendance/update-engagement", (req, res) => {
    const { recordId, rating } = req.body;
    try {
      // Map rating to score
      const scoreMap: { [key: string]: number } = {
        'High': 90,
        'Medium': 60,
        'Low': 30,
        'None': 0
      };
      const score = scoreMap[rating] || 0;

      db.transaction(() => {
        db.prepare("UPDATE attendance SET engagement_rating = ? WHERE id = ?").run(rating, recordId);
        
        // Also update/insert into engagement_scores if we want to keep the trend logic
        const record = db.prepare("SELECT student_id, date FROM attendance WHERE id = ?").get(recordId) as any;
        if (record) {
          // Check if score for this student/date already exists in engagement_scores
          const existing = db.prepare("SELECT id FROM engagement_scores WHERE student_id = ? AND date = ?").get(record.student_id, record.date);
          if (existing) {
            db.prepare("UPDATE engagement_scores SET score = ? WHERE id = ?").run(score, (existing as any).id);
          } else {
            db.prepare("INSERT INTO engagement_scores (student_id, score, date) VALUES (?, ?, ?)").run(record.student_id, score, record.date);
          }
        }
      })();

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/attendance/student/:userId", (req, res) => {
    const { userId } = req.params;
    const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(userId) as any;
    if (!student) return res.status(404).json({ message: "Student not found" });

    const history = db.prepare("SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC").all(student.id);
    const engagement = db.prepare("SELECT * FROM engagement_scores WHERE student_id = ?").all(student.id);
    
    res.json({ history, engagement });
  });

  app.get("/api/attendance/faculty/all", (req, res) => {
    const records = db.prepare(`
      SELECT a.*, u.name as student_name, s.student_id as roll_no
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY a.date DESC, a.id DESC
    `).all();
    res.json(records);
  });

  app.post("/api/engagement/save", (req, res) => {
    const { studentId, score, date } = req.body;
    db.prepare("INSERT INTO engagement_scores (student_id, score, date) VALUES (?, ?, ?)").run(studentId, score, date);
    res.json({ success: true });
  });

  app.get("/api/students/descriptors", (req, res) => {
    const students = db.prepare(`
      SELECT s.id, u.name, s.face_descriptor 
      FROM students s 
      JOIN users u ON s.user_id = u.id
      WHERE s.face_descriptor IS NOT NULL
    `).all();
    res.json(students);
  });

  app.post("/api/students/update-descriptor", (req, res) => {
    const { userId, descriptor } = req.body;
    db.prepare("UPDATE students SET face_descriptor = ? WHERE user_id = ?").run(JSON.stringify(descriptor), userId);
    res.json({ success: true });
  });

  app.get("/api/faculty/list", (req, res) => {
    try {
      const faculty = db.prepare("SELECT f.id, u.name, f.department FROM faculty f JOIN users u ON f.user_id = u.id").all();
      res.json(faculty);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/queries/create", (req, res) => {
    const { studentUserId, facultyId, subject, queryText } = req.body;
    try {
      const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(studentUserId) as any;
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      db.prepare("INSERT INTO student_queries (student_id, faculty_id, subject, query_text) VALUES (?, ?, ?, ?)")
        .run(student.id, facultyId, subject, queryText);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/queries/student/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(userId) as any;
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      const queries = db.prepare(`
        SELECT q.*, u.name as faculty_name 
        FROM student_queries q 
        JOIN faculty f ON q.faculty_id = f.id 
        JOIN users u ON f.user_id = u.id 
        WHERE q.student_id = ? 
        ORDER BY q.created_at DESC
      `).all(student.id);
      res.json(queries);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/queries/faculty/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const faculty = db.prepare("SELECT id FROM faculty WHERE user_id = ?").get(userId) as any;
      if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

      const queries = db.prepare(`
        SELECT q.*, u.name as student_name, s.student_id as roll_no 
        FROM student_queries q 
        JOIN students s ON q.student_id = s.id 
        JOIN users u ON s.user_id = u.id 
        WHERE q.faculty_id = ? 
        ORDER BY q.created_at DESC
      `).all(faculty.id);
      res.json(queries);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/queries/update-status", (req, res) => {
    const { queryId, status } = req.body;
    try {
      db.prepare("UPDATE student_queries SET status = ? WHERE id = ?").run(status, queryId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/export/csv", async (req, res) => {
    const records = db.prepare(`
      SELECT u.name, s.student_id, a.date, a.status, a.subject, a.year, a.semester, a.session_type, a.faculty_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
    `).all() as any[];

    const csvWriter = createObjectCsvWriter({
      path: 'attendance_export.csv',
      header: [
        {id: 'name', title: 'NAME'},
        {id: 'student_id', title: 'ROLL NO'},
        {id: 'date', title: 'DATE'},
        {id: 'status', title: 'STATUS'},
        {id: 'subject', title: 'SUBJECT'},
        {id: 'year', title: 'YEAR'},
        {id: 'semester', title: 'SEMESTER'},
        {id: 'session', title: 'SESSION'},
        {id: 'faculty_name', title: 'FACULTY'},
      ]
    });

    const mappedRecords = records.map(r => ({
      ...r,
      session: r.session_type
    }));

    await csvWriter.writeRecords(mappedRecords);
    res.download('attendance_export.csv');
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
