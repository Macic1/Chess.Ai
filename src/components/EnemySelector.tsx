import React from 'react';
import { AIEnemy } from '../types';
import { AI_ENEMIES } from '../data/enemies';
import { EnemyAvatar } from './EnemyAvatar';
import { X, Check, BrainCircuit, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EnemySelectorProps {
  isOpen: boolean;
  currentEnemyId: string;
  onSelect: (enemy: AIEnemy) => void;
  onClose: () => void;
}

export const EnemySelector: React.FC<EnemySelectorProps> = ({
  isOpen,
  currentEnemyId,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          id="enemy-selector-modal"
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/60">
            <div className="flex items-center gap-2.5">
              <Swords className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-stone-100">Wähle deinen KI-Gegner</h3>
                <p className="text-xs text-stone-400">Jeder Gegner besitzt eine eigene Spielweise, Taktik und Persönlichkeit</p>
              </div>
            </div>
            <button
              id="btn-close-enemy-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Enemy Cards Grid */}
          <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {AI_ENEMIES.map((enemy) => {
              const isSelected = enemy.id === currentEnemyId;

              return (
                <motion.div
                  key={enemy.id}
                  id={`enemy-card-${enemy.id}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    onSelect(enemy);
                    onClose();
                  }}
                  className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-stone-800/90 border-amber-500/60 ring-2 ring-amber-500/20 shadow-lg'
                      : 'bg-stone-950/60 border-stone-800 hover:bg-stone-800/50 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <EnemyAvatar avatarKey={enemy.avatar} className="w-14 h-14 shrink-0 shadow-md" />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                          {enemy.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                          {enemy.rating} ELO
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {enemy.difficulty}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-stone-300">{enemy.title}</p>
                      <p className="text-xs text-stone-400 max-w-xl line-clamp-2">{enemy.bio}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3 text-stone-500" />
                          Stil: <strong className="text-stone-300 font-medium">{enemy.playStyle}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 sm:ml-4 flex sm:flex-col items-center justify-between w-full sm:w-auto gap-2">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                        <Check className="w-4 h-4" /> Ausgewählt
                      </span>
                    ) : (
                      <button className="px-4 py-2 rounded-xl bg-stone-800 group-hover:bg-amber-500 group-hover:text-stone-950 text-stone-200 text-xs font-bold transition shadow-sm">
                        Wählen
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
