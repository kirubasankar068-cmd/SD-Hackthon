import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import type { JuryQuestionData } from '../content/types';

interface JuryQuestionProps {
  data: JuryQuestionData;
}

export const JuryQuestion: React.FC<JuryQuestionProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/50 to-indigo-950/20 dark:from-purple-950/40 dark:to-slate-900/90 p-5 sm:p-6 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Jury Question Card
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {data.question}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Practice answering architecture panel follow-ups under pressuring scenarios.
          </p>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mt-4 w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium text-sm transition-all cursor-pointer border border-purple-500/20"
      >
        <span>{isOpen ? 'Hide Architect Model Answer' : 'Reveal Architect Model Answer'}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-900/40 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {data.answer}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">
              Key Defense Talking Points
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
              {data.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
