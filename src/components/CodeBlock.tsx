import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  explanation?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'sql', explanation }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
        <span className="uppercase tracking-wider text-cyan-400 font-semibold">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed bg-slate-950 text-slate-200">
        <pre className="whitespace-pre-wrap">{code.trim()}</pre>
      </div>
      {explanation && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 text-xs text-slate-300">
          <span className="font-semibold text-slate-200">Note:</span> {explanation}
        </div>
      )}
    </div>
  );
};
