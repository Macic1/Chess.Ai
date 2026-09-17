import React from 'react';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { DetectedOpeningInfo } from '../services/openingService';

interface OpeningBannerProps {
  detectedOpening: DetectedOpeningInfo | null;
  onOpenSelector: () => void;
}

export const OpeningBanner: React.FC<OpeningBannerProps> = ({
  detectedOpening,
  onOpenSelector,
}) => {
  if (!detectedOpening) {
    return (
      <div className="w-full mb-2.5 px-3 py-1.5 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between text-xs backdrop-blur-xs">
        <div className="flex items-center gap-2 text-stone-400">
          <BookOpen className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[11px]">Noch keine Haupttheorie erkannt</span>
        </div>
        <button
          id="btn-openings-selector-banner"
          onClick={onOpenSelector}
          className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
          title="Eröffnungsbibliothek öffnen"
        >
          <span>Eröffnung wählen</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const { opening, isExact, isInBook, matchedMovesCount, totalOpeningMoves } = detectedOpening;

  // Style badge styling
  const getStyleBadge = (style: string) => {
    switch (style) {
      case 'Scharf':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Aggressiv':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'Taktisch':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Positional':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="w-full mb-2.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-amber-500/30 shadow-xs flex items-center justify-between text-xs backdrop-blur-xs">
      <div className="flex items-center gap-2 overflow-hidden min-w-0 pr-2">
        {/* ECO Code Badge */}
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0 border border-amber-500/30 leading-none">
          {opening.eco}
        </span>

        {/* Opening Name */}
        <span className="font-semibold text-stone-100 truncate text-[12px]" title={opening.name}>
          {opening.name}
        </span>

        {/* Style tag */}
        <span
          className={`hidden sm:inline-flex px-1.5 py-0.2 rounded text-[9.5px] font-medium border leading-none shrink-0 ${getStyleBadge(
            opening.style
          )}`}
        >
          {opening.style}
        </span>

        {/* Book status */}
        {isInBook && (
          <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Buch</span>
          </span>
        )}
      </div>

      {/* Button to open selector */}
      <button
        id="btn-open-opening-modal"
        onClick={onOpenSelector}
        className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 transition cursor-pointer hover:underline"
        title="Eröffnungs-Details ansehen und andere Eröffnungen testen"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Bibliothek</span>
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
