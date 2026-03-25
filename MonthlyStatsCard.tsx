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
import { CalendarIcon, TrendingUp, Activity } from 'lucide-react';
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

/**
 * Represents monthly attendance statistics
 */
interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  score: number;
  percentage: number;
}

/**
 * Props for MonthlyStatsCard component
 */
interface Props {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  myStats: MonthlyStats;
}

/* ===================================================== */
/* HELPER COMPONENTS                                     */
/* ===================================================== */

/**
 * Small reusable stat box UI
 */
const StatBox = ({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number | string;
  colorClass: string;
}) => {
  return (
    <div className={`text-center p-4 rounded-xl border ${colorClass}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
};

/**
 * Displays small insights (like performance level)
 */
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

/* ===================================================== */
/* MAIN COMPONENT                                        */
/* ===================================================== */

const MonthlyStatsCard: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  myStats,
}) => {

  /* ============================= */
  /* CHART DATA                    */
  /* ============================= */

  // Prepare data for pie chart visualization
  const chartData = useMemo(() => [
    { name: 'Present', value: myStats.present, color: CHART_COLORS[0] },
    { name: 'Late', value: myStats.late, color: CHART_COLORS[1] },
    { name: 'Absent', value: myStats.absent, color: CHART_COLORS[2] },
  ], [myStats]);

  /* ============================= */
  /* DERIVED INSIGHTS              */
  /* ============================= */

  // Determine best performance insight
  const bestMetric = useMemo(() => {
    if (myStats.present >= myStats.late && myStats.present >= myStats.absent) {
      return "Great consistency";
    }
    if (myStats.late > myStats.present) {
      return "Improve punctuality";
    }
    return "Needs improvement";
  }, [myStats]);

  // Determine overall performance level
  const performanceLevel = useMemo(() => {
    if (myStats.percentage >= 85) return "Excellent";
    if (myStats.percentage >= 70) return "Good";
    if (myStats.percentage >= 50) return "Average";
    return "Poor";
  }, [myStats]);

  /* ============================= */
  /* EXTRA SMALL HELPER (NEW)      */
  /* ============================= */

  // Safe percentage (avoids NaN edge cases)
  const safePercentage = myStats.totalDays > 0 ? myStats.percentage : 0;

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
      {/* MAIN STATS CARD          */}
      {/* ========================= */}
      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-lg">
        <CardHeader>
          <div className="flex items-center justify-between">

            {/* Title Section */}
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Monthly Analytics
              </CardTitle>

              <CardDescription className="text-gray-400">
                {format(selectedMonth, 'MMMM yyyy')}
              </CardDescription>
            </div>

            {/* Month Picker */}
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

          {/* Empty State */}
          {isEmpty && (
            <div className="text-center text-gray-500 py-6">
              No attendance data available
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBox label="Present" value={myStats.present} colorClass="bg-blue-500/10 border-blue-500/20 text-blue-500" />
            <StatBox label="Late" value={myStats.late} colorClass="bg-yellow-500/10 border-yellow-500/20 text-yellow-400" />
            <StatBox label="Absent" value={myStats.absent} colorClass="bg-red-500/10 border-red-500/20 text-red-400" />
            <StatBox label="Score %" value={`${safePercentage}%`} colorClass="bg-gray-800 border-gray-700 text-white" />
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Performance Score</span>
              <span>{myStats.score.toFixed(1)} / {myStats.totalDays}</span>
            </div>

            <Progress value={safePercentage} className="h-2" />

            <p className="text-xs text-gray-500 text-center">
              Present = 1, Late = 0.5, Absent = 0
            </p>
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
            <Activity className="h-5 w-5 text-purple-500" />
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
