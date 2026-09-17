import React from 'react';
import { AIEnemy, PlayerColor } from '../types';
import { AI_ENEMIES } from '../data/enemies';
import { EnemyAvatar } from './EnemyAvatar';
import { Swords, RefreshCw } from 'lucide-react';

interface AiVsAiDualProfileProps {
  whiteEnemy?: AIEnemy;
  whiteBot?: AIEnemy;
  blackEnemy?: AIEnemy;
  blackBot?: AIEnemy;
  currentTurn?: 'w' | 'b';
  whiteSpeech?: string;
  blackSpeech?: string;
  isThinking?: boolean;
  evalScore?: number;
  inCheck?: boolean;
  isGameOver?: boolean;
  winner?: PlayerColor | 'draw' | null;
  onChangeWhite?: () => void;
  onSwitchWhite?: () => void;
  onChangeBlack?: () => void;
  onSwitchBlack?: () => void;
}

export const AiVsAiDualProfile: React.FC<AiVsAiDualProfileProps> = ({
  whiteEnemy,
  whiteBot,
  blackEnemy,
  blackBot,
  currentTurn = 'w',
  whiteSpeech = '',
  blackSpeech = '',
  isThinking = false,
  evalScore = 0,
  inCheck = false,
  isGameOver = false,
  winner = null,
  onChangeWhite,
  onSwitchWhite,
  onChangeBlack,
  onSwitchBlack,
}) => {
  const activeWhite = whiteEnemy || whiteBot || AI_ENEMIES[1];
  const activeBlack = blackEnemy || blackBot || AI_ENEMIES[4];
  const triggerWhiteChange = onChangeWhite || onSwitchWhite || (() => {});
  const triggerBlackChange = onChangeBlack || onSwitchBlack || (() => {});

  const isWhiteTurn = currentTurn === 'w';
  const isBlackTurn = currentTurn === 'b';

  // White mood
  const whiteMood = isGameOver
    ? winner === 'w'
      ? 'confident'
      : winner === 'b'
      ? 'defeated'
      : 'neutral'
    : inCheck && isWhiteTurn
    ? 'alarmed'
    : isWhiteTurn && isThinking
    ? 'thinking'
    : evalScore > 200
    ? 'confident'
    : evalScore < -200
    ? 'alarmed'
    : 'neutral';

  // Black mood
  const blackMood = isGameOver
    ? winner === 'b'
      ? 'confident'
      : winner === 'w'
      ? 'defeated'
      : 'neutral'
    : inCheck && isBlackTurn
    ? 'alarmed'
    : isBlackTurn && isThinking
    ? 'thinking'
    : evalScore < -200
    ? 'confident'
    : evalScore > 200
    ? 'alarmed'
    : 'neutral';

  return (
    <div
      id="aivsai-dual-profile-container"
      className="w-full flex flex-col gap-3 rounded-2xl bg-stone-900/90 border border-stone-800 p-3.5 sm:p-4 shadow-xl backdrop-blur-sm"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
              <span>KI gegen KI Duell</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                LIVE
              </span>
            </h3>
          </div>
        </div>

        <div className="text-[11px] text-stone-400 font-mono">
          {evalScore === 0 ? (
            'Ausgeglichen (0.0)'
          ) : evalScore > 0 ? (
            <span className="text-emerald-400">Weiß +{(evalScore / 100).toFixed(1)}</span>
          ) : (
            <span className="text-cyan-400">Schwarz +{(-evalScore / 100).toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* Dual Bot Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* White Bot */}
        <div
          className={`relative rounded-xl p-3 border transition-all duration-300 flex flex-col justify-between ${
            isWhiteTurn && !isGameOver
              ? 'bg-stone-800/90 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/50'
              : 'bg-stone-950/60 border-stone-800 text-stone-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <EnemyAvatar
                  avatarKey={activeWhite?.avatar || 'felix'}
                  mood={whiteMood}
                  className="w-11 h-11 shadow"
                />
                {isWhiteTurn && isThinking && !isGameOver && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-stone-900 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-400 inline-block shadow-xs" title="Weiß" />
                  <h4 className="text-xs font-bold text-stone-100 leading-tight truncate max-w-[110px]">
                    {activeWhite?.name || 'Weiß'}
                  </h4>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">
                    {activeWhite?.rating || 1000} ELO
                  </span>
                  <span className="text-[10px] text-stone-400">• {activeWhite?.difficulty || 'Mittel'}</span>
                </div>
              </div>
            </div>

            <button
              id="btn-switch-white-bot"
              onClick={triggerWhiteChange}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-[10px] border border-stone-700 transition cursor-pointer"
              title="Weiß-Gegner wechseln"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* White Speech Bubble */}
          <div className="mt-2.5 pt-2 border-t border-stone-800/70 min-h-[38px] flex items-center">
            <p className="text-[11px] italic text-stone-300 line-clamp-2 leading-snug">
              "{whiteSpeech || activeWhite?.taunts?.start?.[0] || 'Lass uns spielen!'}"
            </p>
          </div>

          {isWhiteTurn && !isGameOver && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Am Zug (Weiß)...</span>
            </div>
          )}
        </div>

        {/* Black Bot */}
        <div
          className={`relative rounded-xl p-3 border transition-all duration-300 flex flex-col justify-between ${
            isBlackTurn && !isGameOver
              ? 'bg-stone-800/90 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/50'
              : 'bg-stone-950/60 border-stone-800 text-stone-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <EnemyAvatar
                  avatarKey={activeBlack?.avatar || 'dr_richter'}
                  mood={blackMood}
                  className="w-11 h-11 shadow"
                />
                {isBlackTurn && isThinking && !isGameOver && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-stone-900 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-600 inline-block shadow-xs" title="Schwarz" />
                  <h4 className="text-xs font-bold text-stone-100 leading-tight truncate max-w-[110px]">
                    {activeBlack?.name || 'Schwarz'}
                  </h4>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">
                    {activeBlack?.rating || 1000} ELO
                  </span>
                  <span className="text-[10px] text-stone-400">• {activeBlack?.difficulty || 'Mittel'}</span>
                </div>
              </div>
            </div>

            <button
              id="btn-switch-black-bot"
              onClick={triggerBlackChange}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-[10px] border border-stone-700 transition cursor-pointer"
              title="Schwarz-Gegner wechseln"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Black Speech Bubble */}
          <div className="mt-2.5 pt-2 border-t border-stone-800/70 min-h-[38px] flex items-center">
            <p className="text-[11px] italic text-stone-300 line-clamp-2 leading-snug">
              "{blackSpeech || activeBlack?.taunts?.start?.[0] || 'Lass uns spielen!'}"
            </p>
          </div>

          {isBlackTurn && !isGameOver && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Am Zug (Schwarz)...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
