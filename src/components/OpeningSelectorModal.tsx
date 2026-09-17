import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Play,
  Flame,
  Shield,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ChessOpening, OpeningCategory, PlayerColor } from '../types';
import { CHESS_OPENINGS } from '../data/openings';
import { filterOpenings } from '../services/openingService';

interface OpeningSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOpening: (opening: ChessOpening, playAsColor: PlayerColor) => void;
  currentOpeningId?: string;
  currentPlayerColor: PlayerColor;
}

const CATEGORIES: { id: OpeningCategory; label: string }[] = [
  { id: 'all', label: 'Alle Eröffnungen' },
  { id: 'open', label: 'Offene Spiele (1. e4 e5)' },
  { id: 'semi-open', label: 'Halboffen (Sizilianisch etc.)' },
  { id: 'closed', label: 'Geschlossen (Damengambit etc.)' },
  { id: 'indian', label: 'Indisch & Modern' },
  { id: 'flank', label: 'Flankenspiele' },
  { id: 'gambit', label: 'Gambits & Scharf' },
];

export const OpeningSelectorModal: React.FC<OpeningSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectOpening,
  currentOpeningId,
  currentPlayerColor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<OpeningCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewOpening, setActivePreviewOpening] = useState<ChessOpening | null>(null);

  const filteredOpenings = useMemo(() => {
    return filterOpenings(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Format move list into standard numbered SAN string e.g. "1. e4 e5  2. Nf3 Nc6  3. Bc4"
  const formatMoves = (moves: string[]) => {
    let result = '';
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        result += `${Math.floor(i / 2) + 1}. ${moves[i]} `;
      } else {
        result += `${moves[i]}  `;
      }
    }
    return result.trim();
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'Scharf':
      case 'Aggressiv':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'Taktisch':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'Solide':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Target className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div
      id="opening-selector-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="opening-selector-modal-panel"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>Eröffnungsbibliothek</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-mono font-semibold border border-amber-500/30">
                  {CHESS_OPENINGS.length} Eröffnungen
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Wähle eine klassische oder moderne Eröffnung zum direkten Weiterspielen und Trainieren
              </p>
            </div>
          </div>

          <button
            id="btn-close-opening-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-5 py-3 border-b border-stone-800/80 bg-stone-900 flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              id="input-search-openings"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Eröffnung suchen (z. B. Sizilianisch, Damengambit, C50, Nf3...)"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-700/80 text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs cursor-pointer"
              >
                Löschen
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                      : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Openings Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-stone-950/40">
          {filteredOpenings.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-400">
              <BookOpen className="w-8 h-8 text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Keine Eröffnung gefunden</p>
              <p className="text-xs text-stone-500 mt-1">
                Probiere einen anderen Suchbegriff oder eine andere Kategorie.
              </p>
            </div>
          ) : (
            filteredOpenings.map((op) => {
              const isCurrent = currentOpeningId === op.id;

              return (
                <div
                  key={op.id}
                  className={`relative p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between transition ${
                    isCurrent
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                      : 'bg-stone-900/90 hover:bg-stone-850 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div>
                    {/* Top row: ECO badge, Category, and Style */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                          {op.eco}
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">
                          {op.categoryLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[11px] border border-stone-700/60">
                        {getStyleIcon(op.style)}
                        <span>{op.style}</span>
                      </div>
                    </div>

                    {/* Opening Title */}
                    <h3 className="text-sm sm:text-base font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                      <span>{op.name}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-stone-950 text-[9px] font-bold">
                          Aktuell am Brett
                        </span>
                      )}
                    </h3>

                    {/* Move Sequence */}
                    <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800 text-amber-200/90 font-mono text-xs mb-2 select-all overflow-x-auto whitespace-nowrap">
                      {formatMoves(op.moves)}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-stone-400 line-clamp-2 mb-3 leading-relaxed">
                      {op.description}
                    </p>
                  </div>

                  {/* Actions: Play as White or Play as Black */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-stone-500 font-medium">
                      Startet bei Zug {Math.ceil(op.moves.length / 2)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectOpening(op, 'w');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-semibold transition cursor-pointer"
                        title="Eröffnung aufs Brett laden und als Weiß spielen"
                      >
                        <Play className="w-3 h-3 text-amber-400" />
                        <span>Als Weiß</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectOpening(op, 'b');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer shadow-xs"
                        title="Eröffnung aufs Brett laden und als Schwarz spielen"
                      >
                        <Play className="w-3 h-3 text-stone-950" />
                        <span>Als Schwarz</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Alle Züge der Eröffnung werden automatisch und zugkonform auf dem Brett ausgeführt.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
