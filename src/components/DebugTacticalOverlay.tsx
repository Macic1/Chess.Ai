import React, { useState } from 'react';
import {
  TacticalDebugAnalysis,
  CandidateMoveOption,
  AttackedPieceInfo,
  EnemyLastMoveInfo,
} from '../services/tacticalAnalysis';
import { PlayerColor, PieceType } from '../types';
import { PieceIcon } from './PieceIcon';
import {
  Sparkles,
  ShieldAlert,
  Compass,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Play,
  Crosshair,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Route,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DebugTacticalOverlayProps {
  analysis: TacticalDebugAnalysis;
  playerColor: PlayerColor;
  isPlayerTurn: boolean;
  onSelectMove: (candidate: CandidateMoveOption) => void;
  hoveredCandidateRank: number | null;
  onHoverCandidate: (rank: number | null) => void;
  onClose?: () => void;
  showArrows: boolean;
  onToggleArrows: () => void;
  showThreats: boolean;
  onToggleThreats: () => void;
  showEnemyMove: boolean;
  onToggleEnemyMove: () => void;
  activePlanRank?: number | null;
  onSelectPlanRank?: (rank: number | null) => void;
}

export const DebugTacticalOverlay: React.FC<DebugTacticalOverlayProps> = ({
  analysis,
  playerColor,
  isPlayerTurn,
  onSelectMove,
  hoveredCandidateRank,
  onHoverCandidate,
  onClose,
  showArrows,
  onToggleArrows,
  showThreats,
  onToggleThreats,
  showEnemyMove,
  onToggleEnemyMove,
  activePlanRank = null,
  onSelectPlanRank,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'moves' | 'threats' | 'enemy' | 'planning'>('moves');

  const {
    turnColor,
    evalScore,
    whiteWinPercentage,
    blackWinPercentage,
    playerWinPercentage,
    candidateMoves,
    attackedPieces,
    enemyLastMove,
  } = analysis;

  const playerAttackedCount = attackedPieces.filter((p) => p.isPlayerPiece).length;
  const hangingPlayerPieces = attackedPieces.filter((p) => p.isPlayerPiece && p.isHanging);

  const getPieceName = (type: PieceType): string => {
    switch (type) {
      case 'p': return 'Bauer';
      case 'n': return 'Springer';
      case 'b': return 'Läufer';
      case 'r': return 'Turm';
      case 'q': return 'Dame';
      case 'k': return 'König';
      default: return 'Figur';
    }
  };

  const evalFormatted = evalScore > 0 ? `+${(evalScore / 100).toFixed(1)}` : (evalScore / 100).toFixed(1);

  return (
    <div className="w-full bg-stone-900/95 border border-stone-800 rounded-2xl p-3 shadow-xl text-stone-100 transition-all">
      {/* 1. Header Bar: Clean & Compact */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Taktik-Assistent</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                LIVE
              </span>
            </div>
            <span className="text-[10px] text-stone-400">
              {isPlayerTurn ? 'Dein Zug • 3 Empfehlungen' : 'Gegner am Zug'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Minimize toggle */}
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title={isMinimized ? 'Erweitern' : 'Minimieren'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Win Probability Bar: Clear & Sleek */}
      <div className="mt-2.5 mb-2 px-0.5">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <div className="flex items-center gap-1 font-semibold text-stone-200">
            <span className="w-2 h-2 rounded-full bg-stone-100 inline-block" />
            <span>Weiß: <strong className="font-mono text-white">{whiteWinPercentage}%</strong></span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-950 text-amber-300 border border-stone-800">
            Eval {evalFormatted}
          </span>
          <div className="flex items-center gap-1 font-semibold text-stone-300">
            <span>Schwarz: <strong className="font-mono text-white">{blackWinPercentage}%</strong></span>
            <span className="w-2 h-2 rounded-full bg-stone-950 border border-stone-600 inline-block" />
          </div>
        </div>

        {/* Progress gauge */}
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-stone-950 flex border border-stone-800/80">
          <div
            className="bg-emerald-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${whiteWinPercentage}%` }}
            title={`Weiß: ${whiteWinPercentage}%`}
          />
          <div
            className="bg-stone-700 h-full transition-all duration-300 ease-out"
            style={{ width: `${blackWinPercentage}%` }}
            title={`Schwarz: ${blackWinPercentage}%`}
          />
        </div>
      </div>

      {/* 3. Layer Filter Chips (User can quickly toggle Pfeile, Gegner, Bedroht) */}
      <div className="flex items-center gap-1.5 py-1.5 px-0.5 overflow-x-auto text-[10px] no-scrollbar">
        <span className="text-stone-500 font-medium text-[9px] uppercase tracking-wider shrink-0">
          Ansicht:
        </span>
        <button
          onClick={onToggleArrows}
          className={`px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 ${
            showArrows
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showArrows ? 'bg-emerald-400' : 'bg-stone-600'}`} />
          Pfeile
        </button>

        <button
          onClick={onToggleEnemyMove}
          className={`px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 ${
            showEnemyMove
              ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
              : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showEnemyMove ? 'bg-orange-400' : 'bg-stone-600'}`} />
          Gegner-Spur
        </button>

        <button
          onClick={onToggleThreats}
          className={`px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 ${
            showThreats
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showThreats ? 'bg-rose-400' : 'bg-stone-600'}`} />
          Bedrohungen {playerAttackedCount > 0 && `(${playerAttackedCount})`}
        </button>

        {onSelectPlanRank && (
          <button
            onClick={() => {
              if (activePlanRank !== null) {
                onSelectPlanRank(null);
              } else {
                onSelectPlanRank(1);
                setActiveSubTab('planning');
              }
            }}
            className={`px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 ${
              activePlanRank !== null
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
          >
            <Route className="w-3 h-3" />
            <span>Vorausplanung {activePlanRank !== null ? `(#${activePlanRank})` : ''}</span>
          </button>
        )}
      </div>

      {/* If minimized, just show compact info */}
      {!isMinimized && (
        <div className="mt-2 space-y-2.5">
          {/* Subtabs for switching between Moves, Enemy, Threats, Planning */}
          <div className="flex border-b border-stone-800 text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSubTab('moves')}
              className={`pb-1.5 px-2.5 font-bold transition border-b-2 cursor-pointer shrink-0 ${
                activeSubTab === 'moves'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Top 3 Zug-Tipps ({candidateMoves.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('planning');
                if (activePlanRank === null && onSelectPlanRank) {
                  onSelectPlanRank(1);
                }
              }}
              className={`pb-1.5 px-2.5 font-bold transition border-b-2 cursor-pointer shrink-0 flex items-center gap-1 ${
                activeSubTab === 'planning'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Route className="w-3 h-3" />
              Zug-Planung
            </button>
            <button
              onClick={() => setActiveSubTab('enemy')}
              className={`pb-1.5 px-2.5 font-bold transition border-b-2 cursor-pointer shrink-0 ${
                activeSubTab === 'enemy'
                  ? 'border-orange-400 text-orange-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Gegner-Zug {enemyLastMove && `(${enemyLastMove.to.toUpperCase()})`}
            </button>
            <button
              onClick={() => setActiveSubTab('threats')}
              className={`pb-1.5 px-2.5 font-bold transition border-b-2 cursor-pointer shrink-0 ${
                activeSubTab === 'threats'
                  ? 'border-rose-400 text-rose-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Bedrohungen {playerAttackedCount > 0 && `(${playerAttackedCount})`}
            </button>
          </div>

          {/* TAB 1: 3 Move Candidates - 3 Taktiken (Grün = Angriff, Blau = Solid/Verteidigung, Violett = Position/Zentrum) */}
          {activeSubTab === 'moves' && (
            <div className="space-y-1.5">
              {/* Tactical Explanation Legend */}
              <div className="flex items-center justify-between px-1 py-1 rounded-lg bg-stone-950/60 border border-stone-800/60 text-[10px] text-stone-400">
                <span className="font-semibold text-stone-300">3 Taktik-Pfade:</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Angriff
                  </span>
                  <span className="flex items-center gap-1 text-sky-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Absicherung
                  </span>
                  <span className="flex items-center gap-1 text-purple-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Strategie
                  </span>
                </div>
              </div>

              {candidateMoves.length === 0 ? (
                <div className="text-center py-3 text-xs text-stone-400">
                  Keine Züge verfügbar oder Partie beendet.
                </div>
              ) : (
                candidateMoves.map((cand) => {
                  const isHovered = hoveredCandidateRank === cand.rank;
                  const isTop1 = cand.rank === 1;
                  const isTop2 = cand.rank === 2;

                  return (
                    <div
                      key={cand.rank}
                      id={`cand-move-row-${cand.rank}`}
                      onMouseEnter={() => onHoverCandidate(cand.rank)}
                      onMouseLeave={() => onHoverCandidate(null)}
                      onClick={() => onSelectMove(cand)}
                      className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isTop1
                          ? isHovered
                            ? 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-400/50 shadow-md'
                            : 'bg-stone-950/70 border-emerald-500/30 hover:border-emerald-500/60'
                          : isTop2
                          ? isHovered
                            ? 'bg-sky-950/60 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                            : 'bg-stone-950/70 border-sky-500/30 hover:border-sky-500/60'
                          : isHovered
                          ? 'bg-purple-950/60 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
                          : 'bg-stone-950/70 border-purple-500/30 hover:border-purple-500/60'
                      }`}
                    >
                      {/* Left: Taktik-Farbbalken + Rank Badge + SAN + Move from/to */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-mono font-black flex items-center justify-center ${
                              isTop1
                                ? 'bg-emerald-500 text-stone-950 shadow-xs'
                                : isTop2
                                ? 'bg-sky-500 text-stone-950 shadow-xs'
                                : 'bg-purple-500 text-stone-950 shadow-xs'
                            }`}
                          >
                            #{cand.rank}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-extrabold text-sm text-white">
                              {cand.san}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              ({cand.from}➔{cand.to})
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border leading-tight ${
                                isTop1
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : isTop2
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              }`}
                            >
                              {cand.tacticLabel || (isTop1 ? 'Offensiv & Angriff' : isTop2 ? 'Solide & Absicherung' : 'Strategie & Zentrum')}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-stone-300 truncate max-w-[170px] sm:max-w-[210px] mt-0.5">
                            {cand.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Right: Win % + Play Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-xs font-mono font-extrabold ${
                              isTop1
                                ? 'text-emerald-400'
                                : isTop2
                                ? 'text-sky-400'
                                : 'text-purple-400'
                            }`}
                          >
                            {cand.winPercentage}%
                          </span>
                          <span className="block text-[8px] text-stone-500 uppercase leading-none">
                            Sieg
                          </span>
                        </div>

                        <button
                          disabled={!isPlayerTurn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMove(cand);
                          }}
                          className={`p-1.5 rounded-lg text-stone-950 font-bold transition active:scale-95 cursor-pointer disabled:opacity-40 ${
                            isTop1
                              ? 'bg-emerald-500 hover:bg-emerald-400'
                              : isTop2
                              ? 'bg-sky-500 hover:bg-sky-400'
                              : 'bg-purple-500 hover:bg-purple-400'
                          }`}
                          title="Diesen Taktik-Zug spielen"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Enemy Last Move */}
          {activeSubTab === 'enemy' && (
            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-orange-500/30 text-xs text-stone-300">
              {enemyLastMove ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                    <PieceIcon
                      type={enemyLastMove.pieceType}
                      color={playerColor === 'w' ? 'b' : 'w'}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-orange-300">
                        {getPieceName(enemyLastMove.pieceType)}
                      </span>
                      <span className="font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-bold">
                        {enemyLastMove.from.toUpperCase()} ➔ {enemyLastMove.to.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {enemyLastMove.threatenedSquares.length > 0 ? (
                        <>
                          Bedroht:{' '}
                          <strong className="text-orange-400 font-mono">
                            {enemyLastMove.threatenedSquares.map((s) => s.toUpperCase()).join(', ')}
                          </strong>
                        </>
                      ) : (
                        'Keine direkten Figurenschläge durch diese Position.'
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-stone-500 text-xs">
                  Noch kein gegnerischer Zug in dieser Partie erfolgt.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Threats */}
          {activeSubTab === 'threats' && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5 text-xs">
              {attackedPieces.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Keine Figuren bedroht. Solide Stellung!</span>
                </div>
              ) : (
                attackedPieces.map((att, idx) => (
                  <div
                    key={`${att.square}-${idx}`}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                      att.isPlayerPiece
                        ? att.isHanging
                          ? 'bg-rose-950/60 border-rose-500/70 text-rose-100 shadow-sm'
                          : 'bg-stone-950/80 border-rose-500/30 text-stone-300'
                        : 'bg-stone-950/60 border-amber-500/30 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                        att.isPlayerPiece
                          ? att.isHanging
                            ? 'bg-rose-900/70 border-rose-500 text-white animate-pulse'
                            : 'bg-rose-950/40 border-rose-500/40'
                          : 'bg-stone-900 border-stone-700'
                      }`}>
                        <PieceIcon type={att.pieceType} color={att.color} className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-semibold">
                          <span className="font-mono text-white uppercase text-xs">{att.square}</span>
                          <span className="text-stone-400 text-[11px]">({getPieceName(att.pieceType)})</span>
                          {att.attackersCount > 1 && (
                            <span className="px-1 rounded bg-rose-900/80 text-rose-300 border border-rose-600/50 text-[9px] font-mono font-bold">
                              {att.attackersCount}× angegriffen
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                          {att.isPlayerPiece ? (
                            att.isHanging ? (
                              <strong className="text-rose-400 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping inline-block" />
                                Ungedeckt & sofort schlagbar!
                              </strong>
                            ) : (
                              <span>Wird bedroht (verteidigt)</span>
                            )
                          ) : (
                            'Gegnerische Figur angreifbar'
                          )}
                          {att.attackerTypes && att.attackerTypes.length > 0 && (
                            <span className="text-stone-500">
                              durch {att.attackerTypes.map(getPieceName).join(', ')}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold block ${
                          att.isPlayerPiece
                            ? att.isHanging
                              ? 'bg-rose-500 text-white'
                              : 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {att.isPlayerPiece ? (att.isHanging ? 'GEFAHR' : 'BEDROHT') : 'ANGRIFF'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Multi-Move Planning Line */}
          {activeSubTab === 'planning' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 px-0.5">
                <span>Vorausplanung für Zug-Tipp wählen:</span>
                <span className="text-[10px] text-cyan-400 font-mono">Greedy 4-Halbzüge</span>
              </div>

              {/* Selector for Plan candidate */}
              <div className="grid grid-cols-3 gap-1.5">
                {candidateMoves.map((cand) => {
                  const isSelected = activePlanRank === cand.rank;
                  return (
                    <button
                      key={cand.rank}
                      onClick={() => onSelectPlanRank && onSelectPlanRank(cand.rank)}
                      className={`p-1.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-sm'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold text-stone-400">
                        Plan #{cand.rank}
                      </span>
                      <span className="font-mono font-extrabold text-xs text-white">
                        {cand.san}
                      </span>
                      <span className="text-[8.5px] text-stone-400 font-mono">
                        {cand.winPercentage}% Sieg
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Display the active plan steps */}
              {(() => {
                const currentPlanMove = candidateMoves.find((c) => c.rank === (activePlanRank ?? 1)) || candidateMoves[0];
                const steps = currentPlanMove?.plannedLine || [];

                if (!currentPlanMove) {
                  return <div className="text-center py-2 text-xs text-stone-500">Kein Plan aktiv</div>;
                }

                return (
                  <div className="p-2.5 rounded-xl bg-stone-950/80 border border-cyan-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Route className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-cyan-300">
                          Linie für #{currentPlanMove.rank} ({currentPlanMove.san})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">
                        {steps.length} Züge voraus
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {steps.map((step) => {
                        const isWhite = step.color === 'w';
                        return (
                          <div
                            key={step.step}
                            className={`p-1.5 rounded-lg border flex items-center justify-between text-xs ${
                              isWhite
                                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100'
                                : 'bg-amber-950/40 border-amber-500/30 text-amber-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] ${
                                isWhite
                                  ? 'bg-cyan-500 text-stone-950'
                                  : 'bg-amber-500 text-stone-950'
                              }`}>
                                #{step.step}
                              </span>
                              <div>
                                <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
                                  <span>{step.san}</span>
                                  <span className="text-[10px] text-stone-400 font-normal">
                                    ({step.from.toUpperCase()}➔{step.to.toUpperCase()})
                                  </span>
                                </div>
                                <div className="text-[9.5px] text-stone-400">
                                  {step.explanation}
                                </div>
                              </div>
                            </div>

                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 shrink-0">
                              {isWhite ? 'Weiß' : 'Schwarz'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-stone-400">
                      <span>Pfeile auf dem Brett visualisiert: Cyan (Weiß), Bernstein (Schwarz)</span>
                      <button
                        disabled={!isPlayerTurn}
                        onClick={() => onSelectMove(currentPlanMove)}
                        className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-40"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Starten ({currentPlanMove.san})</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
