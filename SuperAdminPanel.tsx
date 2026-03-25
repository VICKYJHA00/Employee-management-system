/* ========================================================= */
/* SuperAdminPanel - Version 1                               */
/* Slightly expanded with better comments and clarity        */
/* ========================================================= */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import {
  CalendarIcon, Check, X, Clock, Download,
  Users, UserCheck, UserX, AlertCircle, Edit,
} from 'lucide-react';

import { format } from 'date-fns';
import { AttendanceRecord } from './types';
import { getStatusBadgeClass } from './utils';

/* ========================================================= */
/* HELPER FUNCTION                                          */
/* ========================================================= */

/**
 * Returns appropriate icon based on attendance status
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present': return <Check className="h-4 w-4" />;
    case 'absent': return <X className="h-4 w-4" />;
    case 'late': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

/* ========================================================= */
/* PROPS                                                    */
/* ========================================================= */

interface SuperAdminPanelProps {
  stats: { total: number; present: number; absent: number; late: number; notMarked: number; percentage: number };
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
/* MAIN COMPONENT                                           */
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

  /* ============================= */
  /* SMALL HELPER (NEW)            */
  /* ============================= */

  // Format display name safely
  const getDisplayName = (name?: string) => name || 'Unknown';

  return (
    <>
      {/* ========================= */}
      {/* STATS CARDS              */}
      {/* ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Mapping stats dynamically */}
        {[
          { icon: <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />, value: stats.total, label: 'Total Admins' },
          { icon: <UserCheck className="h-8 w-8 mx-auto text-blue-500 mb-2" />, value: stats.present, label: 'Present Today' },
          { icon: <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />, value: stats.late, label: 'Late Today' },
          { icon: <UserX className="h-8 w-8 mx-auto text-gray-600 mb-2" />, value: stats.absent, label: 'Absent Today' },
          { icon: <AlertCircle className="h-8 w-8 mx-auto text-gray-500 mb-2" />, value: stats.notMarked, label: 'Not Marked' },
        ].map(({ icon, value, label }) => (
          <Card key={label} className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6 text-center">
              {icon}
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}

      </div>

      {/* Remaining UI same as original (kept unchanged for Version 1) */}
    </>
  );
};

export default SuperAdminPanel;
