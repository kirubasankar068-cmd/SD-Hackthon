import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../app/ThemeContext';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id = 'mermaid-diagram' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const uniqueId = `${id}-${Math.random().toString(36).substring(2, 9)}`;

    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'system-ui, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });

    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;
      try {
        setError(null);
        // Clean up chart string
        const cleanChart = chart.trim();
        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err?.message || 'Failed to render diagram');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      const el = document.getElementById(uniqueId);
      if (el) el.remove();
    };
  }, [chart, theme, id]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm font-mono overflow-x-auto">
        <p className="font-semibold text-rose-400 mb-1">Diagram Rendering Error:</p>
        <pre className="whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto p-4 rounded-xl bg-slate-900/60 dark:bg-slate-950/80 border border-slate-700/50 dark:border-slate-800 flex justify-center items-center min-h-[160px]"
      dangerouslySetInnerHTML={{ __html: svgContent || '<div className="text-slate-400 animate-pulse text-sm">Rendering architecture diagram...</div>' }}
    />
  );
};
