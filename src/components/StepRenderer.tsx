import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Info, Sparkles, BookOpen } from 'lucide-react';
import { useProgress } from '../store/useProgress';
import { stepsData, stepsList } from '../content/stepsData';
import { ContentBlock } from './ContentBlock';
import { JuryQuestion } from './JuryQuestion';
import { ProgressBar } from './ProgressBar';

interface StepRendererProps {
  stepId: number;
  customContent?: React.ReactNode;
}

export const StepRenderer: React.FC<StepRendererProps> = ({ stepId, customContent }) => {
  const navigate = useNavigate();
  const step = stepsData[stepId];
  const { openedBlocks, markBlockOpened, markStepCompleted, canNavigateNext, setCurrentStep } = useProgress();

  useEffect(() => {
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepId, setCurrentStep]);

  if (!step) {
    return <div className="p-8 text-center text-slate-500">Step not found</div>;
  }

  const currentOpened = openedBlocks[stepId] || [];
  const totalBlocks = step.blocks.length;
  const isNextEnabled = canNavigateNext(stepId, totalBlocks);

  const handleNext = () => {
    if (isNextEnabled) {
      markStepCompleted(stepId);
      if (stepId < stepsList.length) {
        navigate(`/step/${stepId + 1}`);
      }
    }
  };

  const handleBack = () => {
    if (stepId > 1) {
      navigate(`/step/${stepId - 1}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Hero Step Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/10 via-slate-900/40 to-indigo-900/10 dark:from-blue-950/40 dark:via-slate-900/80 dark:to-indigo-950/40 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" /> ARCHITECTURE STEP {String(step.id).padStart(2, '0')} / 12
            </span>

            <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700/50">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentOpened.length} of {totalBlocks} Content Blocks Read</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {step.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {step.goal}
          </p>

          <div className="pt-2">
            <ProgressBar />
          </div>
        </div>
      </div>

      {/* Content Blocks Container */}
      <div className="space-y-6">
        {step.blocks.map((block) => (
          <ContentBlock
            key={block.id}
            block={block}
            stepId={stepId}
            isOpened={currentOpened.includes(block.id)}
            onOpen={() => markBlockOpened(stepId, block.id)}
            defaultExpanded={true}
          />
        ))}
      </div>

      {/* Custom Component (e.g. Live Simulation for Step 11) */}
      {customContent && <div className="mt-8">{customContent}</div>}

      {/* Jury Question Section */}
      <JuryQuestion data={step.juryQuestion} />

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={stepId === 1}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            stepId === 1
              ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!isNextEnabled && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {stepId === 11
                  ? 'Run simulation once to unlock Next'
                  : 'Open all content blocks above to unlock Next'}
              </span>
            </div>
          )}

          {stepId < stepsList.length ? (
            <button
              onClick={handleNext}
              disabled={!isNextEnabled}
              className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                isNextEnabled
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 active:scale-98'
                  : 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
              }`}
            >
              <span>Next Architecture Step</span>
              {isNextEnabled ? <ArrowRight className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>Design Complete</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
