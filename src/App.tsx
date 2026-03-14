import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import TeamChat from '@/pages/TeamChat';
import Analytics from '@/pages/Analytics';
import CertificateManager from '@/pages/CertificateManager';
import InternshipTracker from '@/pages/InternshipTracker';
import AdminManagement from '@/pages/AdminManagement';
import AttendanceTracker from '@/pages/AttendanceTracker';
import PaymentVerification from '@/pages/PaymentVerification';
import ProtectedRoute from '@/components/ProtectedRoute';
import BulkUpload from '@/pages/BulkUpload';
import NotificationCenter from '@/pages/NotificationCenter';
import FileManager from '@/pages/FileManager';
import AuditLogs from '@/pages/AuditLogs';
import Overview from '@/pages/Overview';
import SocialMediaAnalytics from '@/pages/SocialMediaAnalytics';
import EmployeeManagement from '@/pages/EmployeeManagement';
import Careers from '@/pages/Careers';
import CareerApplications from '@/pages/CareerApplications';
import EsportsPlayersList from '@/pages/EsportsPlayersList';
import EsportsAddPlayer from '@/pages/EsportsAddPlayer';
import TechWorkDashboard from '@/pages/TechWorkDashboard';
import ContentWorkDashboard from '@/pages/ContentWorkDashboard';
import LeaveManagement from '@/pages/LeaveManagement';
import AdminEmployeeProfile from '@/pages/AdminEmployeeProfile';
import HolidayCalendar from '@/pages/HolidayCalendar';
import HRDashboard from '@/pages/HRDashboard';
import SettingsPage from '@/pages/SettingsPage';
import Announcements from '@/pages/Announcements';
import PollsSurveys from '@/pages/PollsSurveys';
import KanbanBoard from '@/pages/KanbanBoard';
import StandupLogs from '@/pages/StandupLogs';
import FeedbackSystem from '@/pages/FeedbackSystem';
import TeamEvents from '@/pages/TeamEvents';
import PerformanceScores from '@/pages/PerformanceScores';
import AdminReport from '@/pages/AdminReport';
import BirthdayReminders from '@/pages/BirthdayReminders';

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/careers" element={<Careers />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/overview"
            element={
              <ProtectedRoute>
                <Overview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/attendance"
            element={
              <ProtectedRoute>
                <AttendanceTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chat"
            element={
              <ProtectedRoute>
                <TeamChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payments"
            element={
              <ProtectedRoute>
                <PaymentVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/certificates"
            element={
              <ProtectedRoute>
                <CertificateManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/internships"
            element={
              <ProtectedRoute>
                <InternshipTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin-management"
            element={
              <ProtectedRoute>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bulk-upload"
            element={
              <ProtectedRoute>
                <BulkUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/files"
            element={
              <ProtectedRoute>
                <FileManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/social-analytics"
            element={
              <ProtectedRoute>
                <SocialMediaAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employees"
            element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/careers"
            element={
              <ProtectedRoute>
                <CareerApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/esports/players"
            element={
              <ProtectedRoute>
                <EsportsPlayersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/esports-players"
            element={
              <ProtectedRoute>
                <EsportsPlayersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/esports/add-player"
            element={
              <ProtectedRoute>
                <EsportsAddPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tech-work"
            element={
              <ProtectedRoute>
                <TechWorkDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/content-work"
            element={
              <ProtectedRoute>
                <ContentWorkDashboard />
            </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/leave"
            element={
              <ProtectedRoute>
                <LeaveManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employee-profile"
            element={
              <ProtectedRoute>
                <AdminEmployeeProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/holidays"
            element={
              <ProtectedRoute>
                <HolidayCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/hr"
            element={
              <ProtectedRoute>
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/dashboard/polls" element={<ProtectedRoute><PollsSurveys /></ProtectedRoute>} />
          <Route path="/dashboard/tasks" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/dashboard/standups" element={<ProtectedRoute><StandupLogs /></ProtectedRoute>} />
          <Route path="/dashboard/feedback" element={<ProtectedRoute><FeedbackSystem /></ProtectedRoute>} />
          <Route path="/dashboard/events" element={<ProtectedRoute><TeamEvents /></ProtectedRoute>} />
          <Route path="/dashboard/performance" element={<ProtectedRoute><PerformanceScores /></ProtectedRoute>} />
          <Route path="/dashboard/reports" element={<ProtectedRoute><AdminReport /></ProtectedRoute>} />
          <Route path="/dashboard/birthdays" element={<ProtectedRoute><BirthdayReminders /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
