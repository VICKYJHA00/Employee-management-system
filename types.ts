// types.ts
// Shared TypeScript interfaces and constants for AttendanceTracker

export const CHART_COLORS = ['#3b82f6', '#6b7280', '#1f2937'];

export interface AttendanceRecord {
  id: string;
  admin_id: string;
  date: string;
  status: string;
  check_in_time: string | null;
  marked_at: string | null;
  reason: string | null;
  override_status: string | null;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  admin?: { name: string; email: string; role: string };
}
