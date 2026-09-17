import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  Gauge,
  RefreshCw,
} from 'lucide-react';

interface AiVsAiControlsProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepMove: () => void;
  onReset: () => void;
  onFlipBoard: () => void;
  speedMs: number;
  onChangeSpeed: (speed: number) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isAiThinking: boolean;
  isGameOver: boolean;
}

const SPEED_OPTIONS = [
  { label: '0.5x', speed: 1500, title: 'Gemütlich (1.5s)' },
  { label: '1x', speed: 800, title: 'Normal (0.8s)' },
  { label: '2x', speed: 350, title: 'Schnell (0.35s)' },
  { label: 'Blitz', speed: 150, title: 'Blitz (0.15s)' },
];

export const AiVsAiControls: React.FC<AiVsAiControlsProps> = ({
  isRunning,
  onTogglePlay,
  onStepMove,
  onReset,
  onFlipBoard,
  speedMs,
  onChangeSpeed,
  isSoundEnabled,
  onToggleSound,
  isAiThinking,
  isGameOver,
}) => {
  return (
    <div
      id="aivsai-controls-container"
      className="w-full flex flex-col gap-2 rounded-2xl bg-stone-900/90 border border-stone-800 p-3 shadow-xl backdrop-blur-sm"
    >
      {/* Top Main Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Play / Pause */}
        <button
          id="btn-aivsai-play-pause"
          onClick={onTogglePlay}
          disabled={isGameOver}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer col-span-2 sm:col-span-1 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
          } disabled:opacity-40 disabled:pointer-events-none`}
          title={isRunning ? 'Simulation pausieren' : 'Simulation abspielen'}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pausieren</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Weiterspielen</span>
            </>
          )}
        </button>

        {/* Step Forward (One Move) */}
        <button
          id="btn-aivsai-step"
          onClick={onStepMove}
          disabled={isRunning || isAiThinking || isGameOver}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
          title="Genau einen Zug ausführen"
        >
          <SkipForward className="w-3.5 h-3.5 text-amber-400" />
          <span>1 Zug vor</span>
        </button>

        {/* New Match / Reset */}
        <button
          id="btn-aivsai-reset"
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
          title="Partie neu starten"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Neustart</span>
        </button>

        {/* Flip Board Perspective */}
        <button
          id="btn-aivsai-flip"
          onClick={onFlipBoard}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
          title="Blickwinkel drehen"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400" />
          <span>Drehen</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-aivsai-sound"
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
      </div>

      {/* Speed Selector Bar */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-stone-400">
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium hidden sm:inline">Tempo:</span>
        </div>

        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.speed}
              id={`btn-speed-${opt.label}`}
              onClick={() => onChangeSpeed(opt.speed)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                speedMs === opt.speed
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
              title={opt.title}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
