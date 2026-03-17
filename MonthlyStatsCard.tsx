// MonthlyStatsCard.tsx
// UI component — displays the current user's monthly attendance analytics and pie chart

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from './types';

interface MonthlyStatsCardProps {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  myStats: {
    present: number;
    late: number;
    absent: number;
    totalDays: number;
    score: number;
    percentage: number;
  };
}

const MonthlyStatsCard: React.FC<MonthlyStatsCardProps> = ({
  selectedMonth,
  setSelectedMonth,
  myStats,
}) => {
  const monthlyChartData = [
    { name: 'Present', value: myStats.present, color: CHART_COLORS[0] },
    { name: 'Late', value: myStats.late, color: CHART_COLORS[1] },
    { name: 'Absent', value: myStats.absent, color: CHART_COLORS[2] },
  ];

  return (
    <>
      {/* Stats card */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                Your Monthly Analytics
              </CardTitle>
              <CardDescription className="text-gray-400">
                {format(selectedMonth, 'MMMM yyyy')}
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Change Month
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800" align="end">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-2xl font-bold text-blue-500">{myStats.present}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-700/30 border border-gray-600/30">
              <p className="text-2xl font-bold text-gray-400">{myStats.late}</p>
              <p className="text-xs text-gray-500">Late (½ day)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
              <p className="text-2xl font-bold text-gray-500">{myStats.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-900/50 border border-gray-800">
              <p className="text-2xl font-bold text-white">{myStats.percentage}%</p>
              <p className="text-xs text-gray-500">Score</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Attendance Score</span>
              <span className="font-medium">{myStats.score.toFixed(1)} / {myStats.totalDays} days</span>
            </div>
            <Progress value={myStats.percentage} className="h-2 bg-gray-800" />
            <p className="text-xs text-gray-500 text-center">
              Present = 1 point, Late = 0.5 point, Absent = 0 point
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pie chart card */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Attendance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={monthlyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {monthlyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default MonthlyStatsCard;
