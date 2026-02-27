import React, { useState, useEffect, useRef } from 'react';
import { User, AttendanceRecord, EngagementScore } from './types';
import { LogIn, UserPlus, Camera, BarChart3, History, LogOut, Download, CheckCircle2, AlertCircle, Calendar, Users, UserCheck, UserX, Percent, TrendingDown, Settings, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as faceapi from 'face-api.js';
import { loadModels, calculateEngagement } from './services/faceEngine';

// --- COMPONENTS ---

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => (
  <nav className="bg-white border-b border-emerald-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
        <CheckCircle2 size={24} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-zinc-900">SmartAttend AI</h1>
    </div>
    {user && (
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
          <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600"
        >
          <LogOut size={20} />
        </button>
      </div>
    )}
  </nav>
);

const Login = ({ onLogin }: { onLogin: (user: User, token: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1st Year');
  const [semester, setSemester] = useState('Semester 1');
  const [error, setError] = useState('');

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering 
      ? { name, email, password, role, studentId, department, year, semester }
      : { email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        if (isRegistering) {
          setIsRegistering(false);
          setError('Registration successful! Please login.');
        } else {
          onLogin(data.user, data.token);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-zinc-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-zinc-500 mt-2">Enter your credentials to access the portal</p>
        </div>

        <div className="flex p-1 bg-zinc-100 rounded-xl mb-6">
          <button 
            onClick={() => setRole('student')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'student' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500'}`}
          >
            Student
          </button>
          <button 
            onClick={() => setRole('faculty')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'faculty' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500'}`}
          >
            Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <input 
              type="text" placeholder="Full Name" required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={name} onChange={e => setName(e.target.value)}
            />
          )}
          <input 
            type="email" placeholder="Email Address" required
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          {isRegistering && role === 'student' && (
            <input 
              type="text" placeholder="Roll Number / Student ID" required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={studentId} onChange={e => setStudentId(e.target.value)}
            />
          )}
          {isRegistering && (
            <input 
              type="text" placeholder="Department" required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={department} onChange={e => setDepartment(e.target.value)}
            />
          )}

          {isRegistering && role === 'student' && (
            <div className="grid grid-cols-2 gap-4">
              <select 
                value={year} onChange={e => setYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select 
                value={semester} onChange={e => setSemester(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200">
            {isRegistering ? 'Register' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-500">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-emerald-600 font-semibold hover:underline"
          >
            {isRegistering ? 'Sign In' : 'Create One'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const StudentDashboard = ({ user }: { user: User }) => {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [engagement, setEngagement] = useState<EngagementScore[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('');

  // Query State
  const [isPostingQuery, setIsPostingQuery] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [querySubject, setQuerySubject] = useState('');
  const [queryText, setQueryText] = useState('');
  const [querySuccess, setQuerySuccess] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editDept, setEditDept] = useState(user.profile?.department || '');
  const [editYear, setEditYear] = useState(user.profile?.year || '1st Year');
  const [editSem, setEditSem] = useState(user.profile?.semester || 'Semester 1');

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  useEffect(() => {
    fetchData();
    fetchQueries();
    fetchFaculty();
  }, []);

  const fetchData = async () => {
    const res = await fetch(`/api/attendance/student/${user.id}`);
    const data = await res.json();
    setHistory(data.history);
    setEngagement(data.engagement);
  };

  const fetchQueries = async () => {
    const res = await fetch(`/api/queries/student/${user.id}`);
    const data = await res.json();
    setQueries(data);
  };

  const fetchFaculty = async () => {
    const res = await fetch('/api/faculty/list');
    const data = await res.json();
    setFacultyList(data);
  };

  const handlePostQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !queryText) return;

    try {
      const res = await fetch('/api/queries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentUserId: user.id,
          facultyId: parseInt(selectedFaculty),
          subject: querySubject,
          queryText
        })
      });
      if (res.ok) {
        setQuerySuccess('Query posted successfully!');
        setQuerySubject('');
        setQueryText('');
        setSelectedFaculty('');
        fetchQueries();
        setTimeout(() => {
          setQuerySuccess('');
          setIsPostingQuery(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: editName,
          department: editDept,
          year: editYear,
          semester: editSem
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startFaceSetup = async () => {
    setIsCapturing(true);
    setStatus('Initializing camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      await loadModels();
      setStatus('Models loaded. Please look at the camera.');
    } catch (err) {
      setStatus('Camera access denied');
    }
  };

  const captureFace = async () => {
    if (!videoRef.current) {
      setStatus('Camera not ready');
      return;
    }

    try {
      setStatus('Analyzing face... please stay still');
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setStatus('Face detected! Saving to secure database...');
        const res = await fetch('/api/students/update-descriptor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            descriptor: Array.from(detection.descriptor) 
          })
        });

        if (res.ok) {
          setStatus('Face registered successfully! Closing...');
          setTimeout(() => {
            setIsCapturing(false);
            setStatus('');
          }, 2000);
        } else {
          setStatus('Server error saving face data. Please try again.');
        }
      } else {
        setStatus('Face not detected. Ensure your face is clearly visible and well-lit.');
      }
    } catch (err) {
      console.error('Capture error:', err);
      setStatus('Technical error during capture. Please refresh and try again.');
    }
  };

  const attendanceRate = history.length > 0 ? Math.round((history.filter(h => h.status === 'Present').length / history.length) * 100) : 0;
  const isShortage = attendanceRate < 75 && history.length > 0;
  const avgEngagement = engagement.length > 0 ? Math.round(engagement.reduce((a, b) => a + b.score, 0) / engagement.length) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {isShortage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700"
        >
          <div className="bg-red-100 p-2 rounded-lg text-red-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="font-bold">⚠ Attendance below 75% – Shortage Warning</p>
            <p className="text-sm opacity-80">Please contact your department head to avoid exam disqualification.</p>
          </div>
          <span className="ml-auto bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            CRITICAL
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={20} /></div>
            <h3 className="font-semibold text-zinc-900">Attendance Rate</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{attendanceRate}%</p>
          <p className="text-sm text-zinc-500 mt-2">Based on last 30 sessions</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><BarChart3 size={20} /></div>
            <h3 className="font-semibold text-zinc-900">Engagement Score</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{avgEngagement}/100</p>
          <p className="text-sm text-zinc-500 mt-2">Average across all classes</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col gap-3">
          <button 
            onClick={startFaceSetup}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-xl hover:bg-zinc-800 transition-all"
          >
            <Camera size={20} />
            Setup Face ID
          </button>
          <button 
            onClick={() => setIsPostingQuery(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-all"
          >
            <MessageSquare size={20} />
            Ask a Doubt
          </button>
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-900 py-3 rounded-xl hover:bg-zinc-50 transition-all"
          >
            <Settings size={20} />
            Update Profile
          </button>
        </div>
      </div>


      <AnimatePresence>
        {isPostingQuery && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="text-emerald-600" />
                Post a Query
              </h3>
              {querySuccess ? (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center font-bold">
                  {querySuccess}
                </div>
              ) : (
                <form onSubmit={handlePostQuery} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Select Faculty</label>
                    <select 
                      required
                      value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Choose Faculty...</option>
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Subject (Optional)</label>
                    <input 
                      type="text" value={querySubject} onChange={e => setQuerySubject(e.target.value)}
                      placeholder="e.g. Calculus Doubt"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Your Query</label>
                    <textarea 
                      required
                      value={queryText} onChange={e => setQueryText(e.target.value)}
                      placeholder="Describe your doubt here..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button 
                      type="button"
                      onClick={() => setIsPostingQuery(false)}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Post Query
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
        {isEditingProfile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
              <h3 className="text-2xl font-bold mb-6">Update Profile</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Full Name</label>
                  <input 
                    type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Department</label>
                  <input 
                    type="text" value={editDept} onChange={e => setEditDept(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Year</label>
                    <select 
                      value={editYear} onChange={e => setEditYear(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Semester</label>
                    <select 
                      value={editSem} onChange={e => setEditSem(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-3 rounded-xl border border-zinc-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {isCapturing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center">
              <h3 className="text-2xl font-bold mb-4">Face ID Setup</h3>
              <div className="relative aspect-video bg-zinc-100 rounded-2xl overflow-hidden mb-6">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>
              <p className="text-zinc-600 mb-6">{status}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCapturing(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  onClick={captureFace}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold"
                >
                  Capture
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 drop-shadow-[0_2px_0px_rgba(5,150,105,0.3)]">
              <History size={18} /> Attendance History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-zinc-900 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Subject</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map(record => (
                  <tr key={record.id} className="text-sm">
                    <td className="px-6 py-4 text-zinc-500">{record.date}</td>
                    <td className="px-6 py-4 text-zinc-900">{record.subject || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 drop-shadow-[0_2px_0px_rgba(5,150,105,0.3)]">
              <MessageSquare size={18} /> Your Queries
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {queries.map(q => (
              <div key={q.id} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-zinc-900">{q.subject || 'No Subject'}</h4>
                    <p className="text-xs text-zinc-500">To: {q.faculty_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    q.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    q.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                    q.status === 'Meeting Scheduled' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 line-clamp-2">{q.query_text}</p>
                <p className="text-[10px] text-zinc-400">{new Date(q.created_at).toLocaleString()}</p>
              </div>
            ))}
            {queries.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <p>No queries posted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FacultyDashboard = ({ user }: { user: User }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionInterval = useRef<any>(null);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // New fields state
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSemester, setSelectedSemester] = useState('Semester 1');
  const [selectedSessionType, setSelectedSessionType] = useState('Morning');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const subjects = ['Mathematics', 'Physics', 'Computer Science', 'Data Structures', 'AI & ML', 'Operating Systems'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];
  const sessions = ['Morning', 'Afternoon'];

  useEffect(() => {
    fetchRecords();
    loadFaceData();
    fetchQueries();
  }, []);

  const fetchRecords = async () => {
    const res = await fetch('/api/attendance/faculty/all');
    const data = await res.json();
    setRecords(data);
  };

  const fetchQueries = async () => {
    const res = await fetch(`/api/queries/faculty/${user.id}`);
    const data = await res.json();
    setQueries(data);
  };

  // Calculations for Summary Cards
  const filteredRecords = records.filter(r => {
    if (viewMode === 'daily') {
      return r.date === selectedDate && r.session_type === selectedSessionType;
    } else if (viewMode === 'weekly') {
      // Weekly logic: last 7 days from selected date
      const recordDate = new Date(r.date);
      const selDate = new Date(selectedDate);
      const diffTime = selDate.getTime() - recordDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays < 7;
    } else {
      // Monthly logic: last 30 days from selected date
      const recordDate = new Date(r.date);
      const selDate = new Date(selectedDate);
      const diffTime = selDate.getTime() - recordDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays < 30;
    }
  });

  const totalStudents = Array.from(new Set(filteredRecords.map(r => r.student_id))).length;
  const presentCount = filteredRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const absentCount = filteredRecords.filter(r => r.status === 'Absent').length;
  const attendancePercentage = filteredRecords.length > 0 ? Math.round((presentCount / filteredRecords.length) * 100) : 0;

  // Student-wise overall percentage calculation
  const studentStats = records.reduce((acc: any, curr) => {
    if (!acc[curr.student_id]) {
      acc[curr.student_id] = { 
        name: curr.student_name, 
        roll: curr.roll_no, 
        present: 0, 
        total: 0 
      };
    }
    acc[curr.student_id].total += 1;
    if (curr.status === 'Present' || curr.status === 'Late') acc[curr.student_id].present += 1;
    return acc;
  }, {});

  const studentSummary = Object.values(studentStats).map((s: any) => ({
    ...s,
    percentage: Math.round((s.present / s.total) * 100)
  }));

  const handleManualStatusChange = async (recordId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/attendance/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, status: newStatus })
      });
      if (res.ok) {
        setSuccessMessage('Attendance Updated Successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEngagementChange = async (recordId: number, rating: string) => {
    try {
      const res = await fetch('/api/attendance/update-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, rating })
      });
      if (res.ok) {
        setSuccessMessage('Engagement Rating Updated');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQueryStatus = async (queryId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/queries/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, status: newStatus })
      });
      if (res.ok) {
        setSuccessMessage('Query Status Updated');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchQueries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFaceData = async () => {
    await loadModels();
    const res = await fetch('/api/students/descriptors');
    const data = await res.json();
    setStudents(data);

    if (data.length > 0) {
      const labeledDescriptors = data.map((s: any) => {
        const desc = new Float32Array(JSON.parse(s.face_descriptor));
        return new faceapi.LabeledFaceDescriptors(s.id.toString(), [desc]);
      });
      setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
    }
  };

  const startSession = async () => {
    setIsSessionActive(true);
    setStatus('Initializing AI Session...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const sessionId = 'SESS-' + Date.now();
      const date = selectedDate; // Use selected date instead of today

      // Initialize session with Absent records
      const initRes = await fetch('/api/attendance/initialize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date, 
          sessionId, 
          subject: selectedSubject, 
          year: selectedYear, 
          semester: selectedSemester, 
          sessionType: selectedSessionType,
          facultyName: user?.name
        })
      });

      const initData = await initRes.json();
      if (initData.count === 0) {
        setStatus(`Warning: No students found for ${selectedYear} ${selectedSemester}. Please check student registrations.`);
      } else {
        setStatus(`Session started. ${initData.count} students marked as Absent.`);
      }

      // Refresh records to show Absent students immediately
      fetchRecords();

      sessionInterval.current = setInterval(async () => {
        if (!videoRef.current || !faceMatcher) return;

        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptors();

        const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
        if (canvasRef.current) {
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvasRef.current.getContext('2d')?.clearRect(0, 0, displaySize.width, displaySize.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        }

        detections.forEach(async (det) => {
          const match = faceMatcher.findBestMatch(det.descriptor);
          if (match.label !== 'unknown') {
            const studentId = parseInt(match.label);
            const engagement = calculateEngagement(det.expressions);
            
            // Mark attendance
            const markRes = await fetch('/api/attendance/mark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId, 
                date, 
                sessionId,
                subject: selectedSubject,
                year: selectedYear,
                semester: selectedSemester,
                sessionType: selectedSessionType
              })
            });

            if (markRes.ok) {
              fetchRecords(); // Refresh to show student as Present
            }

            // Save engagement
            await fetch('/api/engagement/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId, score: engagement, date })
            });
          }
        });
      }, 2000);

      setStatus('Session Active. Tracking faces...');
    } catch (err) {
      setStatus('Session failed to start');
    }
  };

  const stopSession = () => {
    clearInterval(sessionInterval.current);
    setIsSessionActive(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    fetchRecords();
  };

  const exportCSV = () => {
    window.open('/api/export/csv', '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'emerald' },
          { label: 'Present Today', value: presentCount, icon: UserCheck, color: 'blue' },
          { label: 'Absent Today', value: absentCount, icon: UserX, color: 'red' },
          { label: 'Attendance %', value: `${attendancePercentage}%`, icon: Percent, color: 'amber' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 bg-${card.color}-50 text-${card.color}-600 rounded-xl`}>
                <card.icon size={24} />
              </div>
              <span className={`text-${card.color}-600 text-xs font-bold uppercase tracking-wider`}>{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-zinc-900">Faculty Management</h2>
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-200 text-sm font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all font-medium"
          >
            <Download size={18} /> Export CSV
          </button>
          {!isSessionActive ? (
            <button 
              onClick={startSession}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-200"
            >
              <Camera size={18} /> Start Session
            </button>
          ) : (
            <button 
              onClick={stopSession}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all font-semibold shadow-lg shadow-red-200"
            >
              Stop Session
            </button>
          )}
        </div>
      </div>

      {!isSessionActive && (
        <div className="bg-emerald-100/80 p-6 rounded-3xl border-2 border-emerald-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-zinc-700 font-medium"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-zinc-700 font-medium"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Semester</label>
            <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-zinc-700 font-medium"
            >
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Session</label>
            <select 
              value={selectedSessionType} 
              onChange={(e) => setSelectedSessionType(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-zinc-700 font-medium"
            >
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-zinc-700 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setViewMode('daily')}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${viewMode === 'daily' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}
        >
          Daily View
        </button>
        <button 
          onClick={() => setViewMode('weekly')}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${viewMode === 'weekly' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}
        >
          Weekly View
        </button>
        <button 
          onClick={() => setViewMode('monthly')}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${viewMode === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}
        >
          Monthly View
        </button>
      </div>

      <AnimatePresence>
        {isSessionActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-900 rounded-3xl overflow-hidden relative"
          >
            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover opacity-60" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs font-medium">
              {selectedSubject} • {selectedYear} • {selectedSemester} • {selectedSessionType}
            </div>
            <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">{status}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="font-bold text-emerald-600 flex items-center gap-2 drop-shadow-[0_2px_0px_rgba(5,150,105,0.3)]">
            <MessageSquare size={18} /> Student Queries & Doubts
          </h3>
          <span className="text-xs text-zinc-500 font-medium">
            {queries.filter(q => q.status === 'Pending').length} New Queries
          </span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queries.map(q => (
              <div key={q.id} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-zinc-900">{q.subject || 'No Subject'}</h4>
                    <p className="text-xs text-zinc-500">From: {q.student_name} ({q.roll_no})</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    q.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    q.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                    q.status === 'Meeting Scheduled' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 bg-white p-3 rounded-xl border border-zinc-100 italic">
                  "{q.query_text}"
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <select 
                    value={q.status}
                    onChange={(e) => handleUpdateQueryStatus(q.id, e.target.value)}
                    className="text-[10px] font-bold bg-white border border-zinc-200 rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Meeting Scheduled">Schedule Meeting</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <p className="text-[10px] text-zinc-400">{new Date(q.created_at).toLocaleString()}</p>
              </div>
            ))}
            {queries.length === 0 && (
              <div className="col-span-full text-center py-8 text-zinc-500">
                <p>No student queries at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-emerald-600 drop-shadow-[0_2px_0px_rgba(5,150,105,0.3)]">Student Attendance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-900 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold">Roll No</th>
                <th className="px-6 py-4 font-bold">Total Classes</th>
                <th className="px-6 py-4 font-bold">Present</th>
                <th className="px-6 py-4 font-bold">Overall %</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {studentSummary.map((s: any) => (
                <tr key={s.roll} className={`text-sm ${s.percentage < 75 ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-zinc-900">{s.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{s.roll}</td>
                  <td className="px-6 py-4 text-zinc-500">{s.total}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">{s.present}</td>
                  <td className={`px-6 py-4 font-bold ${s.percentage < 75 ? 'text-red-600' : 'text-zinc-900'}`}>
                    {s.percentage}%
                  </td>
                  <td className="px-6 py-4">
                    {s.percentage < 75 ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={14} />
                        <span className="text-xs font-bold uppercase">Shortage</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-bold uppercase">Safe</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="font-bold text-emerald-600 drop-shadow-[0_2px_0px_rgba(5,150,105,0.3)]">
            {viewMode === 'daily' ? 'Daily' : viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Attendance Records
          </h3>
          <span className="text-xs text-zinc-500 font-medium">
            Showing {filteredRecords.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-900 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold">Roll No</th>
                <th className="px-6 py-4 font-bold">Subject</th>
                <th className="px-6 py-4 font-bold">Year/Sem</th>
                <th className="px-6 py-4 font-bold">Session</th>
                <th className="px-6 py-4 font-bold">Faculty</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Engagement</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredRecords.map(record => (
                <tr key={record.id} className="text-sm">
                  <td className="px-6 py-4 font-medium text-zinc-900">{record.student_name}</td>
                  <td className="px-6 py-4 text-zinc-500">{record.roll_no}</td>
                  <td className="px-6 py-4 text-zinc-900">{record.subject || 'N/A'}</td>
                  <td className="px-6 py-4 text-zinc-500">{record.year} - {record.semester}</td>
                  <td className="px-6 py-4 text-zinc-500">{record.session_type}</td>
                  <td className="px-6 py-4 text-zinc-500">{record.faculty_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-zinc-500">{record.date}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={record.engagement_rating || 'None'}
                      onChange={(e) => handleEngagementChange(record.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold outline-none border-none cursor-pointer transition-all ${
                        record.engagement_rating === 'High' ? 'bg-emerald-100 text-emerald-700' : 
                        record.engagement_rating === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        record.engagement_rating === 'Low' ? 'bg-red-100 text-red-700' :
                        'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      <option value="None">Rate...</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={record.status}
                      onChange={(e) => handleManualStatusChange(record.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold outline-none border-none cursor-pointer transition-all ${
                        record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 
                        record.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">No attendance records for this selection</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Navbar user={user} onLogout={handleLogout} />
      <main>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : user.role === 'student' ? (
          <StudentDashboard user={user} />
        ) : (
          <FacultyDashboard user={user} />
        )}
      </main>
    </div>
  );
}
