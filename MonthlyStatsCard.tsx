import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Progress } from '@/components/ui/progress';
import { CalendarIcon, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { CHART_COLORS } from './types';

/* ===================================================== */
/* TYPES                                                 */
/* ===================================================== */

interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  score: number;
  percentage: number;
}

interface Props {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  myStats: MonthlyStats;
}

/* ===================================================== */
/* UTILITY FUNCTIONS                                     */
/* ===================================================== */

const calculateRatio = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const getPerformanceLevel = (percentage: number) => {
  if (percentage >= 85) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 50) return "Average";
  return "Poor";
};

const getPerformanceColor = (percentage: number) => {
  if (percentage >= 85) return "text-green-400";
  if (percentage >= 70) return "text-blue-400";
  if (percentage >= 50) return "text-yellow-400";
  return "text-red-400";
};

/* ===================================================== */
/* HELPER COMPONENTS                                     */
/* ===================================================== */

const StatBox = ({
  label,
  value,
  percentage,
  colorClass,
}: {
  label: string;
  value: number;
  percentage?: number;
  colorClass: string;
}) => {
  return (
    <div className={`text-center p-4 rounded-xl border ${colorClass}`}>
      <p className="text-2xl font-bold">{value}</p>

      {percentage !== undefined && (
        <p className="text-[10px] text-gray-400">{percentage}%</p>
      )}

      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
};

const InsightBox = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => (
  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
    <p className="text-xs text-gray-400">{title}</p>
    <p className="text-sm font-semibold text-white">{value}</p>
  </div>
);

/* NEW COMPONENT */
const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between text-sm text-gray-400">
    <span>{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);

/* ===================================================== */
/* MAIN COMPONENT                                        */
/* ===================================================== */

const MonthlyStatsCard: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  myStats,
}) => {

  /* ============================= */
  /* SAFE VALUES                   */
  /* ============================= */

  const safePercentage =
    myStats.totalDays > 0 ? myStats.percentage : 0;

  /* ============================= */
  /* CHART DATA                    */
  /* ============================= */

  const chartData = useMemo(() => [
    { name: 'Present', value: myStats.present, color: CHART_COLORS[0] },
    { name: 'Late', value: myStats.late, color: CHART_COLORS[1] },
    { name: 'Absent', value: myStats.absent, color: CHART_COLORS[2] },
  ], [myStats]);

  /* ============================= */
  /* DERIVED DATA                  */
  /* ============================= */

  const presentRatio = calculateRatio(myStats.present, myStats.totalDays);
  const lateRatio = calculateRatio(myStats.late, myStats.totalDays);
  const absentRatio = calculateRatio(myStats.absent, myStats.totalDays);

  const performanceLevel = getPerformanceLevel(safePercentage);
  const performanceColor = getPerformanceColor(safePercentage);

  /* ============================= */
  /* INSIGHTS                      */
  /* ============================= */

  const bestMetric = useMemo(() => {
    if (myStats.present >= myStats.late && myStats.present >= myStats.absent) {
      return "Great consistency";
    }
    if (myStats.late > myStats.present) {
      return "Improve punctuality";
    }
    return "Needs improvement";
  }, [myStats]);

  const attendanceMessage = useMemo(() => {
    if (safePercentage >= 85) return "Outstanding performance 🚀";
    if (safePercentage >= 70) return "Keep pushing forward 👍";
    if (safePercentage >= 50) return "Consistency needed ⚡";
    return "Focus required ⚠️";
  }, [safePercentage]);

  /* ============================= */
  /* EMPTY STATE                   */
  /* ============================= */

  const isEmpty =
    myStats.present === 0 &&
    myStats.late === 0 &&
    myStats.absent === 0;

  /* ===================================================== */
  /* RENDER                                                */
  /* ===================================================== */

  return (
    <div className="space-y-6">

      {/* ========================= */}
      {/* MAIN ANALYTICS CARD      */}
      {/* ========================= */}
      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-lg">
        <CardHeader>
          <div className="flex items-center justify-between">

            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Monthly Analytics
              </CardTitle>

              <CardDescription className="text-gray-400">
                {format(selectedMonth, 'MMMM yyyy')}
              </CardDescription>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </PopoverTrigger>

              <PopoverContent className="bg-gray-900 border-gray-800">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(d) => d && setSelectedMonth(d)}
                />
              </PopoverContent>
            </Popover>

          </div>
        </CardHeader>

        <CardContent>

          {/* Empty */}
          {isEmpty && (
            <div className="text-center text-gray-500 py-6">
              No attendance data available
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBox label="Present" value={myStats.present} percentage={presentRatio} colorClass="bg-blue-500/10 border-blue-500/20 text-blue-500" />
            <StatBox label="Late" value={myStats.late} percentage={lateRatio} colorClass="bg-yellow-500/10 border-yellow-500/20 text-yellow-400" />
            <StatBox label="Absent" value={myStats.absent} percentage={absentRatio} colorClass="bg-red-500/10 border-red-500/20 text-red-400" />
            <StatBox label="Score %" value={safePercentage} colorClass="bg-gray-800 border-gray-700 text-white" />
          </div>

          {/* Progress */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Performance Score</span>
              <span>{myStats.score.toFixed(1)} / {myStats.totalDays}</span>
            </div>

            <Progress value={safePercentage} className="h-2" />

            <p className="text-xs text-center text-gray-400">
              {attendanceMessage}
            </p>
          </div>

          {/* NEW: SUMMARY SECTION */}
          <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-700 space-y-2">
            <SummaryRow label="Total Days" value={myStats.totalDays} />
            <SummaryRow label="Present Days" value={myStats.present} />
            <SummaryRow label="Late Days" value={myStats.late} />
            <SummaryRow label="Absent Days" value={myStats.absent} />
            <SummaryRow label="Performance" value={
              <span className={performanceColor}>{performanceLevel}</span>
            } />
          </div>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <InsightBox title="Performance Level" value={performanceLevel} />
            <InsightBox title="Insight" value={bestMetric} />
          </div>

        </CardContent>
      </Card>

      {/* ========================= */}
      {/* PIE CHART CARD           */}
      {/* ========================= */}
      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Attendance Distribution
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="h-[250px]">

            {!isEmpty ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>

                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />

                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No chart data available
              </div>
            )}

          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default MonthlyStatsCard;
