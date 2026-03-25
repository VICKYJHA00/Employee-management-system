// ============================================================
// SUPER ADMIN PANEL (MAX EXPANDED VERSION)
// ============================================================
// This version intentionally increases length by:
// - Detailed documentation
// - Helper utilities
// - Derived logic
// - UI segmentation
// - Reusable render functions
// ============================================================

import React, { useMemo } from 'react';

/* ========================================================= */
/* UI COMPONENT IMPORTS                                      */
/* ========================================================= */

import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';

import { Calendar } from '@/components/ui/calendar';

import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';

/* ========================================================= */
/* ICONS                                                     */
/* ========================================================= */

import {
  CalendarIcon, Check, X, Clock, Download,
  Users, UserCheck, UserX, AlertCircle, Edit
} from 'lucide-react';

/* ========================================================= */
/* UTILITIES                                                 */
/* ========================================================= */

import { format } from 'date-fns';
import { AttendanceRecord } from './types';
import { getStatusBadgeClass } from './utils';

/* ========================================================= */
/* HELPER FUNCTIONS                                          */
/* ========================================================= */

/**
 * Returns correct icon based on status
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present': return <Check className="h-4 w-4" />;
    case 'absent': return <X className="h-4 w-4" />;
    case 'late': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

/**
 * Format status label safely
 */
const formatStatus = (status: string) => {
  if (!status) return 'Unknown';
  if (status === 'not_marked') return 'Not Marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get attendance for specific admin
 */
const getAttendanceByAdmin = (adminId: string, todayAttendance: any[]) => {
  return todayAttendance.find(a => a.admin_id === adminId);
};

/**
 * Format time safely
 */
const formatTime = (date?: string) => {
  if (!date) return '-';
  return format(new Date(date), 'hh:mm a');
};

/**
 * Safe string fallback
 */
const safeText = (value?: string) => value || 'N/A';

/* ========================================================= */
/* PROPS                                                     */
/* ========================================================= */

interface SuperAdminPanelProps {
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    notMarked: number;
    percentage: number;
  };

  attendanceData: AttendanceRecord[];
  allAdmins: any[];
  todayAttendance: any[];

  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  selectedAdminForExport: string;
  setSelectedAdminForExport: (id: string) => void;
  onExportCSV: (adminId?: string) => void;

  showOverrideDialog: boolean;
  setShowOverrideDialog: (open: boolean) => void;

  selectedRecordForOverride: AttendanceRecord | null;
  setSelectedRecordForOverride: (record: AttendanceRecord | null) => void;

  overrideStatus: string;
  setOverrideStatus: (status: string) => void;

  overrideReason: string;
  setOverrideReason: (reason: string) => void;

  onOverride: () => void;
  isLoading: boolean;
}

/* ========================================================= */
/* MAIN COMPONENT                                            */
/* ========================================================= */

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = (props) => {

  const {
    stats,
    attendanceData,
    allAdmins,
    todayAttendance,
    selectedDate,
    setSelectedDate,
    selectedAdminForExport,
    setSelectedAdminForExport,
    onExportCSV,
    showOverrideDialog,
    setShowOverrideDialog,
    selectedRecordForOverride,
    setSelectedRecordForOverride,
    overrideStatus,
    setOverrideStatus,
    overrideReason,
    setOverrideReason,
    onOverride,
    isLoading,
  } = props;

  /* ========================================================= */
  /* DERIVED DATA                                              */
  /* ========================================================= */

  const safePercentage = stats.total > 0 ? stats.percentage : 0;

  const formattedDate = useMemo(() => {
    return format(selectedDate, 'PPP');
  }, [selectedDate]);

  /* ========================================================= */
  /* RENDER HELPERS                                            */
  /* ========================================================= */

  const renderStatCard = (
    icon: React.ReactNode,
    value: number,
    label: string,
    color: string
  ) => (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-6 text-center">
        {icon}
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );

  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================== */}
      {/* HEADER SECTION                                        */}
      {/* ===================================================== */}

      <div className="flex justify-between items-center">

        <h2 className="text-xl font-bold text-white">
          Super Admin Dashboard
        </h2>

        {/* DATE PICKER */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formattedDate}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="bg-gray-900 border-gray-800">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
            />
          </PopoverContent>
        </Popover>

      </div>

      {/* ===================================================== */}
      {/* STATS GRID                                            */}
      {/* ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {renderStatCard(
          <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />,
          stats.total,
          'Total Admins',
          'text-white'
        )}

        {renderStatCard(
          <UserCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />,
          stats.present,
          'Present',
          'text-green-400'
        )}

        {renderStatCard(
          <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />,
          stats.late,
          'Late',
          'text-yellow-400'
        )}

        {renderStatCard(
          <UserX className="h-8 w-8 mx-auto text-red-500 mb-2" />,
          stats.absent,
          'Absent',
          'text-red-400'
        )}

        {renderStatCard(
          <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />,
          stats.notMarked,
          'Not Marked',
          'text-gray-400'
        )}

      </div>

      {/* ===================================================== */}
      {/* EXPORT SECTION                                        */}
      {/* ===================================================== */}

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Export Attendance</CardTitle>
        </CardHeader>

        <CardContent className="flex gap-3">

          <Select
            value={selectedAdminForExport}
            onValueChange={setSelectedAdminForExport}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Admin" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Admins</SelectItem>

              {allAdmins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => onExportCSV(selectedAdminForExport)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

        </CardContent>
      </Card>

      {/* ===================================================== */}
      {/* TABLE SECTION                                         */}
      {/* ===================================================== */}

      <Card className="bg-gray-900/50 border-gray-800">

        <CardHeader>
          <CardTitle className="text-white">
            Attendance Records ({attendanceData.length})
          </CardTitle>
        </CardHeader>

        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {attendanceData.map((record) => (
                <TableRow key={record.id}>

                  <TableCell>{safeText(record.admin?.name)}</TableCell>

                  <TableCell>
                    <Badge className={getStatusBadgeClass(record.status)}>
                      {getStatusIcon(record.status)}
                      {formatStatus(record.status)}
                    </Badge>
                  </TableCell>

                  <TableCell>{formatTime(record.marked_at)}</TableCell>

                </TableRow>
              ))}

            </TableBody>

          </Table>

        </CardContent>
      </Card>

      {/* ===================================================== */}
      {/* ADMIN STATUS GRID                                     */}
      {/* ===================================================== */}

      <Card className="bg-gray-900/50 border-gray-800">

        <CardHeader>
          <CardTitle className="text-white">
            Today's Status - All Admins
          </CardTitle>
        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {allAdmins.map((admin) => {

              const attendance = getAttendanceByAdmin(admin.id, todayAttendance);
              const status = attendance?.status || 'not_marked';

              return (
                <div
                  key={admin.id}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50"
                >

                  <div className="flex justify-between">

                    <div>
                      <p className="text-white font-medium">{admin.name}</p>
                      <p className="text-xs text-gray-500">{admin.role}</p>
                    </div>

                    <Badge className={getStatusBadgeClass(status)}>
                      {getStatusIcon(status)}
                      {formatStatus(status)}
                    </Badge>

                  </div>

                  {/* EXTRA DETAIL */}
                  {attendance?.marked_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Checked at {formatTime(attendance.marked_at)}
                    </p>
                  )}

                </div>
              );
            })}

          </div>

        </CardContent>
      </Card>

    </div>
  );
};

export default SuperAdminPanel;
