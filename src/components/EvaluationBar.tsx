import React from 'react';

interface EvaluationBarProps {
  score: number; // Centipawns (+ White, - Black)
  playerColor: 'w' | 'b';
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ score, playerColor }) => {
  // Clamp score between -1500 and +1500 for display percentage
  const clamped = Math.max(-1500, Math.min(1500, score));
  // White percentage: 0 is 50%, +1500 is ~95%, -1500 is ~5%
  const whitePercent = 50 + (clamped / 1500) * 45;

  // Display label
  const formattedScore =
    Math.abs(score) >= 90000
      ? score > 0
        ? 'M'
        : '-M'
      : (score > 0 ? '+' : '') + (score / 100).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full sm:w-6 h-6 sm:h-full min-h-[140px] sm:min-h-[460px]">
      <div
        id="evaluation-bar-track"
        className="relative w-full h-full rounded-full overflow-hidden bg-stone-800 border border-stone-700/80 shadow-inner flex flex-row sm:flex-col-reverse"
        title={`Evaluation: ${formattedScore}`}
      >
        {/* White evaluation fill */}
        <div
          className="bg-stone-100 transition-all duration-300 ease-out"
          style={{
            height: window.innerWidth > 640 ? `${whitePercent}%` : '100%',
            width: window.innerWidth > 640 ? '100%' : `${whitePercent}%`,
          }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-stone-400">
        {formattedScore}
      </span>
    </div>
  );
};
