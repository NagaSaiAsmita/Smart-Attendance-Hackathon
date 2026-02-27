import sqlite3 from 'better-sqlite3';

const db = new sqlite3('attendance.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'faculty')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    department TEXT,
    year TEXT,
    semester TEXT,
    face_descriptor TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    department TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Present',
    session_id TEXT,
    subject TEXT,
    year TEXT,
    semester TEXT,
    session_type TEXT,
    faculty_name TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS engagement_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS student_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    subject TEXT,
    query_text TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id)
  );
`);

// Migration for students table
const studentCols = ['year', 'semester'];
studentCols.forEach(col => {
  try {
    db.exec(`ALTER TABLE students ADD COLUMN ${col} TEXT`);
  } catch (e) {}
});

// Migration for attendance table
const attendanceCols = ['subject', 'year', 'semester', 'session_type', 'faculty_name', 'engagement_rating'];
attendanceCols.forEach(col => {
  try {
    db.exec(`ALTER TABLE attendance ADD COLUMN ${col} TEXT`);
  } catch (e) {}
});

export default db;
