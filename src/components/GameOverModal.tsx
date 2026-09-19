import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AIEnemy, PlayerColor } from '../types';
import { AI_ENEMIES } from '../data/enemies';
import { EnemyAvatar } from './EnemyAvatar';
import { Trophy, Skull, Handshake, RotateCcw, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: PlayerColor | 'draw' | null;
  playerColor: PlayerColor;
  reason: string;
  enemy: AIEnemy;
  totalMoves: number;
  onRematch: () => void;
  onChooseEnemy: () => void;
  onBackToTitle?: () => void;
  isAiVsAi?: boolean;
  isPvP?: boolean;
  isOnline?: boolean;
  onlineOpponentName?: string;
  whiteEnemy?: AIEnemy;
  whiteBot?: AIEnemy;
  blackEnemy?: AIEnemy;
  blackBot?: AIEnemy;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  playerColor,
  reason,
  enemy,
  totalMoves,
  onRematch,
  onChooseEnemy,
  onBackToTitle,
  isAiVsAi = false,
  isPvP = false,
  isOnline = false,
  onlineOpponentName,
  whiteEnemy,
  whiteBot,
  blackEnemy,
  blackBot,
}) => {
  const safeEnemy = enemy || AI_ENEMIES[1];
  const safeWhite = whiteEnemy || whiteBot || safeEnemy;
  const safeBlack = blackEnemy || blackBot || safeEnemy;

  const isPlayerWinner = (!isAiVsAi && !isPvP) && winner === playerColor;
  const isDraw = winner === 'draw';

  const winningEnemy = isAiVsAi
    ? winner === 'w'
      ? safeWhite
      : winner === 'b'
      ? safeBlack
      : null
    : null;

  const losingEnemy = isAiVsAi
    ? winner === 'w'
      ? safeBlack
      : winner === 'b'
      ? safeWhite
      : null
    : null;

  useEffect(() => {
    if (isOpen && (isPlayerWinner || (isAiVsAi && !isDraw))) {
      try {
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.55 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen, isPlayerWinner, isAiVsAi, isDraw]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          className="relative w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-center space-y-5"
        >
          {/* Status Icon */}
          <div className="flex justify-center">
            {isDraw ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 shadow-lg"
              >
                <Handshake className="w-9 h-9" />
              </motion.div>
            ) : isAiVsAi ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20"
              >
                <Trophy className="w-9 h-9" />
              </motion.div>
            ) : isPlayerWinner ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20"
              >
                <Trophy className="w-9 h-9" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20"
              >
                <Skull className="w-9 h-9" />
              </motion.div>
            )}
          </div>

          {/* Title & Reason */}
          <div>
            <h3 className="text-2xl font-black text-stone-100 tracking-tight">
              {isDraw
                ? 'REMIS'
                : isOnline
                ? isPlayerWinner
                  ? 'ONLINE-SIEG!'
                  : 'ONLINE-NIEDERLAGE'
                : isPvP
                ? winner === 'w'
                  ? 'MENSCH (WEISS) GEWINNT!'
                  : 'MENSCH (SCHWARZ) GEWINNT!'
                : isAiVsAi
                ? `${winningEnemy?.name || 'KI'} GEWINNT!`
                : isPlayerWinner
                ? 'SIEG!'
                : 'NIEDERLAGE'}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mt-1">{reason}</p>
          </div>

          {/* Character Words / Duel Overview */}
          {isOnline ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-3 text-center text-amber-200 text-xs">
              <span>
                Online-Partie gegen {onlineOpponentName || 'Gegner'}: {isDraw ? 'Unentschieden!' : isPlayerWinner ? 'Herzlichen Glückwunsch zum Sieg!' : 'Kopf hoch, versuche eine Revanche!'}
              </span>
            </div>
          ) : isPvP ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-3 text-center text-amber-200 text-xs">
              <span>Mensch gegen Mensch: Spieler {winner === 'w' ? 'Weiß' : 'Schwarz'} hat das Duell gewonnen!</span>
            </div>
          ) : isAiVsAi && winningEnemy ? (
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center gap-3 text-left">
              <EnemyAvatar avatarKey={winningEnemy?.avatar || 'felix'} mood="confident" className="w-12 h-12 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-amber-400">{winningEnemy?.name || 'KI'} (Sieger):</span>
                <p className="text-xs italic text-stone-200 mt-0.5">
                  "{winningEnemy?.taunts?.victory?.[0] || 'Ein großartiges Duell!'}"
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center gap-3 text-left">
              <EnemyAvatar avatarKey={safeEnemy?.avatar || 'felix'} mood={isPlayerWinner ? 'defeated' : 'confident'} className="w-12 h-12 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-stone-400">{safeEnemy?.name || 'Gegner'}:</span>
                <p className="text-xs italic text-stone-200 mt-0.5">
                  "{isPlayerWinner ? safeEnemy?.taunts?.defeat?.[0] : isDraw ? 'Ein ebenbürtiges Duell.' : safeEnemy?.taunts?.victory?.[0]}"
                </p>
              </div>
            </div>
          )}

          {/* Match Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <span className="text-stone-400 block text-[11px]">Gespielte Züge</span>
              <strong className="text-stone-100 text-sm font-mono">{totalMoves}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <span className="text-stone-400 block text-[11px]">{isOnline ? 'Modus' : 'Gegner Wertung'}</span>
              <strong className="text-stone-100 text-sm font-mono">{isOnline ? 'Online-Lobby' : `${enemy.rating} ELO`}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              id="btn-play-rematch"
              onClick={onRematch}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isOnline ? 'Revanche fordern' : 'Revanche'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              id="btn-choose-another-enemy"
              onClick={onChooseEnemy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-sm border border-stone-700 transition cursor-pointer"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>{isOnline ? 'Lobby wechseln' : 'Anderer Gegner'}</span>
            </motion.button>
          </div>

          {onBackToTitle && (
            <button
              id="btn-gameover-to-title"
              onClick={onBackToTitle}
              className="w-full py-2 text-xs text-stone-400 hover:text-amber-400 transition-colors"
            >
              ← Zurück zum Titelbildschirm
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
