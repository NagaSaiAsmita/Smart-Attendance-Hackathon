export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'faculty';
  profile?: any;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name?: string;
  roll_no?: string;
  date: string;
  status: string;
  session_id: string;
  subject?: string;
  year?: string;
  semester?: string;
  session_type?: string;
  faculty_name?: string;
  engagement_rating?: string;
}

export interface EngagementScore {
  id: number;
  student_id: number;
  score: number;
  date: string;
}

export interface StudentQuery {
  id: number;
  student_id: number;
  faculty_id: number;
  subject?: string;
  query_text: string;
  status: 'Pending' | 'Reviewed' | 'Meeting Scheduled' | 'Resolved';
  created_at: string;
  faculty_name?: string;
  student_name?: string;
  roll_no?: string;
}
