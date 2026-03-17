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
