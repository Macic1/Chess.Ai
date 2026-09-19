import React from 'react';
import { PlayerColor, CapturedPieces as CapturedPiecesType } from '../types';
import { PieceIcon } from './PieceIcon';
import { Users, RotateCcw, AlertCircle, ShieldAlert, Trophy, Sparkles } from 'lucide-react';

interface HumanVsHumanProfileProps {
  currentTurn: PlayerColor;
  inCheck: boolean;
  isGameOver: boolean;
  winner: PlayerColor | 'draw' | null;
  capturedPieces?: CapturedPiecesType;
  onFlipBoard: () => void;
  boardOrientation: PlayerColor;
}

export const HumanVsHumanProfile: React.FC<HumanVsHumanProfileProps> = ({
  currentTurn,
  inCheck,
  isGameOver,
  winner,
  capturedPieces = { w: [], b: [] },
  onFlipBoard,
  boardOrientation,
}) => {
  const isWhiteTurn = currentTurn === 'w';

  // Calculate material difference safely
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const whiteList = capturedPieces?.w || [];
  const blackList = capturedPieces?.b || [];
  const whiteCapturedPoints = whiteList.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const blackCapturedPoints = blackList.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const whiteAdvantage = whiteCapturedPoints - blackCapturedPoints;

  return (
    <div
      id="human-vs-human-panel"
      className="w-full bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 backdrop-blur-xs"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Mensch gegen Mensch
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider">
                Lokal
              </span>
            </h2>
            <p className="text-[11px] text-stone-400">2 Personen spielen am selben Gerät</p>
          </div>
        </div>

        <button
          id="btn-flip-board-pvp"
          onClick={onFlipBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
          title="Brett um 180 Grad drehen"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Ansicht drehen</span>
        </button>
      </div>

      {/* Dynamic Turn Announcement Banner */}
      {!isGameOver ? (
        <div
          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
            isWhiteTurn
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/5'
              : 'bg-stone-800/80 border-stone-700 text-stone-100 shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full border-2 animate-pulse ${
                isWhiteTurn ? 'bg-amber-400 border-white ring-4 ring-amber-400/20' : 'bg-stone-950 border-stone-400 ring-4 ring-stone-700/40'
              }`}
            />
            <div>
              <div className="text-xs font-bold tracking-tight">
                {isWhiteTurn ? 'Mensch (Weiß) ist am Zug' : 'Mensch (Schwarz) ist am Zug'}
              </div>
              <div className="text-[10px] text-stone-400">
                {isWhiteTurn ? 'Führe deinen Zug mit den weißen Figuren aus' : 'Führe deinen Zug mit den schwarzen Figuren aus'}
              </div>
            </div>
          </div>

          {inCheck && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-bold animate-bounce">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>SCHACH!</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-3 text-amber-300 text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {winner === 'draw'
              ? 'Partie beendet: Unentschieden (Remis)!'
              : winner === 'w'
              ? 'Partie beendet: Mensch (Weiß) hat gewonnen!'
              : 'Partie beendet: Mensch (Schwarz) hat gewonnen!'}
          </span>
        </div>
      )}

      {/* Two Players Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* White Player */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            isWhiteTurn && !isGameOver
              ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
              : 'bg-stone-950/60 border-stone-800/80 opacity-85'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-950 font-black text-[11px] shadow-sm">
                W
              </div>
              <span className="text-xs font-bold text-stone-100">Spieler 1</span>
            </div>
            {whiteAdvantage > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +{whiteAdvantage}
              </span>
            )}
          </div>
          <div className="text-[11px] text-stone-400 mb-1.5 flex items-center justify-between">
            <span>Farbe: Weiß</span>
            {boardOrientation === 'w' && <span className="text-[9px] text-amber-400">Unten</span>}
          </div>
          <div className="min-h-[22px]">
            <div className="flex items-center -space-x-1 min-h-[22px] overflow-x-auto py-0.5">
              {whiteList.length > 0 ? (
                whiteList.map((p, i) => (
                  <PieceIcon key={i} type={p} color="b" className="w-5 h-5 drop-shadow-xs shrink-0" />
                ))
              ) : (
                <span className="text-[10px] text-stone-500 italic">Noch keine Beute</span>
              )}
            </div>
          </div>
        </div>

        {/* Black Player */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            !isWhiteTurn && !isGameOver
              ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
              : 'bg-stone-950/60 border-stone-800/80 opacity-85'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-stone-100 font-black text-[11px] shadow-sm">
                S
              </div>
              <span className="text-xs font-bold text-stone-100">Spieler 2</span>
            </div>
            {whiteAdvantage < 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +{Math.abs(whiteAdvantage)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-stone-400 mb-1.5 flex items-center justify-between">
            <span>Farbe: Schwarz</span>
            {boardOrientation === 'b' && <span className="text-[9px] text-amber-400">Unten</span>}
          </div>
          <div className="min-h-[22px]">
            <div className="flex items-center -space-x-1 min-h-[22px] overflow-x-auto py-0.5">
              {blackList.length > 0 ? (
                blackList.map((p, i) => (
                  <PieceIcon key={i} type={p} color="w" className="w-5 h-5 drop-shadow-xs shrink-0" />
                ))
              ) : (
                <span className="text-[10px] text-stone-500 italic">Noch keine Beute</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Hint on 3 Tactics for Both Players */}
      <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Dynamische 3-Farben-Taktiken aktiv:</strong> Im Taktik-Fenster unten werden die 3 Züge (Aggressiv, Solide, Positionell) in jedem Zug live für den Spieler berechnet, der gerade am Zug ist!
        </span>
      </div>
    </div>
  );
};
