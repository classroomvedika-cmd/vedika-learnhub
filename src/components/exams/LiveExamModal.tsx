import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { Exam, ExamQuestion, ExamResult } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface LiveExamModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onFinish: (result: ExamResult, questions: ExamQuestion[], userAnswers: Record<string, number>) => void;
}

export const LiveExamModal: React.FC<LiveExamModalProps> = ({
  exam,
  isOpen,
  onClose,
  onFinish,
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [examError, setExamError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(exam.duration_minutes * 60);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const calculateAndSubmit = useCallback(async () => {
    if (isSubmitting || !user) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let correctCount = 0;
      let incorrectCount = 0;
      let score = 0;

      const answersArray: any[] = [];

      questions.forEach((q) => {
        const selected = userAnswers[q.id];
        if (selected !== undefined) {
          const qMarks = q.marks !== undefined && q.marks !== null ? Number(q.marks) : 1;
          const qNeg = q.negative_marks !== undefined && q.negative_marks !== null
            ? Number(q.negative_marks)
            : Number(exam.negative_marks || 0);

          const isCorrect = q.correct_option !== undefined && q.correct_option !== null
            ? selected === q.correct_option
            : false;

          if (isCorrect) {
            correctCount++;
            score += qMarks;
          } else {
            incorrectCount++;
            score -= Math.abs(qNeg);
          }
          answersArray.push({
            question_id: q.id,
            selected_option: selected,
            is_correct: isCorrect,
          });
        }
      });

      // Keep score non-negative
      score = Math.max(0, score);
      const totalMarks = questions.reduce((sum, item) => sum + (item.marks !== undefined && item.marks !== null ? Number(item.marks) : 1), 0);
      const unattemptedCount = Math.max(0, questions.length - (correctCount + incorrectCount));
      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      const passingMarks = exam.passing_marks !== undefined && exam.passing_marks !== null ? Number(exam.passing_marks) : Math.ceil(totalMarks * 0.4);
      const passed = score >= passingMarks;

      const resultPayload: Partial<ExamResult> = {
        exam_id: exam.id,
        student_id: user.id,
        score: score,
        total_marks: totalMarks,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        percentage: percentage,
        passed: passed,
      };

      const finalResult = await dataService.submitExamResult(resultPayload, answersArray);
      setShowConfirmModal(false);
      onFinish(finalResult, questions, userAnswers);
    } catch (err: any) {
      console.error('Submit exam error:', err);
      setSubmitError(err?.message || 'Unable to submit your exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, user, questions, userAnswers, exam, onFinish]);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setExamError(null);
    try {
      const qList = await dataService.getExamQuestions(exam.id);
      setQuestions(qList);
    } catch (err: any) {
      console.error('Error fetching exam questions:', err);
      setExamError(err?.message || 'Unable to load exam questions.');
    } finally {
      setIsLoading(false);
    }
  }, [exam.id]);

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, fetchQuestions]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isLoading || isSubmitting) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          calculateAndSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isLoading, isSubmitting, calculateAndSubmit]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F7F9FC] text-slate-900">
      {/* Top Header Bar */}
      <div className="px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
        <div>
          <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate max-w-[180px]">
            {exam.title}
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">
            Q {currentIndex + 1} of {questions.length || 1}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              remainingSeconds < 300
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-blue-50 border-blue-200 text-[#3157D5]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#3157D5] to-[#6C63D9] hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Main Examination View */}
      {isLoading ? (
        <div className="flex-1 p-6 flex flex-col justify-center max-w-lg mx-auto w-full">
          <LoadingSkeleton type="exam" count={1} />
        </div>
      ) : examError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">{examError}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={fetchQuestions}
              className="px-4 py-2 bg-[#3157D5] hover:bg-blue-600 text-white text-xs rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No questions available for this exam.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl font-semibold cursor-pointer">
            Go Back
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full p-4 pb-28 sm:pb-12 overflow-y-auto">
          {/* Question Box */}
          <div className="space-y-4">
            {/* Question Palette Carousel */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurr = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                      isCurr
                        ? 'bg-[#3157D5] text-white ring-2 ring-blue-300'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Text */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                <span>Question {currentIndex + 1}</span>
                <span className="text-[#3157D5]">+{currentQ.marks ?? 1} / -{currentQ.negative_marks ?? 0} marks</span>
              </div>
              <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                {currentQ.question_text}
              </p>
              {currentQ.question_image && (
                <img
                  src={currentQ.question_image}
                  alt="Question graphic"
                  className="rounded-xl max-h-48 object-contain my-2 border border-slate-200"
                />
              )}
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = userAnswers[currentQ.id] === oIdx;

                return (
                  <button
                    key={oIdx}
                    onClick={() => {
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: oIdx,
                      }));
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between active:scale-[0.99] ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#3157D5] text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#3157D5] text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#3157D5] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Navigation */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-200 mt-4 mb-16 sm:mb-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {userAnswers[currentQ.id] !== undefined && (
              <button
                onClick={() => {
                  setUserAnswers((prev) => {
                    const copy = { ...prev };
                    delete copy[currentQ.id];
                    return copy;
                  });
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-xl font-medium"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                } else {
                  setShowConfirmModal(true);
                }
              }}
              className="flex-1 py-2.5 px-3 bg-[#3157D5] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>{currentIndex === questions.length - 1 ? 'Review & Submit' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <h4 className="text-base font-bold text-slate-900">Submit Examination</h4>
              <p className="text-xs text-slate-600 font-medium">Are you sure you want to submit your exam?</p>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Total Questions:</span>
                  <span className="font-bold text-slate-900">{questions.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Attempted:</span>
                  <span className="font-bold text-emerald-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Unattempted:</span>
                  <span className="font-bold text-amber-600">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Time Remaining:</span>
                  <span className="font-bold text-[#3157D5]">{formatTimer(remainingSeconds)}</span>
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2">
                  <span>{submitError}</span>
                  <button
                    onClick={calculateAndSubmit}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg shrink-0 hover:bg-rose-700 text-[11px]"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setSubmitError(null);
                    setShowConfirmModal(false);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={calculateAndSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#3157D5] to-[#6C63D9] hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Exam'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
