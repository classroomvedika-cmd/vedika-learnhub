import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { LeaderboardEntry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';

export const LeaderboardView: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    dataService.getLeaderboard().then((data) => {
      setEntries(data);
      setIsLoading(false);
    });
  }, []);

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="space-y-4 pb-20">
      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Leaderboard is initializing"
          description="Scores will update automatically as students complete exams."
        />
      ) : (
        <div className="space-y-4">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center flex flex-col items-center shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-slate-300 overflow-hidden mb-1 relative flex items-center justify-center">
                    {topThree[1].student_avatar ? (
                      <img
                        src={topThree[1].student_avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-900 truncate max-w-[80px]">
                    {topThree[1].student_name}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {topThree[1].points} pts
                  </div>
                </div>
              )}

              {/* 1st Place (Center / Taller) */}
              {topThree[0] && (
                <div className="bg-gradient-to-b from-amber-50/90 to-white border-2 border-amber-300 rounded-2xl p-3 text-center flex flex-col items-center shadow-md scale-105 z-10">
                  <Crown className="w-5 h-5 text-amber-500 -mb-1 animate-bounce" />
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border-2 border-amber-400 overflow-hidden mb-1 relative flex items-center justify-center">
                    {topThree[0].student_avatar ? (
                      <img
                        src={topThree[0].student_avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-amber-600" />
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 truncate max-w-[90px]">
                    {topThree[0].student_name}
                  </h4>
                  <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                    {topThree[0].points} Pts
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center flex flex-col items-center shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-amber-600/40 overflow-hidden mb-1 relative flex items-center justify-center">
                    {topThree[2].student_avatar ? (
                      <img
                        src={topThree[2].student_avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-amber-700" />
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-900 truncate max-w-[80px]">
                    {topThree[2].student_name}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {topThree[2].points} pts
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remaining Rankings List */}
          <div className="space-y-2">
            {remaining.map((entry, idx) => {
              const isCurrentUser = user?.id === entry.student_id;
              const rankNumber = idx + 4;

              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50/70 border-[#3157D5] shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">
                      #{rankNumber}
                    </span>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {entry.student_avatar ? (
                        <img
                          src={entry.student_avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {entry.student_name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {entry.student_name}
                        {isCurrentUser && (
                          <span className="text-[9px] bg-blue-100 text-[#3157D5] px-1 py-0.2 rounded font-semibold">
                            You
                          </span>
                        )}
                      </h4>
                      {entry.class_grade && (
                        <span className="text-[10px] text-slate-500">{entry.class_grade}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {entry.points} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
