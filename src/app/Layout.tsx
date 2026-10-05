import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, RotateCcw, Flame, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useProgress } from '../store/useProgress';
import { Stepper } from '../components/Stepper';
import { ProgressBar } from '../components/ProgressBar';

export const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { resetProgress } = useProgress();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleReset = () => {
    if (window.confirm('Reset all step progress and simulation state back to Step 1?')) {
      resetProgress();
      navigate('/step/1');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Glassmorphism Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700/50"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div
            onClick={() => navigate('/step/1')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-200">
              <Flame className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
                  SALESTORM
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                  <Sparkles className="w-3 h-3" /> System Architecture
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                High-Scale E-Commerce Flash Sale System Design & Verification Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100k TPS Zero-Oversell Architecture</span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700/50 text-xs font-semibold cursor-pointer shadow-2xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Dark and Light Mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700/50 text-xs font-medium cursor-pointer"
            title="Reset All Progress"
            aria-label="Reset Progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden lg:block w-80 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md overflow-y-auto shrink-0 p-4">
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/80 dark:border-slate-700/50 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> System Design Progress
              </span>
            </div>
            <ProgressBar />
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Architecture Steps (12)
            </h3>
            <Stepper />
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full p-4 overflow-y-auto shadow-2xl z-50 flex flex-col border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">Step Navigation</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <ProgressBar />
              </div>
              <Stepper onMobileClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
