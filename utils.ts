// ============================================================
// utils.ts
// Advanced Utility Functions for Attendance Tracker System
// ============================================================

import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  admin_id?: string;
  marked_at?: string;
  reason?: string;
  admin?: Admin;
}

export interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  score: number;
  percentage: number;
}

// ============================================================
// TIME BASED UTILITIES
// ============================================================

/**
 * Convert time into total minutes
 */
export const convertToMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

/**
 * Returns attendance status based on time
 */
export const getCurrentTimeBasedStatus = (date = new Date()): AttendanceStatus => {
  const totalMinutes = convertToMinutes(date.getHours(), date.getMinutes());

  if (totalMinutes >= 360 && totalMinutes < 660) return 'present';
  if (totalMinutes >= 660 && totalMinutes < 1020) return 'late';
  return 'absent';
};

/**
 * Get readable message for UI
 */
export const getTimeBasedMessage = () => {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 6 && hours < 11) {
    return { status: 'Present', message: 'Mark now', color: 'text-blue-500' };
  }
  if (hours >= 11 && hours < 17) {
    return { status: 'Late', message: 'Late Entry', color: 'text-yellow-500' };
  }
  if (hours >= 17) {
    return { status: 'Absent', message: 'Marked Absent', color: 'text-red-500' };
  }

  return { status: 'Early', message: 'Attendance opens at 6 AM', color: 'text-gray-400' };
};

// ============================================================
// STATUS UTILITIES
// ============================================================

export const getStatusBadgeClass = (status: AttendanceStatus): string => {
  const base = 'px-3 py-1 rounded-full text-sm font-medium border';

  const styles: Record<AttendanceStatus, string> = {
    present: `${base} bg-blue-500 text-white border-blue-500`,
    late: `${base} bg-yellow-500 text-black border-yellow-500`,
    absent: `${base} bg-red-500 text-white border-red-500`,
  };

  return styles[status] || `${base} bg-gray-500 text-white`;
};

/**
 * Get readable label
 */
export const getStatusLabel = (status: AttendanceStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// ============================================================
// DATE UTILITIES
// ============================================================

export const getMonthRange = (date: Date) => ({
  start: startOfMonth(date),
  end: endOfMonth(date),
});

export const isToday = (date: string) => {
  return isSameDay(parseISO(date), new Date());
};

export const isCurrentMonth = (date: Date) => {
  return isSameMonth(date, new Date());
};

// ============================================================
// VALIDATION UTILITIES
// ============================================================

export const isValidAttendanceRecord = (record: any): record is AttendanceRecord => {
  return (
    record &&
    typeof record.date === 'string' &&
    ['present', 'late', 'absent'].includes(record.status)
  );
};

// ============================================================
// STATISTICS UTILITIES
// ============================================================

export const computeMonthlyStats = (
  monthlyAttendance: AttendanceRecord[],
  selectedMonth: Date,
  adminId?: string
): MonthlyStats => {
  const filtered = adminId
    ? monthlyAttendance.filter(a => a.admin_id === adminId)
    : monthlyAttendance;

  const present = filtered.filter(a => a.status === 'present').length;
  const late = filtered.filter(a => a.status === 'late').length;

  const today = new Date();
  const totalDays = isSameMonth(today, selectedMonth)
    ? today.getDate()
    : endOfMonth(selectedMonth).getDate();

  const absent = Math.max(totalDays - (present + late), 0);
  const score = present + late * 0.5;

  const percentage = totalDays > 0
    ? Math.round((score / totalDays) * 100)
    : 0;

  return { present, late, absent, totalDays, score, percentage };
};

/**
 * Compute today's stats
 */
export const computeAttendanceStats = (
  allAdmins: Admin[],
  todayAttendance: AttendanceRecord[]
) => {
  const total = allAdmins.length;

  const counts = {
    present: 0,
    late: 0,
    absent: 0,
  };

  todayAttendance.forEach(record => {
    if (counts[record.status] !== undefined) {
      counts[record.status]++;
    }
  });

  const notMarked = total - todayAttendance.length;

  const percentage = total > 0
    ? Math.round((counts.present / total) * 100)
    : 0;

  return {
    total,
    ...counts,
    notMarked,
    percentage,
  };
};

// ============================================================
// CSV UTILITIES
// ============================================================

/**
 * Escape CSV values safely
 */
export const escapeCSV = (value: any): string => {
  return `"${String(value).replace(/"/g, '""')}"`;
};

/**
 * Convert data to CSV string
 */
export const convertToCSV = (data: AttendanceRecord[]): string => {
  const headers = ['Date', 'Name', 'Email', 'Role', 'Status', 'Time', 'Reason'];

  const rows = data.map(record => [
    record.date,
    record.admin?.name || 'Unknown',
    record.admin?.email || '',
    record.admin?.role || '',
    record.status,
    record.marked_at ? format(new Date(record.marked_at), 'HH:mm:ss') : '',
    record.reason || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Main CSV builder
 */
export const buildAndDownloadCSV = (
  data: AttendanceRecord[],
  allAdmins: Admin[],
  adminId: string | undefined,
  selectedMonth: Date
) => {
  const csv = convertToCSV(data);

  const adminName = adminId
    ? allAdmins.find(a => a.id === adminId)?.name || 'admin'
    : 'all-admins';

  const filename = `attendance-${adminName}-${format(selectedMonth, 'yyyy-MM')}.csv`;

  downloadCSV(csv, filename);
};

// ============================================================
// LOGGING UTILITIES (DEBUGGING)
// ============================================================

export const logInfo = (message: string, data?: any) => {
  console.log(`[INFO]: ${message}`, data || '');
};

export const logError = (message: string, error?: any) => {
  console.error(`[ERROR]: ${message}`, error || '');
};

// ============================================================
// PERFORMANCE UTILITIES
// ============================================================

export const debounce = (func: Function, delay: number) => {
  let timeout: any;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// ============================================================
// END OF FILE
// ============================================================
