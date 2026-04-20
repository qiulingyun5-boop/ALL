
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Dumbbell, History } from 'lucide-react';
import { getLocalDateString } from '../lib/dateUtils';
import { WorkoutLog, Exercise } from '../types';
import { EXERCISES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';

interface WorkoutCalendarProps {
  logs: WorkoutLog[];
}

export default function WorkoutCalendar({ logs }: WorkoutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(getLocalDateString());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('zh-CN', { month: 'long' });

  const getDayLogs = (dateStr: string) => {
    return logs.filter(log => getLocalDateString(log.timestamp) === dateStr);
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= days; i++) {
    calendarDays.push(i);
  }

  const selectedDateLogs = selectedDate ? getDayLogs(selectedDate) : [];

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#E63946]" />
            <h3 className="font-bold">{year}年 {monthName}</h3>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <span key={d} className="text-[10px] font-bold text-zinc-400 uppercase">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasLogs = getDayLogs(dateStr).length > 0;
              const isSelected = selectedDate === dateStr;
              const isToday = getLocalDateString() === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative h-10 w-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    isSelected ? 'bg-zinc-900 text-white shadow-lg' : 
                    isToday ? 'bg-zinc-100 text-[#E63946] font-black' : 'hover:bg-zinc-50'
                  }`}
                >
                  {day}
                  {hasLogs && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-[#E63946] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-bold text-zinc-500">
              {selectedDate === getLocalDateString() ? '今日训练' : `${selectedDate} 详情`}
            </h4>
            <span className="text-[10px] font-bold bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-400">
              {selectedDateLogs.length} 条记录
            </span>
          </div>

          {selectedDateLogs.length === 0 ? (
            <div className="bg-zinc-50 rounded-3xl p-8 text-center border-2 border-dashed border-zinc-100">
              <Dumbbell className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">该日无训练记录，快去变身吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(
                selectedDateLogs.reduce((acc, log) => {
                  if (!acc[log.exerciseId]) acc[log.exerciseId] = [];
                  acc[log.exerciseId].push(log);
                  return acc;
                }, {} as Record<string, WorkoutLog[]>)
              ).map(([exId, exLogs]) => {
                const exercise = EXERCISES.find(e => e.id === exId);
                return (
                  <Card key={exId} className="border-none shadow-sm rounded-2xl bg-white p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#E63946] rounded-full" />
                        <span className="font-bold text-sm">{exercise?.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[8px] bg-zinc-50 text-zinc-500 border-none">
                        {exLogs.length} 组
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {exLogs.map((log, i) => (
                        <div key={log.id} className="flex items-center justify-between text-[10px] text-zinc-500 bg-zinc-50/50 p-1.5 rounded-lg px-3">
                          <span className="font-bold opacity-30">SET {i + 1}</span>
                          {log.weight !== undefined && (
                            <span>{log.weight}kg × {log.reps}次</span>
                          )}
                          {log.duration !== undefined && (
                            <span>{log.duration}min (速度 {log.speed})</span>
                          )}
                          <span className="text-[#FFB703] font-bold">{Math.round(log.caloriesBurned)} kcal</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
