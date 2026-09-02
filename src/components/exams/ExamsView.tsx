import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileCheck, Trophy, Clock, ArrowRight, CheckCircle2, History, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Exam, ExamResult, ExamQuestion } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { LiveExamModal } from './LiveExamModal';
import { ExamResultModal } from './ExamResultModal';
import { supabase } from '../../lib/supabase';
import { SubscriptionModal } from '../common/SubscriptionModal';

interface ExamsViewProps {
  onOpenPlans: () => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ onOpenPlans }) => {
  const { user, hasActiveSubscription } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [subModalTitle, setSubModalTitle] = useState<string>("Unlock Mock Test");
  const [subModalDesc, setSubModalDesc] = useState<string>("Subscribe to Vedika LearnHub to access this premium exam series.");

  // Live Exam State
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [latestResult, setLatestResult] = useState<ExamResult | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ExamQuestion[]>([]);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Realtime updates for exams
  useEffect(() => {
    const channelName = `exams-sync-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [fetchedExams, fetchedResults] = await Promise.all([
        dataService.getExams(),
        user?.id ? dataService.getStudentExamResults(user.id) : Promise.resolve([]),
      ]);
      setExams(fetchedExams);
      setExamResults(fetchedResults);
    } catch (e: any) {
      console.error('Error loading exams/results:', e);
      setFetchError(e?.message || 'Unable to load quiz history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishExam = async (
    result: ExamResult,
    questions: ExamQuestion[],
    answers: Record<string, number>
  ) => {
    setActiveExam(null);
    setLatestResult(result);
    setReviewQuestions(questions);
    setReviewAnswers(answers);
    await loadData();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Sub-tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'available'
              ? 'bg-[#3157D5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Live & Mock Tests</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-[#3157D5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Test History ({examResults.length})</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="exam" count={3} />
      ) : fetchError ? (
        <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Unable to load quiz history</h3>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">{fetchError}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#3157D5] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
          >
            Retry Loading
          </button>
        </div>
      ) : activeTab === 'available' ? (
        exams.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No exams available right now"
            description="Exams and Live MCQs scheduled by Vedika educators will appear here."
          />
        ) : (
          <div className="space-y-3">
            {exams.map((exam, idx) => {
              const previousAttempt = examResults.find((r) => r.exam_id === exam.id);
              const isExamLocked = !hasActiveSubscription && exam.access_type === 'subscriber';

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => {
                    if (isExamLocked) {
                      setSubModalTitle(`Unlock Mock Test`);
                      setSubModalDesc(`Subscribe to Vedika LearnHub to unlock the "${exam.title}" mock test and access premium exam series.`);
                      setShowSubModal(true);
                    }
                  }}
                  className={`bg-white border rounded-3xl p-5 shadow-xs space-y-4 transition-all ${
                    isExamLocked
                      ? 'border-amber-200 hover:bg-amber-50/10 cursor-pointer'
                      : 'border-slate-200/80 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3157D5] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 flex items-center gap-1 inline-flex">
                        {exam.subject || 'Live Mock'}
                        {isExamLocked && <Lock className="w-2.5 h-2.5 text-amber-600 inline" />}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1">
                        {exam.title}
                        {isExamLocked && <span className="text-[11px] text-amber-600 font-bold">(Premium 🔒)</span>}
                      </h3>
                    </div>
                    {previousAttempt ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attempted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {isExamLocked ? 'Premium 🔒' : 'Available'}
                      </span>
                    )}
                  </div>

                  {exam.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>
                  )}

                  {/* Details strip */}
                  <div className="grid grid-cols-4 gap-1 py-2.5 px-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-[11px]">
                    <div>
                      <div className="text-[9px] text-slate-500 font-medium">Name</div>
                      <div className="font-bold text-slate-900 mt-0.5 truncate max-w-full" title={exam.subject || 'Live Mock'}>
                        {exam.subject || 'Live Mock'}
                      </div>
                    </div>
                    <div className="border-l border-slate-200">
                      <div className="text-[9px] text-slate-500 font-medium">Duration</div>
                      <div className="font-bold text-slate-900 mt-0.5">{exam.duration_minutes} Mins</div>
                    </div>
                    <div className="border-l border-slate-200">
                      <div className="text-[9px] text-slate-500 font-medium">Total Marks</div>
                      <div className="font-bold text-slate-900 mt-0.5">{exam.total_marks}</div>
                    </div>
                    <div className="border-l border-slate-200">
                      <div className="text-[9px] text-slate-500 font-medium">Questions</div>
                      <div className="font-bold text-slate-900 mt-0.5">{exam.questions_count ?? 0}</div>
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isExamLocked) {
                        setSubModalTitle(`Unlock Mock Test`);
                        setSubModalDesc(`Subscribe to Vedika LearnHub to unlock the "${exam.title}" mock test and access premium exam series.`);
                        setShowSubModal(true);
                      } else {
                        setActiveExam(exam);
                      }
                    }}
                    className={`w-full py-2.5 px-4 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isExamLocked
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-amber-500/5'
                        : 'bg-gradient-to-r from-[#3157D5] to-[#6C63D9] hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/20'
                    }`}
                  >
                    <span>{isExamLocked ? 'Unlock Premium Mock Test' : (previousAttempt ? 'Retake Examination' : 'Start Exam Now')}</span>
                    {isExamLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* Exam History */
        examResults.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No completed exams yet"
            description="Take an active mock test to see your performance metrics and score breakdowns."
          />
        ) : (
          <div className="space-y-3">
            {examResults.map((res) => (
              <div
                key={res.id}
                onClick={() => setLatestResult(res)}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      {res.exam?.title || 'Mock Examination'}
                    </h4>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        res.passed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {res.passed ? 'Passed' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(res.submitted_at).toLocaleDateString()} • {res.correct_count} Correct,{' '}
                    {res.incorrect_count} Incorrect
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    {res.score} <span className="text-[10px] text-slate-400 font-normal">/ {res.total_marks}</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#3157D5]">
                    {(Number(res.percentage || 0)).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Live Exam Modal */}
      {activeExam && (
        <LiveExamModal
          exam={activeExam}
          isOpen={Boolean(activeExam)}
          onClose={() => setActiveExam(null)}
          onFinish={handleFinishExam}
        />
      )}

      {/* Exam Result Review Modal */}
      <ExamResultModal
        isOpen={Boolean(latestResult)}
        result={latestResult}
        questions={reviewQuestions}
        userAnswers={reviewAnswers}
        onClose={() => setLatestResult(null)}
      />

      <SubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        title={subModalTitle}
        description={subModalDesc}
      />
    </div>
  );
};
