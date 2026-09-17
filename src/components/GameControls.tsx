import React from 'react';
import { RotateCcw, Lightbulb, Volume2, VolumeX, Flag, RefreshCw, ArrowLeftRight, BookOpen } from 'lucide-react';

interface GameControlsProps {
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  onFlipBoard: () => void;
  onResign: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  canUndo: boolean;
  isAiThinking: boolean;
  isHintLoading: boolean;
  onOpenOpenings?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  onUndo,
  onHint,
  onFlipBoard,
  onResign,
  isSoundEnabled,
  onToggleSound,
  canUndo,
  isAiThinking,
  isHintLoading,
  onOpenOpenings,
}) => {
  return (
    <div className="w-full grid grid-cols-3 sm:grid-cols-7 gap-2 pt-2">
      {/* New Game */}
      <button
        id="btn-new-game"
        onClick={onNewGame}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
        title="Neues Spiel starten"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Neues Spiel</span>
      </button>

      {/* Openings Selector */}
      {onOpenOpenings && (
        <button
          id="btn-open-openings-selector"
          onClick={onOpenOpenings}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 text-xs font-semibold border border-amber-500/30 transition active:scale-95 cursor-pointer shadow-xs"
          title="Schach-Eröffnungsbibliothek öffnen"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Eröffnung</span>
        </button>
      )}

      {/* Undo */}
      <button
        id="btn-undo-move"
        onClick={onUndo}
        disabled={!canUndo || isAiThinking}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
        title="Zug zurücknehmen"
      >
        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
        <span>Zurück</span>
      </button>

      {/* Hint (Auto-Move) */}
      <button
        id="btn-coach-hint"
        onClick={onHint}
        disabled={isAiThinking || isHintLoading}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
        title="Bester Zug wird berechnet und die Figur zieht automatisch"
      >
        <Lightbulb className={`w-3.5 h-3.5 ${isHintLoading ? 'animate-pulse text-amber-400' : 'text-amber-400'}`} />
        <span>{isHintLoading ? 'Zieht...' : 'Tipp (Auto-Zug)'}</span>
      </button>

      {/* Flip Board */}
      <button
        id="btn-flip-board"
        onClick={onFlipBoard}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
        title="Brett drehen (Farbe wechseln)"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400" />
        <span>Drehen</span>
      </button>

      {/* Sound Toggle */}
      <button
        id="btn-toggle-sound"
        onClick={onToggleSound}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
        title={isSoundEnabled ? 'Ton stummschalten' : 'Ton aktivieren'}
      >
        {isSoundEnabled ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ton AN</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-stone-500" />
            <span>Stumm</span>
          </>
        )}
      </button>

      {/* Resign */}
      <button
        id="btn-resign"
        onClick={onResign}
        disabled={isAiThinking}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-rose-900/40 text-stone-300 hover:text-rose-300 text-xs font-semibold border border-stone-700 hover:border-rose-700/50 transition active:scale-95 cursor-pointer"
        title="Partie aufgeben"
      >
        <Flag className="w-3.5 h-3.5 text-rose-400" />
        <span>Aufgeben</span>
      </button>
    </div>
  );
};
