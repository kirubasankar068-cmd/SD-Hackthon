import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Lock, Zap, ChevronRight } from 'lucide-react';
import { useProgress } from '../store/useProgress';
import { stepsList } from '../content/stepsData';

interface StepperProps {
  onMobileClose?: () => void;
}

export const Stepper: React.FC<StepperProps> = ({ onMobileClose }) => {
  const navigate = useNavigate();
  const params = useParams<{ stepId?: string }>();
  const activeStepId = params.stepId ? parseInt(params.stepId, 10) : 1;
  const { completedSteps } = useProgress();

  const isStepAccessible = (stepId: number) => {
    if (stepId === 1) return true;
    return completedSteps[stepId] || completedSteps[stepId - 1] || stepId <= activeStepId;
  };

  const handleStepClick = (stepId: number) => {
    if (isStepAccessible(stepId)) {
      navigate(`/step/${stepId}`);
      if (onMobileClose) onMobileClose();
    }
  };

  return (
    <nav aria-label="Steps Navigation" className="space-y-1.5">
      {stepsList.map((step) => {
        const isCurrent = step.id === activeStepId;
        const isDone = Boolean(completedSteps[step.id]);
        const isAccessible = isStepAccessible(step.id);
        const isLocked = !isAccessible;

        let statusStyle = 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-transparent';
        let icon = <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />;

        if (isCurrent) {
          statusStyle = 'bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-transparent text-blue-700 dark:text-blue-300 font-bold border-l-4 border-l-blue-600 dark:border-l-blue-400 shadow-2xs';
          icon = <Zap className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />;
        } else if (isDone) {
          statusStyle = 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 border-transparent font-medium';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
        } else if (isLocked) {
          statusStyle = 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600 border-transparent';
          icon = <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />;
        }

        return (
          <button
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            disabled={isLocked}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm transition-all duration-200 cursor-pointer border ${statusStyle}`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md shrink-0 ${
                isCurrent
                  ? 'bg-blue-600 text-white font-bold'
                  : isDone
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {String(step.id).padStart(2, '0')}
              </span>
              <span className="truncate">{step.title}</span>
            </div>
            <div className="flex items-center gap-1">
              {icon}
              {isCurrent && <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
