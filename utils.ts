// utils.ts
// Pure utility functions for AttendanceTracker

import { format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Returns attendance status based on the current time of day.
 * 06:00–10:59 → present
 * 11:00–16:59 → late
 * 17:00+      → absent
 */
export const getCurrentTimeBasedStatus = (date = new Date()): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes >= 360 && totalMinutes < 660) return 'present'; // 6:00–10:59
  if (totalMinutes >= 660 && totalMinutes < 1020) return 'late';   // 11:00–16:59
  return 'absent';
};

/**
 * Returns a UI-friendly label and color for the current time window.
 */
export const getTimeBasedMessage = () => {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 6 && hours < 11) {
    return { status: 'Present', message: 'Mark now', color: 'text-blue-500' };
  } else if (hours >= 11 && hours < 17) {
    return { status: 'Late', message: 'Late', color: 'text-gray-400' };
  } else if (hours >= 17) {
    return { status: 'Absent', message: 'Absent', color: 'text-gray-500' };
  } else {
    return { status: 'Early', message: 'Attendance opens at 6 AM', color: 'text-gray-500' };
  }
};

/**
 * Returns the Tailwind CSS classes for a given attendance status badge.
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'present':
      return 'bg-blue-500 text-white border-blue-500';
    case 'absent':
      return 'bg-gray-700 text-white border-gray-700';
    case 'late':
      return 'bg-gray-500 text-white border-gray-500';
    default:
      return 'bg-gray-600 text-white border-gray-600';
  }
};

/**
 * Computes monthly attendance stats for a given set of records.
 */
export const computeMonthlyStats = (
  monthlyAttendance: any[],
  selectedMonth: Date,
  adminId?: string
) => {
  const relevantAttendance = adminId
    ? monthlyAttendance.filter(a => a.admin_id === adminId)
    : monthlyAttendance;

  const present = relevantAttendance.filter(a => a.status === 'present').length;
  const late = relevantAttendance.filter(a => a.status === 'late').length;

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === selectedMonth.getMonth() &&
    today.getFullYear() === selectedMonth.getFullYear();

  const totalDays = isCurrentMonth
    ? today.getDate()
    : endOfMonth(selectedMonth).getDate();

  const absent = Math.max(totalDays - (present + late), 0);
  const score = present + late * 0.5;
  const percentage = totalDays > 0 ? Math.round((score / totalDays) * 100) : 0;

  return { present, late, absent, totalDays, score, percentage };
};

/**
 * Computes today's overall attendance stats across all admins.
 */
export const computeAttendanceStats = (allAdmins: any[], todayAttendance: any[]) => {
  const total = allAdmins.length;
  const present = todayAttendance.filter(a => a.status === 'present').length;
  const absent = todayAttendance.filter(a => a.status === 'absent').length;
  const late = todayAttendance.filter(a => a.status === 'late').length;
  const notMarked = total - todayAttendance.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, late, notMarked, percentage };
};

/**
 * Builds and triggers a CSV download for the given attendance records.
 */
export const buildAndDownloadCSV = (
  data: any[],
  allAdmins: any[],
  adminId: string | undefined,
  selectedMonth: Date
) => {
  const headers = ['Date', 'Admin Name', 'Email', 'Role', 'Status', 'Check-in Time', 'Reason'];
  const rows = (data || []).map(record => [
    record.date,
    record.admin?.name || 'Unknown',
    record.admin?.email || '',
    record.admin?.role?.replace('_', ' ') || '',
    record.status,
    record.marked_at ? format(new Date(record.marked_at), 'HH:mm:ss') : '',
    record.reason || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const adminName = adminId
    ? allAdmins.find(a => a.id === adminId)?.name || 'admin'
    : 'all-admins';
  link.download = `attendance-${adminName}-${format(selectedMonth, 'yyyy-MM')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
