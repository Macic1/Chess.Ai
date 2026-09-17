import React, { useEffect, useRef } from 'react';
import { MoveRecord } from '../types';
import { History } from 'lucide-react';

interface MoveHistoryProps {
  history: MoveRecord[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Group into turns (White move + Black move)
  const turnRows: { num: number; white: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    turnRows.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="flex flex-col h-full rounded-2xl bg-stone-900/85 border border-stone-800 p-3 shadow-lg">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-800 text-xs font-semibold text-stone-300">
        <History className="w-3.5 h-3.5 text-stone-400" />
        <span>Zugprotokoll ({history.length} Halbzüge)</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto mt-2 pr-1 max-h-[180px] sm:max-h-[260px] text-xs font-mono space-y-1">
        {turnRows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-stone-500 italic text-xs py-6">
            Partie gestartet. Warte auf Eröffnungszug.
          </div>
        ) : (
          turnRows.map((turn) => (
            <div
              key={turn.num}
              className="flex items-center justify-between py-1 px-2 rounded hover:bg-stone-800/60 transition-colors"
            >
              <span className="w-8 text-stone-500 font-sans">{turn.num}.</span>
              <span className="flex-1 font-semibold text-stone-200">{turn.white.san}</span>
              <span className="flex-1 font-semibold text-stone-300">{turn.black ? turn.black.san : ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
