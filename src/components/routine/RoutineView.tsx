import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, User, Video, ExternalLink, Sparkles } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { RoutineItem } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';

export const RoutineView: React.FC = () => {
  const days = [
    { num: 1, name: 'Mon', full: 'Monday' },
    { num: 2, name: 'Tue', full: 'Tuesday' },
    { num: 3, name: 'Wed', full: 'Wednesday' },
    { num: 4, name: 'Thu', full: 'Thursday' },
    { num: 5, name: 'Fri', full: 'Friday' },
    { num: 6, name: 'Sat', full: 'Saturday' },
    { num: 7, name: 'Sun', full: 'Sunday' },
  ];

  // Determine current day of week (1=Mon ... 7=Sun)
  const currentJsDay = new Date().getDay(); // 0 is Sunday
  const todayDayNum = currentJsDay === 0 ? 7 : currentJsDay;

  const [selectedDay, setSelectedDay] = useState<number>(todayDayNum);
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    dataService.getRoutine().then((data) => {
      setRoutineItems(data);
      setIsLoading(false);
    });
  }, []);

  const filteredItems = routineItems.filter((item) => Number(item.day_of_week) === selectedDay);

  return (
    <div className="space-y-4 pb-20">
      {/* Weekday Switcher Bar */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 gap-1 overflow-x-auto no-scrollbar shadow-xs">
        {days.map((d) => {
          const isSelected = selectedDay === d.num;
          const isToday = todayDayNum === d.num;

          return (
            <button
              key={d.num}
              onClick={() => setSelectedDay(d.num)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center min-w-[42px] ${
                isSelected
                  ? 'bg-[#3157D5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{d.name}</span>
              {isToday && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    isSelected ? 'bg-white' : 'bg-[#3157D5] animate-pulse'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Routine list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#3157D5]" />
            {days.find((d) => d.num === selectedDay)?.full} Schedule
          </h3>
          {selectedDay === todayDayNum && (
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
              Today
            </span>
          )}
        </div>

        {isLoading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={`No classes on ${days.find((d) => d.num === selectedDay)?.full}`}
            description="Use this time for revision, reviewing formula banks, or taking mock test series."
          />
        ) : (
          filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3157D5] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {item.subject}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                    {item.topic || `${item.subject} Regular Lecture`}
                  </h4>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {item.start_time} - {item.end_time}
                  </span>
                </div>
              </div>

              {item.teacher_name && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Educator: <span className="font-semibold text-slate-900">{item.teacher_name}</span></span>
                </div>
              )}

              {item.description && (
                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              )}

              {item.room_link && (
                <button
                  onClick={() => window.open(item.room_link, '_blank', 'noopener,noreferrer')}
                  className="w-full py-2.5 px-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-[#3157D5] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs"
                >
                  <Video className="w-3.5 h-3.5 text-[#3157D5]" />
                  <span>Join Live Lecture Room</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
