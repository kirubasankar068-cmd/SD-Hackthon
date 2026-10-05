import React from 'react';
import { useProgress } from '../store/useProgress';

interface ProgressBarProps {
  totalSteps?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ totalSteps = 12 }) => {
  const { currentStep, completedSteps } = useProgress();
  const completedCount = Object.keys(completedSteps).filter(k => completedSteps[Number(k)]).length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
      <div
        className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 h-full transition-all duration-300 ease-out"
        style={{ width: `${Math.max(percentage, (currentStep / totalSteps) * 100)}%` }}
      />
    </div>
  );
};
