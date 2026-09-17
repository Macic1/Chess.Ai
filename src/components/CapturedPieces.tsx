import React from 'react';
import { PieceType } from '../types';
import { PieceIcon } from './PieceIcon';

interface CapturedPiecesProps {
  whiteCaptured: PieceType[];
  blackCaptured: PieceType[];
}

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ whiteCaptured, blackCaptured }) => {
  const whitePoints = whiteCaptured.reduce((acc, p) => acc + (PIECE_VALUES[p] || 0), 0);
  const blackPoints = blackCaptured.reduce((acc, p) => acc + (PIECE_VALUES[p] || 0), 0);

  const whiteLead = whitePoints - blackPoints;
  const blackLead = blackPoints - whitePoints;

  return (
    <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs shadow-md">
      {/* White's captured loot (Black pieces taken by White) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-stone-300">Weiß:</span>
        <div className="flex items-center -space-x-1">
          {whiteCaptured.map((p, i) => (
            <PieceIcon key={i} type={p} color="b" className="w-4.5 h-4.5 drop-shadow-sm" />
          ))}
        </div>
        {whiteLead > 0 && (
          <span className="ml-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
            +{whiteLead}
          </span>
        )}
      </div>

      {/* Black's captured loot (White pieces taken by Black) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-stone-300">Schwarz:</span>
        <div className="flex items-center -space-x-1">
          {blackCaptured.map((p, i) => (
            <PieceIcon key={i} type={p} color="w" className="w-4.5 h-4.5 drop-shadow-sm" />
          ))}
        </div>
        {blackLead > 0 && (
          <span className="ml-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
            +{blackLead}
          </span>
        )}
      </div>
    </div>
  );
};
