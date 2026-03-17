// SuperAdminPanel.tsx
// UI component — shown only to super admins; includes stats cards, records table,
// override dialog, export controls, and the all-admins today status grid.

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present': return <Check className="h-4 w-4" />;
    case 'absent': return <X className="h-4 w-4" />;
    case 'late': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

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
  // Override dialog
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

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
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
}) => (
  <>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {[
        { icon: <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />, value: stats.total, label: 'Total Admins', color: 'text-white' },
        { icon: <UserCheck className="h-8 w-8 mx-auto text-blue-500 mb-2" />, value: stats.present, label: 'Present Today', color: 'text-blue-500' },
        { icon: <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />, value: stats.late, label: 'Late Today', color: 'text-gray-400' },
        { icon: <UserX className="h-8 w-8 mx-auto text-gray-600 mb-2" />, value: stats.absent, label: 'Absent Today', color: 'text-gray-500' },
        { icon: <AlertCircle className="h-8 w-8 mx-auto text-gray-500 mb-2" />, value: stats.notMarked, label: 'Not Marked', color: 'text-gray-400' },
      ].map(({ icon, value, label, color }) => (
        <Card key={label} className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="text-center">
              {icon}
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Date Picker, Export & Records Table */}
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <CardTitle className="text-white">Attendance Records</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Export Admin Selector */}
            <Select value={selectedAdminForExport} onValueChange={setSelectedAdminForExport}>
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Export for..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all">All Admins</SelectItem>
                {allAdmins.map(admin => (
                  <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => onExportCSV(selectedAdminForExport === 'all' ? undefined : selectedAdminForExport)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attendanceData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No attendance records for {format(selectedDate, 'PPP')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-400">Admin</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Check-in Time</TableHead>
                <TableHead className="text-gray-400">Reason</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((record) => (
                <TableRow key={record.id} className="border-gray-800">
                  <TableCell className="text-white font-medium">{record.admin?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-gray-400">{record.admin?.role?.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge className={`flex items-center gap-1 w-fit ${getStatusBadgeClass(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                    {record.override_status && (
                      <p className="text-xs text-gray-500 mt-1">Overridden: {record.override_reason}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {record.marked_at ? format(new Date(record.marked_at), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell className="text-gray-400">{record.reason || '-'}</TableCell>
                  <TableCell>
                    <Dialog
                      open={showOverrideDialog && selectedRecordForOverride?.id === record.id}
                      onOpenChange={(open) => {
                        setShowOverrideDialog(open);
                        if (!open) {
                          setSelectedRecordForOverride(null);
                          setOverrideStatus('present');
                          setOverrideReason('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecordForOverride(record);
                            setOverrideStatus(record.status);
                          }}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Override
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Override Attendance Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="p-4 rounded-lg bg-gray-800/50">
                            <p className="font-medium text-white">{record.admin?.name}</p>
                            <p className="text-sm text-gray-400">Current: {record.status}</p>
                            <p className="text-sm text-gray-400">Date: {record.date}</p>
                          </div>
                          <div>
                            <Label className="text-gray-300">New Status</Label>
                            <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-800">
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-gray-300">Reason for Override *</Label>
                            <Textarea
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e.target.value)}
                              placeholder="Please provide a reason..."
                              rows={2}
                              className="mt-1 bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowOverrideDialog(false)}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={onOverride}
                              disabled={isLoading}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              {isLoading ? 'Updating...' : 'Update Status'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* All Admins Today Status Grid */}
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Today's Status - All Admins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAdmins.map((admin) => {
            const attendance = todayAttendance.find(a => a.admin_id === admin.id);
            const status = attendance?.status || 'not_marked';
            return (
              <div key={admin.id} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{admin.name}</p>
                    <p className="text-xs text-gray-500">{admin.role?.replace('_', ' ')}</p>
                  </div>
                  <Badge className={`${getStatusBadgeClass(status)} flex items-center gap-1`}>
                    {getStatusIcon(status)}
                    {status === 'not_marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
                {attendance?.marked_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Checked in at {format(new Date(attendance.marked_at), 'hh:mm a')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  </>
);

export default SuperAdminPanel;
