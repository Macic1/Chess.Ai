import React from 'react';
import { PieceType, PlayerColor, PieceCustomizationState } from '../types';
import { PieceIcon } from './PieceIcon';
import { motion, AnimatePresence } from 'motion/react';

interface PromotionModalProps {
  isOpen: boolean;
  color: PlayerColor;
  onSelect: (piece: PieceType) => void;
  pieceCustomization?: PieceCustomizationState;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelect,
  pieceCustomization,
}) => {
  if (!isOpen) return null;

  const choices: { type: PieceType; label: string }[] = [
    { type: 'q', label: 'Dame' },
    { type: 'r', label: 'Turm' },
    { type: 'b', label: 'Läufer' },
    { type: 'n', label: 'Springer' },
  ];

  const customization =
    pieceCustomization?.enabled
      ? color === 'w'
        ? pieceCustomization.white
        : pieceCustomization.black
      : undefined;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-stone-900 border border-stone-700 rounded-2xl p-5 shadow-2xl max-w-xs w-full text-center space-y-4"
        >
          <div>
            <h4 className="text-base font-bold text-stone-100">Bauern-Umwandlung</h4>
            <p className="text-xs text-stone-400 mt-0.5">Wähle eine Figur für die Beförderung:</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {choices.map((c) => (
              <motion.button
                key={c.type}
                id={`promote-btn-${c.type}`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(c.type)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800 hover:bg-amber-500/20 hover:border-amber-500/50 border border-stone-700 transition cursor-pointer group"
              >
                <PieceIcon
                  type={c.type}
                  color={color}
                  className="w-9 h-9 transition-transform"
                  customization={customization}
                />
                <span className="text-[10px] font-semibold text-stone-300 mt-1">{c.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
