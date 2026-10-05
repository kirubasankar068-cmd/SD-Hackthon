import React from 'react';

interface DataTableProps {
  headers: string[];
  rows: (string | number)[][];
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
        <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-900 dark:text-slate-100 tracking-wider">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-3 font-mono text-xs sm:text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
