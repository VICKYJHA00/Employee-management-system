
-- 1. Announcements Board
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  target_roles text[] DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view announcements" ON public.announcements FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Super admins can manage announcements" ON public.announcements FOR ALL USING (is_super_admin(auth.uid()));
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Polls & Surveys
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  is_anonymous boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid REFERENCES public.admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view polls" ON public.polls FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Super admins can manage polls" ON public.polls FOR ALL USING (is_super_admin(auth.uid()));
CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON public.polls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES public.admins(id) NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, admin_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view poll votes" ON public.poll_votes FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can vote" ON public.poll_votes FOR INSERT WITH CHECK (
  admin_id = (SELECT id FROM admins WHERE user_id = auth.uid())
);

-- 3. Kanban Task Board
CREATE TABLE public.kanban_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES public.admins(id),
  created_by uuid REFERENCES public.admins(id),
  due_date date,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view kanban tasks" ON public.kanban_tasks FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage their tasks" ON public.kanban_tasks FOR ALL USING (
  assigned_to = (SELECT id FROM admins WHERE user_id = auth.uid()) OR
  created_by = (SELECT id FROM admins WHERE user_id = auth.uid()) OR
  is_super_admin(auth.uid())
);
CREATE TRIGGER update_kanban_tasks_updated_at BEFORE UPDATE ON public.kanban_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Daily Standup Logs
CREATE TABLE public.standup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admins(id) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  yesterday text,
  today text NOT NULL,
  blockers text,
  mood text DEFAULT 'neutral',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(admin_id, date)
);
ALTER TABLE public.standup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view standups" ON public.standup_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can create their standup" ON public.standup_logs FOR INSERT WITH CHECK (
  admin_id = (SELECT id FROM admins WHERE user_id = auth.uid())
);
CREATE POLICY "Super admins can manage all standups" ON public.standup_logs FOR ALL USING (is_super_admin(auth.uid()));

-- 5. Feedback System
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_admin_id uuid REFERENCES public.admins(id),
  to_admin_id uuid REFERENCES public.admins(id),
  subject text NOT NULL,
  message text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  response text,
  responded_by uuid REFERENCES public.admins(id),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view relevant feedback" ON public.feedback FOR SELECT USING (
  from_admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()) OR
  to_admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()) OR
  is_super_admin(auth.uid())
);
CREATE POLICY "Admins can create feedback" ON public.feedback FOR INSERT WITH CHECK (
  from_admin_id = (SELECT id FROM admins WHERE user_id = auth.uid())
);
CREATE POLICY "Super admins can manage feedback" ON public.feedback FOR ALL USING (is_super_admin(auth.uid()));
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Team Events / Calendar
CREATE TABLE public.team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL DEFAULT 'meeting',
  location text,
  is_all_day boolean NOT NULL DEFAULT false,
  target_roles text[] DEFAULT '{}',
  created_by uuid REFERENCES public.admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view events" ON public.team_events FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Super admins can manage events" ON public.team_events FOR ALL USING (is_super_admin(auth.uid()));
CREATE TRIGGER update_team_events_updated_at BEFORE UPDATE ON public.team_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Performance Scores (auto-calculated)
CREATE TABLE public.performance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admins(id) NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  attendance_score numeric DEFAULT 0,
  work_log_score numeric DEFAULT 0,
  punctuality_score numeric DEFAULT 0,
  overall_score numeric DEFAULT 0,
  remarks text,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(admin_id, month, year)
);
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view own scores" ON public.performance_scores FOR SELECT USING (
  admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()) OR is_super_admin(auth.uid())
);
CREATE POLICY "Super admins can manage scores" ON public.performance_scores FOR ALL USING (is_super_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX idx_polls_active ON public.polls(is_active, created_at DESC);
CREATE INDEX idx_kanban_tasks_assigned ON public.kanban_tasks(assigned_to, status);
CREATE INDEX idx_standup_logs_admin_date ON public.standup_logs(admin_id, date DESC);
CREATE INDEX idx_feedback_from ON public.feedback(from_admin_id, created_at DESC);
CREATE INDEX idx_feedback_to ON public.feedback(to_admin_id, created_at DESC);
CREATE INDEX idx_team_events_date ON public.team_events(event_date);
CREATE INDEX idx_performance_scores_admin ON public.performance_scores(admin_id, year, month);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.standup_logs;
