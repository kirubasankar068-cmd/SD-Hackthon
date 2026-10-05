import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Eye } from 'lucide-react';
import type { ContentBlockData } from '../content/types';
import { MermaidDiagram } from './MermaidDiagram';
import { DataTable } from './DataTable';
import { StateChain } from './StateChain';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

interface ContentBlockProps {
  block: ContentBlockData;
  stepId: number;
  isOpened: boolean;
  onOpen: () => void;
  defaultExpanded?: boolean;
}

export const ContentBlock: React.FC<ContentBlockProps> = ({
  block,
  stepId,
  isOpened,
  onOpen,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded && !isOpened) {
      onOpen();
    }
  }, [defaultExpanded, isOpened, onOpen]);

  const toggleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      onOpen();
    } else {
      setIsExpanded(false);
    }
  };

  const renderInnerContent = () => {
    switch (block.type) {
      case 'diagram':
        return block.diagramCode ? <MermaidDiagram chart={block.diagramCode} id={`diagram-${stepId}-${block.id}`} /> : null;
      case 'table':
        return block.tableData ? <DataTable headers={block.tableData.headers} rows={block.tableData.rows} /> : null;
      case 'code':
        return block.codeSnippet ? (
          <CodeBlock
            code={block.codeSnippet.code}
            language={block.codeSnippet.language}
            explanation={block.codeSnippet.explanation}
          />
        ) : null;
      case 'callout':
        return <Callout type={block.calloutType}>{block.content}</Callout>;
      case 'state-chain':
        return block.stateChainData ? <StateChain states={block.stateChainData.states} /> : null;
      case 'list':
        return (
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {block.listItems?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );
      case 'text':
      default:
        return (
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {block.content}
          </p>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpened
          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs'
          : 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 shadow-md'
      }`}
    >
      <div
        onClick={toggleExpand}
        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpened ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <Eye className="w-5 h-5 text-blue-500 animate-pulse shrink-0" />
          )}
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
            {block.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {!isOpened && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              Click to view
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
          {renderInnerContent()}
        </div>
      )}
    </div>
  );
};
