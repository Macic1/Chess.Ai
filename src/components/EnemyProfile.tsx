import React from 'react';
import { AIEnemy } from '../types';
import { AI_ENEMIES } from '../data/enemies';
import { EnemyAvatar } from './EnemyAvatar';
import { Swords, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EnemyProfileProps {
  enemy?: AIEnemy;
  currentSpeech?: string;
  isThinking?: boolean;
  isAlarmed?: boolean;
  isConfident?: boolean;
  isDefeated?: boolean;
  onOpenSelector: () => void;
}

export const EnemyProfile: React.FC<EnemyProfileProps> = ({
  enemy,
  currentSpeech = '',
  isThinking = false,
  isAlarmed = false,
  isConfident = false,
  isDefeated = false,
  onOpenSelector,
}) => {
  const safeEnemy = enemy || AI_ENEMIES[1];
  const mood = isDefeated
    ? 'defeated'
    : isAlarmed
    ? 'alarmed'
    : isThinking
    ? 'thinking'
    : isConfident
    ? 'confident'
    : 'neutral';

  return (
    <div
      id="enemy-profile-card"
      className="relative w-full rounded-2xl bg-stone-900/90 border border-stone-800 p-3.5 sm:p-4 shadow-xl backdrop-blur-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Enemy Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <EnemyAvatar avatarKey={safeEnemy?.avatar || 'felix'} mood={mood} className="w-13 h-13 sm:w-14 sm:h-14 shadow-md" />
            {isThinking && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-stone-900 animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-stone-100 tracking-tight">{safeEnemy?.name || 'Gegner'}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                {safeEnemy?.rating || 1000} ELO
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {safeEnemy?.difficulty || 'Mittel'}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{safeEnemy?.title || ''}</p>
          </div>
        </div>

        {/* Change Opponent Button */}
        <button
          id="btn-change-opponent"
          onClick={onOpenSelector}
          className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 hover:border-stone-600 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>Gegner wählen</span>
        </button>
      </div>

      {/* Speech / Dialogue Bubble with AnimatePresence */}
      <div className="mt-3 relative pl-3 pr-3 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 text-stone-300 text-xs sm:text-sm flex items-start gap-2.5 min-h-[52px]">
        <MessageSquare className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentSpeech}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="italic text-stone-200 leading-relaxed"
            >
              "{currentSpeech || safeEnemy?.taunts?.start?.[0] || 'Lass uns Schach spielen!'}"
            </motion.p>
          </AnimatePresence>

          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-1 mt-1 text-stone-400 text-xs"
            >
              <span>Plant nächsten Zug</span>
              <span className="inline-flex gap-0.5 ml-1">
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
