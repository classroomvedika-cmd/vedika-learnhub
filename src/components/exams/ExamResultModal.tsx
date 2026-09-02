import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, XCircle, AlertCircle, ArrowLeft, RotateCcw, Share2 } from 'lucide-react';
import { ExamResult, ExamQuestion } from '../../types';

interface ExamResultModalProps {
  isOpen: boolean;
  result: ExamResult | null;
  questions?: ExamQuestion[];
  userAnswers?: Record<string, number>;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  isOpen,
  result,
  questions = [],
  userAnswers = {},
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && result?.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#6366F1', '#10B981', '#F59E0B'],
        });
      } catch {
        // Fallback if canvas is not ready
      }
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg h-full sm:h-[90vh] bg-white border border-slate-200 rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-slate-900"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              EXAMINATION RESULT
            </h3>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Done
            </button>
          </div>

          {/* Scrollable Result Card */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            {/* Score Banner */}
            <div
              className={`p-6 rounded-3xl text-center border relative overflow-hidden ${
                result.passed
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 mb-3 shadow-xs">
                <Trophy
                  className={`w-8 h-8 ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}
                />
              </div>

              <h2 className="text-xl font-extrabold text-slate-900">
                {result.passed ? 'Congratulations!' : 'Test Completed'}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {result.passed
                  ? 'You successfully passed this examination.'
                  : 'Good effort! Review the explanations below to improve your score.'}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-center gap-6">
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {result.score} <span className="text-sm font-normal text-slate-500">/ {result.total_marks}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Score
                  </div>
                </div>
                <div className="w-[1px] h-8 bg-slate-200" />
                <div>
                  <div className="text-2xl font-black text-[#3157D5]">
                    {result.percentage.toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Accuracy
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="flex items-center justify-center gap-1 text-emerald-600 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{result.correct_count}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-1">Correct</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="flex items-center justify-center gap-1 text-rose-600 text-sm font-bold">
                  <XCircle className="w-4 h-4" />
                  <span>{result.incorrect_count}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-1">Incorrect</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="flex items-center justify-center gap-1 text-slate-500 text-sm font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{result.unattempted_count}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-1">Skipped</div>
              </div>
            </div>

            {/* Question Review Section if questions are present */}
            {questions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Question Analysis
                </h4>
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const userSelected = userAnswers[q.id];
                    const hasSelected = userSelected !== undefined;
                    const isCorrect = q.correct_option !== undefined && q.correct_option !== null && userSelected === q.correct_option;

                    return (
                      <div
                        key={q.id}
                        className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">Q{idx + 1}. {q.question_text}</span>
                          {hasSelected ? (
                            isCorrect ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                                +{q.marks ?? 1} Marks
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded shrink-0">
                                -{q.negative_marks ?? 0}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded shrink-0">
                              Unattempted
                            </span>
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isUserChoice = userSelected === oIdx;
                            const isRightChoice = q.correct_option === oIdx;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                                  isRightChoice
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                    : isUserChoice && !isRightChoice
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                {isRightChoice && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                {isUserChoice && !isRightChoice && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-[#3157D5] leading-relaxed">
                            <span className="font-bold">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
