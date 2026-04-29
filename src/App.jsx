import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Public Pages
import Home from './pages/Home/Home';
import CourseList from './pages/Courses/CourseList';
import CourseDetail from './pages/Courses/CourseDetail';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Student Pages
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentCourses from './pages/Student/StudentCourses';
import VideoPlayer from './pages/Student/VideoPlayer';
import QuizPage from './pages/Student/QuizPage';
import ProgressPage from './pages/Student/ProgressPage';
import CertificatesPage from './pages/Student/CertificatesPage';
import FavoritesPage from './pages/Student/FavoritesPage';
import MyInvoicesPage from './pages/Student/MyInvoicesPage';
import StudentMessages from './pages/Student/StudentMessages';

// Mentor Pages
import MentorDashboard from './pages/Mentor/MentorDashboard';
import MentorCourses from './pages/Mentor/MentorCourses';
import CreateCourse from './pages/Mentor/CreateCourse';
import EarningsPage from './pages/Mentor/EarningsPage';
import CourseBuilder from './pages/Mentor/CourseBuilder';
import MentorStudents from './pages/Mentor/Students';
import MentorAnalytics from './pages/Mentor/Analytics';
import MentorMessages from './pages/Mentor/Messages';
import MentorSettings from './pages/Mentor/Settings';
import MentorVerification from './pages/Mentor/MentorVerification';
// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageCourses from './pages/Admin/ManageCourses';
import MentorRequests from './pages/Admin/MentorRequests';
import RevenuePage from './pages/Admin/RevenuePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
          <Navbar />

          <Routes>
            {/* ── Public ── */}
          <Route path="/" element={<><Home /><Footer /></>} />
          <Route path="/courses" element={<><CourseList /><Footer /></>} />
          <Route path="/courses/:id" element={<><CourseDetail /><Footer /></>} />

          {/* ── Auth ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Student Dashboard ── */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="invoices" element={<MyInvoicesPage />} />
            <Route path="messages" element={<StudentMessages />} />
          </Route>

          {/* ── Standalone Student Player ── */}
          <Route path="/student/player" element={<ProtectedRoute roles={['student']}><VideoPlayer /></ProtectedRoute>} />

          {/* ── Standalone Mentor Verification ── */}
          <Route path="/mentor/verification" element={<ProtectedRoute roles={['mentor']}><MentorVerification /></ProtectedRoute>} />

          {/* ── Mentor Dashboard ── */}
          <Route path="/mentor" element={<ProtectedRoute roles={['mentor']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<MentorDashboard />} />
            <Route path="courses" element={<MentorCourses />} />
            <Route path="create" element={<CreateCourse />} />
            <Route path="courses/:id/build" element={<CourseBuilder />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="students" element={<MentorStudents />} />
            <Route path="analytics" element={<MentorAnalytics />} />
            <Route path="messages" element={<MentorMessages />} />
            <Route path="settings" element={<MentorSettings />} />

          </Route>

          {/* ── Admin Dashboard ── */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="mentor-requests" element={<MentorRequests />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="settings" element={<MentorSettings />} />
          </Route>
        </Routes>
        </SocketProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
