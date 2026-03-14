
-- =============================================
-- PERFORMANCE INDEXES FOR 5000+ USERS
-- =============================================

-- admins table
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_status ON public.admins(status);

-- attendance table
CREATE INDEX IF NOT EXISTS idx_attendance_admin_id ON public.attendance(admin_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_admin_date ON public.attendance(admin_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- tech_work_logs table
CREATE INDEX IF NOT EXISTS idx_tech_work_logs_admin_id ON public.tech_work_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_tech_work_logs_created_at ON public.tech_work_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tech_work_logs_admin_created ON public.tech_work_logs(admin_id, created_at);

-- content_work_logs table
CREATE INDEX IF NOT EXISTS idx_content_work_logs_admin_id ON public.content_work_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_content_work_logs_created_at ON public.content_work_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_content_work_logs_admin_created ON public.content_work_logs(admin_id, created_at);

-- admin_notifications table
CREATE INDEX IF NOT EXISTS idx_admin_notifications_sender_id ON public.admin_notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient_type ON public.admin_notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- admin_activity_logs table
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- admin_todos table
CREATE INDEX IF NOT EXISTS idx_admin_todos_admin_id ON public.admin_todos(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_todos_due_date ON public.admin_todos(due_date);

-- chat_messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- leave_requests table
CREATE INDEX IF NOT EXISTS idx_leave_requests_admin_id ON public.leave_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_date ON public.leave_requests(leave_date);

-- leave_balances table
CREATE INDEX IF NOT EXISTS idx_leave_balances_admin_id ON public.leave_balances(admin_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- otp_sessions table
CREATE INDEX IF NOT EXISTS idx_otp_sessions_admin_id ON public.otp_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_login_email ON public.otp_sessions(login_email);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_expires_at ON public.otp_sessions(expires_at);

-- audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- monthly_attendance_reviews table
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_admin_id ON public.monthly_attendance_reviews(admin_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_year_month ON public.monthly_attendance_reviews(year, month);

-- notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_admin_id ON public.notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- certificates table
CREATE INDEX IF NOT EXISTS idx_certificates_issued_by ON public.certificates(issued_by);

-- internships table
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_mentor_id ON public.internships(mentor_id);

-- career_applications table
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_created_at ON public.career_applications(created_at DESC);

-- admin_employee_data table
CREATE INDEX IF NOT EXISTS idx_admin_employee_data_admin_id ON public.admin_employee_data(admin_id);

-- admin_settings table
CREATE INDEX IF NOT EXISTS idx_admin_settings_admin_id ON public.admin_settings(admin_id);

-- social_media_analytics table
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_date ON public.social_media_analytics(date);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_platform ON public.social_media_analytics(platform);

-- esports_players table
CREATE INDEX IF NOT EXISTS idx_esports_players_tournament ON public.esports_players(tournament_name);

-- files table
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);

-- holidays table
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
