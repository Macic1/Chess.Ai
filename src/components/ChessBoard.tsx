import React, { useState, useRef, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PlayerColor, PieceType, BoardTheme, PieceCustomizationState } from '../types';
import { CandidateMoveOption, AttackedPieceInfo, EnemyLastMoveInfo, PlannedMoveStep } from '../services/tacticalAnalysis';
import { PieceIcon } from './PieceIcon';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Sparkles } from 'lucide-react';

export { type BoardTheme };

export interface ChessBoardProps {
  game: Chess;
  playerColor: PlayerColor;
  onMove: (from: Square, to: Square, promotion?: PieceType) => boolean;
  isAiThinking: boolean;
  isGameOver: boolean;
  lastMove: { from: Square; to: Square } | null;
  hintMove: { from: Square; to: Square } | null;
  theme?: BoardTheme;
  onThemeChange?: (theme: BoardTheme) => void;
  pieceCustomization?: PieceCustomizationState;
  onOpenPieceCustomizer?: () => void;
  isAiVsAi?: boolean;
  isPvP?: boolean;
  isOnline?: boolean;
  debugMode?: boolean;
  candidateMoves?: CandidateMoveOption[];
  hoveredCandidateRank?: number | null;
  attackedPieces?: AttackedPieceInfo[];
  enemyLastMoveInfo?: EnemyLastMoveInfo | null;
  onSelectCandidateMove?: (candidate: CandidateMoveOption) => void;
  showArrows?: boolean;
  showThreats?: boolean;
  showEnemyMove?: boolean;
  plannedLine?: PlannedMoveStep[] | null;
  activePlanRank?: number | null;
}

export const THEME_STYLES: Record<
  BoardTheme,
  {
    name: string;
    description: string;
    light: string;
    dark: string;
    lightHex: string;
    darkHex: string;
    lightHighlight: string;
    darkHighlight: string;
    border: string;
    coordText: string;
  }
> = {
  green: {
    name: 'Turnier Grün',
    description: 'Klassisches FIDE-Filztuch',
    light: 'bg-[#eeeed2]',
    dark: 'bg-[#769656]',
    lightHex: '#eeeed2',
    darkHex: '#769656',
    lightHighlight: 'bg-[#f7f783]',
    darkHighlight: 'bg-[#baca44]',
    border: 'border-[#3a4730] bg-[#293222]',
    coordText: 'text-[#d4d8b8]',
  },
  wood: {
    name: 'Walnuss & Ahorn',
    description: 'Natürliches Echtholz',
    light: 'bg-[#f0d9b5]',
    dark: 'bg-[#b58863]',
    lightHex: '#f0d9b5',
    darkHex: '#b58863',
    lightHighlight: 'bg-[#ced26b]',
    darkHighlight: 'bg-[#aaa23b]',
    border: 'border-[#3b2b1e] bg-[#2d1f14]',
    coordText: 'text-[#d6c4aa]',
  },
  blue: {
    name: 'Königsblau',
    description: 'Modernes Ozeanblau',
    light: 'bg-[#dee3e6]',
    dark: 'bg-[#527382]',
    lightHex: '#dee3e6',
    darkHex: '#527382',
    lightHighlight: 'bg-[#b3d4e8]',
    darkHighlight: 'bg-[#437e9d]',
    border: 'border-[#1e2d36] bg-[#152027]',
    coordText: 'text-[#cad5dc]',
  },
  amber: {
    name: 'Karamell & Gold',
    description: 'Warmer Vintage-Ton',
    light: 'bg-[#fef3c7]',
    dark: 'bg-[#d97706]',
    lightHex: '#fef3c7',
    darkHex: '#d97706',
    lightHighlight: 'bg-[#fef08a]',
    darkHighlight: 'bg-[#f59e0b]',
    border: 'border-[#78350f] bg-[#451a03]',
    coordText: 'text-[#fed7aa]',
  },
  emerald: {
    name: 'Kaiser-Smaragd',
    description: 'Tiefgrünes Malachit',
    light: 'bg-[#e2e8f0]',
    dark: 'bg-[#047857]',
    lightHex: '#e2e8f0',
    darkHex: '#047857',
    lightHighlight: 'bg-[#a7f3d0]',
    darkHighlight: 'bg-[#059669]',
    border: 'border-[#064e3b] bg-[#022c22]',
    coordText: 'text-[#a7f3d0]',
  },
  charcoal: {
    name: 'Obsidian & Platin',
    description: 'Eleganter Anthrazit-Look',
    light: 'bg-[#e2e8f0]',
    dark: 'bg-[#475569]',
    lightHex: '#e2e8f0',
    darkHex: '#475569',
    lightHighlight: 'bg-[#cbd5e1]',
    darkHighlight: 'bg-[#64748b]',
    border: 'border-[#1e293b] bg-[#0f172a]',
    coordText: 'text-[#cbd5e1]',
  },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  playerColor,
  onMove,
  isAiThinking,
  isGameOver,
  lastMove,
  hintMove,
  theme = 'green',
  onThemeChange,
  pieceCustomization,
  onOpenPieceCustomizer,
  isAiVsAi = false,
  isPvP = false,
  isOnline = false,
  debugMode = false,
  candidateMoves = [],
  hoveredCandidateRank = null,
  attackedPieces = [],
  enemyLastMoveInfo = null,
  onSelectCandidateMove,
  showArrows = true,
  showThreats = true,
  showEnemyMove = true,
  plannedLine = null,
  activePlanRank = null,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [currentTheme, setCurrentTheme] = useState<BoardTheme>(theme);

  // Marked squares feature: clicking an enemy piece marks its attack/move squares; disappears on next move
  const [enemySelectedSquare, setEnemySelectedSquare] = useState<Square | null>(null);
  const [markedSquares, setMarkedSquares] = useState<Set<Square>>(new Set());

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  // CRITICAL: The markings automatically disappear as soon as ANYONE makes the next move!
  useEffect(() => {
    setEnemySelectedSquare(null);
    setMarkedSquares(new Set());
  }, [lastMove]);

  const boardRef = useRef<HTMLDivElement>(null);
  const activeTurnColor = isPvP ? (game.turn() as PlayerColor) : playerColor;
  const isPlayerTurn = isPvP
    ? !isGameOver
    : isOnline
    ? game.turn() === playerColor && !isGameOver
    : !isAiVsAi && game.turn() === playerColor && !isAiThinking && !isGameOver;

  const handleSetTheme = (newTheme: BoardTheme) => {
    setCurrentTheme(newTheme);
    if (onThemeChange) onThemeChange(newTheme);
  };

  // Helper to compute all squares that a piece attacks or can move to
  const getPieceScope = (boardGame: Chess, sq: Square): Square[] => {
    const p = boardGame.get(sq);
    if (!p) return [];

    const fList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rList = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const fIdx = fList.indexOf(sq[0]);
    const rIdx = rList.indexOf(sq[1]);
    const scope = new Set<Square>();

    // 1. Try to get legal moves using cloned chess instance with active color
    try {
      const fenParts = boardGame.fen().split(' ');
      fenParts[1] = p.color;
      fenParts[3] = '-'; // clear en-passant to ensure clean FEN
      const clone = new Chess(fenParts.join(' '));
      const moves = clone.moves({ square: sq, verbose: true });
      moves.forEach((m) => scope.add(m.to as Square));
    } catch {
      // ignore, fallback to geometric calculation
    }

    // 2. Geometric attacks & movements
    const addIfValid = (f: number, r: number) => {
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        scope.add(`${fList[f]}${rList[r]}` as Square);
        return true;
      }
      return false;
    };

    const raycast = (df: number, dr: number) => {
      let f = fIdx + df;
      let r = rIdx + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const targetSq = `${fList[f]}${rList[r]}` as Square;
        scope.add(targetSq);
        if (boardGame.get(targetSq)) break;
        f += df;
        r += dr;
      }
    };

    if (p.type === 'p') {
      const dir = p.color === 'w' ? 1 : -1;
      // Attacks
      addIfValid(fIdx - 1, rIdx + dir);
      addIfValid(fIdx + 1, rIdx + dir);
      // Pushes
      const oneForward = `${fList[fIdx]}${rList[rIdx + dir]}` as Square;
      if (!boardGame.get(oneForward)) {
        scope.add(oneForward);
        const startRank = p.color === 'w' ? 1 : 6;
        if (rIdx === startRank) {
          const twoForward = `${fList[fIdx]}${rList[rIdx + 2 * dir]}` as Square;
          if (!boardGame.get(twoForward)) {
            scope.add(twoForward);
          }
        }
      }
    } else if (p.type === 'n') {
      [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ].forEach(([df, dr]) => addIfValid(fIdx + df, rIdx + dr));
    } else if (p.type === 'b') {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([df, dr]) => raycast(df, dr));
    } else if (p.type === 'r') {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([df, dr]) => raycast(df, dr));
    } else if (p.type === 'q') {
      [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ].forEach(([df, dr]) => raycast(df, dr));
    } else if (p.type === 'k') {
      [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ].forEach(([df, dr]) => addIfValid(fIdx + df, rIdx + dr));
    }

    return Array.from(scope);
  };

  // Board orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedFiles = playerColor === 'w' ? files : [...files].reverse();
  const displayedRanks = playerColor === 'w' ? ranks : [...ranks].reverse();

  // Find King square if currently in check
  let checkSquare: Square | null = null;
  if (game.inCheck()) {
    const board = game.board();
    const currentTurn = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          checkSquare = (files[c] + ranks[r]) as Square;
          break;
        }
      }
    }
  }

  // Calculate sliding move animation offset
  const getMoveOffset = (square: Square, pieceType: string) => {
    if (!lastMove) return null;

    // Normal move target
    if (lastMove.to === square) {
      const fromFile = lastMove.from[0];
      const fromRank = lastMove.from[1];
      const toFile = lastMove.to[0];
      const toRank = lastMove.to[1];

      const fromCol = displayedFiles.indexOf(fromFile);
      const fromRow = displayedRanks.indexOf(fromRank);
      const toCol = displayedFiles.indexOf(toFile);
      const toRow = displayedRanks.indexOf(toRank);

      if (fromCol !== -1 && fromRow !== -1 && toCol !== -1 && toRow !== -1) {
        return {
          x: (fromCol - toCol) * 100,
          y: (fromRow - toRow) * 100,
        };
      }
    }

    // Handle castling rook slide
    if (pieceType === 'r') {
      // White Kingside: e1->g1, rook h1->f1
      if (lastMove.from === 'e1' && lastMove.to === 'g1' && square === 'f1') {
        const fromCol = displayedFiles.indexOf('h');
        const toCol = displayedFiles.indexOf('f');
        return { x: (fromCol - toCol) * 100, y: 0 };
      }
      // White Queenside: e1->c1, rook a1->d1
      if (lastMove.from === 'e1' && lastMove.to === 'c1' && square === 'd1') {
        const fromCol = displayedFiles.indexOf('a');
        const toCol = displayedFiles.indexOf('d');
        return { x: (fromCol - toCol) * 100, y: 0 };
      }
      // Black Kingside: e8->g8, rook h8->f8
      if (lastMove.from === 'e8' && lastMove.to === 'g8' && square === 'f8') {
        const fromCol = displayedFiles.indexOf('h');
        const toCol = displayedFiles.indexOf('f');
        return { x: (fromCol - toCol) * 100, y: 0 };
      }
      // Black Queenside: e8->c8, rook a8->d8
      if (lastMove.from === 'e8' && lastMove.to === 'c8' && square === 'd8') {
        const fromCol = displayedFiles.indexOf('a');
        const toCol = displayedFiles.indexOf('d');
        return { x: (fromCol - toCol) * 100, y: 0 };
      }
    }

    return null;
  };

  const getSquareCoords = (sq: Square) => {
    const col = displayedFiles.indexOf(sq[0]);
    const row = displayedRanks.indexOf(sq[1]);
    if (col === -1 || row === -1) return null;
    return {
      x: col * 12.5 + 6.25,
      y: row * 12.5 + 6.25,
    };
  };

  // Computes shortened line coordinates so arrows end cleanly before the target square / piece
  const getArrowLineCoords = (fromSq: Square, toSq: Square) => {
    const from = getSquareCoords(fromSq);
    const to = getSquareCoords(toSq);
    if (!from || !to) return null;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;

    const ux = dx / dist;
    const uy = dy / dist;

    // Start slightly outside the origin piece
    const startOffset = Math.min(2.5, dist * 0.2);
    // End before reaching the destination square (stops right in front of the target field)
    const endOffset = Math.min(5.2, dist * 0.45);

    return {
      x1: from.x + ux * startOffset,
      y1: from.y + uy * startOffset,
      x2: to.x - ux * endOffset,
      y2: to.y - uy * endOffset,
    };
  };

  const handleSquareClick = (square: Square) => {
    // In spectator AI vs AI mode: allow clicking any piece to inspect its tactical reach
    if (isAiVsAi) {
      const clickedPiece = game.get(square);
      if (clickedPiece) {
        if (enemySelectedSquare === square) {
          setEnemySelectedSquare(null);
          setMarkedSquares(new Set());
        } else {
          setEnemySelectedSquare(square);
          const scopeSquares = getPieceScope(game, square);
          setMarkedSquares(new Set(scopeSquares));
        }
      } else {
        setEnemySelectedSquare(null);
        setMarkedSquares(new Set());
      }
      return;
    }

    // If player has a piece selected to move:
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicked square is legal move
      const validMove = legalMoves.find((m) => m.to === square);
      if (validMove) {
        const piece = game.get(selectedSquare);
        const isPromotion =
          piece?.type === 'p' &&
          ((activeTurnColor === 'w' && square[1] === '8') || (activeTurnColor === 'b' && square[1] === '1'));

        const success = onMove(selectedSquare, square, isPromotion ? 'q' : undefined);
        if (success) {
          setSelectedSquare(null);
          setLegalMoves([]);
          // Markings disappear as soon as anyone makes a move!
          setEnemySelectedSquare(null);
          setMarkedSquares(new Set());
          return;
        }
      }
    }

    // If in debug mode and no piece is selected yet, clicking a candidate target square triggers that move
    if (debugMode && !selectedSquare && isPlayerTurn) {
      const candidateTarget = candidateMoves.find((c) => c.to === square);
      if (candidateTarget) {
        if (onSelectCandidateMove) {
          onSelectCandidateMove(candidateTarget);
          return;
        } else {
          const success = onMove(
            candidateTarget.from,
            candidateTarget.to,
            (candidateTarget.move.promotion as PieceType) || undefined
          );
          if (success) {
            setSelectedSquare(null);
            setLegalMoves([]);
            setEnemySelectedSquare(null);
            setMarkedSquares(new Set());
            return;
          }
        }
      }
    }

    const clickedPiece = game.get(square);

    // 1. If clicked on an ENEMY piece (in non-PvP mode):
    if (!isPvP && clickedPiece && clickedPiece.color !== playerColor) {
      setSelectedSquare(null);
      setLegalMoves([]);

      // Clicking the same enemy piece again toggles off
      if (enemySelectedSquare === square) {
        setEnemySelectedSquare(null);
        setMarkedSquares(new Set());
        return;
      }

      // Mark this enemy piece and all squares it can reach / attack
      setEnemySelectedSquare(square);
      const scopeSquares = getPieceScope(game, square);
      setMarkedSquares(new Set(scopeSquares));
      return;
    }

    // 2. If an enemy piece is currently selected or squares are marked:
    if (enemySelectedSquare || markedSquares.size > 0) {
      // If clicking current player's piece, allow normal move selection
      if (clickedPiece && clickedPiece.color === activeTurnColor && isPlayerTurn) {
        setEnemySelectedSquare(null);
        setMarkedSquares(new Set());
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves);
        return;
      }

      // Clicking other squares toggles mark on that square
      setMarkedSquares((prev) => {
        const next = new Set(prev);
        if (next.has(square)) {
          next.delete(square);
        } else {
          next.add(square);
        }
        return next;
      });
      return;
    }

    // 3. Normal selection of moving player piece
    if (clickedPiece && clickedPiece.color === activeTurnColor && isPlayerTurn) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, square: Square) => {
    e.preventDefault();
    setMarkedSquares((prev) => {
      const next = new Set(prev);
      if (next.has(square)) {
        next.delete(square);
      } else {
        next.add(square);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!isPlayerTurn) {
      e.preventDefault();
      return;
    }
    const piece = game.get(square);
    if (!piece || piece.color !== activeTurnColor) {
      e.preventDefault();
      return;
    }

    setDraggedSquare(square);
    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    setLegalMoves(moves);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    if (!draggedSquare || !isPlayerTurn) return;

    const validMove = legalMoves.find((m) => m.to === targetSquare);
    if (validMove) {
      const piece = game.get(draggedSquare);
      const isPromotion =
        piece?.type === 'p' &&
        ((activeTurnColor === 'w' && targetSquare[1] === '8') || (activeTurnColor === 'b' && targetSquare[1] === '1'));

      const success = onMove(draggedSquare, targetSquare, isPromotion ? 'q' : undefined);
      if (success) {
        // Disappear when next move happens
        setEnemySelectedSquare(null);
        setMarkedSquares(new Set());
      }
    }

    setDraggedSquare(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const currentThemeStyle = THEME_STYLES[currentTheme];

  return (
    <div className="flex flex-col items-center justify-center select-none w-full max-w-[560px] mx-auto p-1 sm:p-3">
      {/* Theme Switcher and Turn Bar */}
      <div className="w-full mb-2 flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              game.turn() === 'w'
                ? 'bg-stone-100 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                : 'bg-stone-900 border border-stone-500 shadow-[0_0_8px_rgba(0,0,0,0.8)]'
            }`}
          />
          <span className="font-semibold text-stone-200">
            {game.turn() === 'w' ? 'Weiß am Zug' : 'Schwarz am Zug'}
          </span>
          {isAiThinking && (
            <span className="flex items-center gap-1 text-amber-400 text-[11px] font-medium ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              KI überlegt...
            </span>
          )}
        </div>

        {/* Board Design Switcher */}
        <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-800 rounded-lg p-1">
          <Palette className="w-3.5 h-3.5 text-stone-400 ml-1 mr-0.5 hidden sm:inline" />
          {(['green', 'wood', 'blue', 'amber', 'emerald', 'charcoal'] as BoardTheme[]).map((t) => {
            const st = THEME_STYLES[t];
            return (
              <button
                key={t}
                id={`btn-theme-${t}`}
                onClick={() => handleSetTheme(t)}
                title={`${st.name} (${st.description})`}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  currentTheme === t
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                }`}
              >
                {/* 2x2 Mini Color preview */}
                <span className="w-2.5 h-2.5 rounded-sm overflow-hidden flex flex-wrap border border-black/30 shadow-xs">
                  <span className="w-1/2 h-1/2" style={{ backgroundColor: st.lightHex }} />
                  <span className="w-1/2 h-1/2" style={{ backgroundColor: st.darkHex }} />
                  <span className="w-1/2 h-1/2" style={{ backgroundColor: st.darkHex }} />
                  <span className="w-1/2 h-1/2" style={{ backgroundColor: st.lightHex }} />
                </span>
                <span className="hidden md:inline">{st.name.split(' ')[0]}</span>
              </button>
            );
          })}
          {onOpenPieceCustomizer && (
            <button
              id="btn-open-piece-customizer"
              onClick={onOpenPieceCustomizer}
              title="Figuren-Anpassung: Regulär oder Individuell pro Spieler"
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer border ml-1 ${
                pieceCustomization?.enabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700/80 border-stone-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Figuren:</span>
              <span>{pieceCustomization?.enabled ? 'Individuell' : 'Regulär'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Enemy Sight / Marked Fields Info Toast */}
      <AnimatePresence>
        {(enemySelectedSquare || markedSquares.size > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            className="w-full mb-2 overflow-hidden"
          >
            <div className="w-full px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/90 via-stone-900 to-stone-950 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
                <span className="truncate">
                  {enemySelectedSquare ? (
                    <>
                      Gegner-Figur auf <strong className="text-white font-mono uppercase font-bold">{enemySelectedSquare}</strong> markiert ({markedSquares.size} Zielfelder)
                    </>
                  ) : (
                    <>
                      {markedSquares.size} {markedSquares.size === 1 ? 'Feld' : 'Felder'} markiert
                    </>
                  )}
                  <span className="text-rose-400/80 hidden sm:inline ml-1.5">
                    • Markierung verschwindet beim nächsten Zug
                  </span>
                </span>
              </div>
              <button
                id="btn-clear-marked-squares"
                onClick={() => {
                  setEnemySelectedSquare(null);
                  setMarkedSquares(new Set());
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-100 text-[11px] font-semibold transition cursor-pointer shrink-0 ml-2 border border-rose-500/40"
              >
                ✕ Aufheben
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chess Board with Physical Tournament Frame */}
      <div
        className={`relative w-full aspect-square rounded-2xl shadow-2xl p-2 sm:p-3 border-4 transition-colors duration-300 ${currentThemeStyle.border}`}
      >
        {/* Ranks Notation (Left edge 8 to 1) */}
        <div className="absolute left-0.5 sm:left-1 top-2 sm:top-3 bottom-2 sm:bottom-3 w-3 sm:w-4 flex flex-col justify-around items-center pointer-events-none">
          {displayedRanks.map((r) => (
            <span key={r} className={`text-[8.5px] sm:text-[10px] font-bold ${currentThemeStyle.coordText}`}>
              {r}
            </span>
          ))}
        </div>

        {/* Files Notation (Bottom edge a to h) */}
        <div className="absolute left-5 sm:left-7 right-2 sm:right-3 bottom-0.5 h-3 sm:h-4 flex justify-around items-center pointer-events-none">
          {displayedFiles.map((f) => (
            <span key={f} className={`text-[8.5px] sm:text-[10px] font-bold ${currentThemeStyle.coordText}`}>
              {f}
            </span>
          ))}
        </div>

        {/* 8x8 Grid Squares Container */}
        <div
          ref={boardRef}
          className="relative w-full h-full rounded-xl overflow-hidden shadow-inner grid grid-cols-8 grid-rows-8"
          id="chess-game-board"
        >
          {/* Tactical SVG Arrows for Debug Mode */}
          {debugMode && (showArrows || showEnemyMove) && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <defs>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="7.5"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
                </marker>
                <marker
                  id="arrow-sky"
                  viewBox="0 0 10 10"
                  refX="7.5"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
                <marker
                  id="arrow-purple"
                  viewBox="0 0 10 10"
                  refX="7.5"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#a855f7" />
                </marker>
                <marker
                  id="arrow-orange"
                  viewBox="0 0 10 10"
                  refX="7.5"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f97316" />
                </marker>
                <marker
                  id="arrow-plan-cyan"
                  viewBox="0 0 10 10"
                  refX="7.5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#06b6d4" />
                </marker>
                <marker
                  id="arrow-plan-amber"
                  viewBox="0 0 10 10"
                  refX="7.5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
                </marker>
              </defs>

              {/* Multi-Move Planning Mode: Planned Sequence Arrows */}
              {debugMode && plannedLine && plannedLine.length > 0 && (
                <>
                  {plannedLine.map((step) => {
                    const coords = getArrowLineCoords(step.from, step.to);
                    if (!coords) return null;
                    const isWhite = step.color === 'w';
                    const markerId = isWhite ? 'arrow-plan-cyan' : 'arrow-plan-amber';
                    const strokeColor = isWhite ? '#06b6d4' : '#f59e0b';
                    // Dashed lines for deeper future steps
                    const strokeDash = step.step === 1 ? undefined : '5 4';

                    return (
                      <line
                        key={`plan-${step.step}-${step.from}-${step.to}`}
                        x1={`${coords.x1}%`}
                        y1={`${coords.y1}%`}
                        x2={`${coords.x2}%`}
                        y2={`${coords.y2}%`}
                        stroke={strokeColor}
                        strokeWidth={step.step === 1 ? '5.5' : '3.5'}
                        strokeDasharray={strokeDash}
                        strokeLinecap="round"
                        markerEnd={`url(#${markerId})`}
                        className="opacity-90 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
                      />
                    );
                  })}
                </>
              )}

              {/* Enemy Last Move Arrow */}
              {showEnemyMove && enemyLastMoveInfo && (() => {
                const coords = getArrowLineCoords(enemyLastMoveInfo.from, enemyLastMoveInfo.to);
                if (!coords) return null;
                return (
                  <line
                    x1={`${coords.x1}%`}
                    y1={`${coords.y1}%`}
                    x2={`${coords.x2}%`}
                    y2={`${coords.y2}%`}
                    stroke="#f97316"
                    strokeWidth="4.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-orange)"
                    className="opacity-80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                );
              })()}

              {/* Candidate Move Arrows */}
              {showArrows &&
                candidateMoves.map((cand) => {
                  const coords = getArrowLineCoords(cand.from, cand.to);
                  if (!coords) return null;
                  const isHovered = hoveredCandidateRank === cand.rank;
                  const markerId =
                    cand.rank === 1 ? 'arrow-emerald' : cand.rank === 2 ? 'arrow-sky' : 'arrow-purple';
                  const color = cand.badgeColor;

                  return (
                    <line
                      key={cand.rank}
                      x1={`${coords.x1}%`}
                      y1={`${coords.y1}%`}
                      x2={`${coords.x2}%`}
                      y2={`${coords.y2}%`}
                      stroke={color}
                      strokeWidth={isHovered ? '7' : '5'}
                      strokeLinecap="round"
                      markerEnd={`url(#${markerId})`}
                      className={`transition-all duration-150 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
                        hoveredCandidateRank === null
                          ? 'opacity-85'
                          : isHovered
                          ? 'opacity-100'
                          : 'opacity-25'
                      }`}
                    />
                  );
                })}
            </svg>
          )}

          {displayedRanks.map((rank, rankIdx) =>
            displayedFiles.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const piece = game.get(square);
              const isDark = (fileIdx + rankIdx) % 2 === 1;

              const isSelected = selectedSquare === square;
              const isEnemySelected = enemySelectedSquare === square;
              const isMarked = markedSquares.has(square);
              const isLastMoveFrom = lastMove?.from === square;
              const isLastMoveTo = lastMove?.to === square;
              const isHint = hintMove?.from === square || hintMove?.to === square;
              const isChecked = checkSquare === square;

              const legalMove = legalMoves.find((m) => m.to === square);
              const isLegalTarget = Boolean(legalMove);
              const isCapture = Boolean(legalMove?.captured || (legalMove?.flags && legalMove.flags.includes('e')));

              // Tactical debug flags
              const attackedInfo = debugMode ? attackedPieces.find((ap) => ap.square === square) : null;
              const candidateOrigin = debugMode ? candidateMoves.find((c) => c.from === square) : null;
              const candidateTarget = debugMode ? candidateMoves.find((c) => c.to === square) : null;
              const isEnemyMovedFrom = debugMode && enemyLastMoveInfo?.from === square;
              const isEnemyMovedTo = debugMode && enemyLastMoveInfo?.to === square;
              const plannedStepTarget = debugMode && plannedLine ? plannedLine.find((s) => s.to === square) : null;
              const plannedStepOrigin = debugMode && plannedLine ? plannedLine.find((s) => s.from === square) : null;

              // Determine square background styling
              let squareBg = isDark ? currentThemeStyle.dark : currentThemeStyle.light;
              if (isSelected) {
                squareBg = isDark ? 'bg-[#7ba355]' : 'bg-[#b9d77f]';
              } else if (isEnemySelected) {
                squareBg = isDark ? 'bg-rose-950/90' : 'bg-rose-200/90';
              } else if (isMarked && !piece) {
                squareBg = isDark ? 'bg-rose-950/45' : 'bg-rose-200/50';
              } else if (isLastMoveFrom || isLastMoveTo) {
                squareBg = isDark ? currentThemeStyle.darkHighlight : currentThemeStyle.lightHighlight;
              } else if (debugMode && showEnemyMove && (isEnemyMovedFrom || isEnemyMovedTo)) {
                squareBg = isDark
                  ? 'bg-orange-950/55 ring-1 ring-inset ring-orange-500/40'
                  : 'bg-orange-200/70 ring-1 ring-inset ring-orange-500/50';
              } else if (debugMode && showArrows && candidateTarget) {
                if (candidateTarget.rank === 1) {
                  squareBg = isDark
                    ? 'bg-emerald-950/60 ring-1.5 ring-inset ring-emerald-500/60'
                    : 'bg-emerald-200/75 ring-1.5 ring-inset ring-emerald-600/60';
                } else if (candidateTarget.rank === 2) {
                  squareBg = isDark
                    ? 'bg-sky-950/60 ring-1.5 ring-inset ring-sky-500/60'
                    : 'bg-sky-200/75 ring-1.5 ring-inset ring-sky-600/60';
                } else {
                  squareBg = isDark
                    ? 'bg-purple-950/60 ring-1.5 ring-inset ring-purple-500/60'
                    : 'bg-purple-200/75 ring-1.5 ring-inset ring-purple-600/60';
                }
              } else if (debugMode && plannedLine && plannedLine.length > 0 && (plannedStepTarget || plannedStepOrigin)) {
                if (plannedStepTarget) {
                  squareBg = isDark
                    ? 'bg-cyan-950/60 ring-1.5 ring-inset ring-cyan-500/60'
                    : 'bg-cyan-200/75 ring-1.5 ring-inset ring-cyan-600/60';
                } else {
                  squareBg = isDark
                    ? 'bg-cyan-950/30 ring-1 ring-inset ring-cyan-400/40'
                    : 'bg-cyan-100/50 ring-1 ring-inset ring-cyan-500/40';
                }
              } else if (debugMode && showArrows && candidateOrigin) {
                if (candidateOrigin.rank === 1) {
                  squareBg = isDark
                    ? 'bg-emerald-950/35 ring-1 ring-inset ring-emerald-400/50'
                    : 'bg-emerald-100/60 ring-1 ring-inset ring-emerald-500/50';
                } else if (candidateOrigin.rank === 2) {
                  squareBg = isDark
                    ? 'bg-sky-950/35 ring-1 ring-inset ring-sky-400/50'
                    : 'bg-sky-100/60 ring-1 ring-inset ring-sky-500/50';
                } else {
                  squareBg = isDark
                    ? 'bg-purple-950/35 ring-1 ring-inset ring-purple-400/50'
                    : 'bg-purple-100/60 ring-1 ring-inset ring-purple-500/50';
                }
              } else if (isHint) {
                squareBg = isDark ? 'bg-[#3b82f6]/70' : 'bg-[#93c5fd]/80';
              }

              const moveOffset = piece ? getMoveOffset(square, piece.type) : null;

              return (
                <div
                  key={square}
                  id={`square-${square}`}
                  onClick={() => handleSquareClick(square)}
                  onContextMenu={(e) => handleContextMenu(e, square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  className={`relative flex items-center justify-center transition-colors duration-150 cursor-pointer ${squareBg}`}
                >
                  {/* In-Check King Soft Glow Aura */}
                  {isChecked && (
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.95, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 z-0 bg-rose-600/60 rounded-full blur-[2px]"
                    />
                  )}

                  {/* Inspected Enemy Piece Tactical Target Ring */}
                  {isEnemySelected && (
                    <div className="absolute inset-0.5 z-20 pointer-events-none rounded-lg ring-2 ring-rose-500 bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.7)] flex items-start justify-end p-0.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    </div>
                  )}

                  {/* Marked Square Overlay */}
                  {isMarked && !isEnemySelected && (
                    <motion.div
                      initial={{ scale: 0.75, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                    >
                      {piece ? (
                        piece.color === playerColor ? (
                          // Friendly piece attacked by marked enemy piece (Threat Alert!)
                          <div className="w-[88%] h-[88%] rounded-xl ring-2 ring-rose-500 bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.6)] flex items-center justify-center">
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                          </div>
                        ) : (
                          // Defended enemy piece
                          <div className="w-[88%] h-[88%] rounded-xl ring-1 ring-amber-500/60 bg-amber-500/15" />
                        )
                      ) : (
                        // Empty square red tactical dot
                        <div className="flex items-center justify-center">
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-500/70 border border-rose-300 shadow-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tactical Overlay: Attacked Piece Indicator (Clean & Minimal) */}
                  {debugMode && showThreats && attackedInfo && (
                    <>
                      {attackedInfo.isPlayerPiece && attackedInfo.isHanging ? (
                        <>
                          <div className="absolute inset-0 z-15 pointer-events-none ring-2 ring-inset ring-rose-500 bg-rose-500/15 rounded-sm" />
                          <div
                            className="absolute bottom-0.5 left-0.5 z-25 pointer-events-none flex items-center gap-0.5"
                            title={`Ungedeckte Figur unter Beschuss von ${attackedInfo.attackersCount} Angreifer(n)`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-xs block animate-pulse" />
                            {attackedInfo.attackersCount > 1 && (
                              <span className="text-[7.5px] font-mono font-bold bg-rose-700 text-white px-1 py-0 rounded border border-rose-300 shadow-xs leading-none">
                                ×{attackedInfo.attackersCount}
                              </span>
                            )}
                          </div>
                        </>
                      ) : attackedInfo.isPlayerPiece ? (
                        <>
                          <div className="absolute inset-0 z-15 pointer-events-none ring-1.5 ring-inset ring-rose-500/40 bg-rose-500/5 rounded-sm" />
                          <div
                            className="absolute bottom-0.5 left-0.5 z-25 pointer-events-none flex items-center gap-0.5"
                            title={`Figur wird bedroht (${attackedInfo.attackersCount} Angreifer, aber verteidigt)`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-400 border border-rose-200 shadow-xs block" />
                            {attackedInfo.attackersCount > 1 && (
                              <span className="text-[7px] font-mono font-bold bg-rose-900/90 text-rose-200 px-0.5 py-0 rounded border border-rose-500/40 leading-none">
                                ×{attackedInfo.attackersCount}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div
                          className="absolute bottom-0.5 left-0.5 z-25 pointer-events-none flex items-center gap-0.5"
                          title="Gegnerische Figur angreifbar"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs block" />
                        </div>
                      )}
                    </>
                  )}

                  {/* Tactical Overlay: Enemy Move Arrival Dot & Badge */}
                  {debugMode && showEnemyMove && isEnemyMovedTo && (
                    <div className="absolute bottom-0.5 right-0.5 z-25 pointer-events-none" title="Gegnerischer Zielpunkt">
                      <span className="px-1 py-0.2 rounded bg-orange-500 text-stone-950 text-[7px] font-mono font-bold shadow-xs border border-orange-300 leading-none">
                        GEGNER
                      </span>
                    </div>
                  )}

                  {/* Tactical Overlay: Candidate Origin Badge */}
                  {debugMode && showArrows && candidateOrigin && (
                    <div className="absolute top-0.5 left-0.5 z-25 pointer-events-none">
                      <span
                        className={`px-1 py-0.2 rounded text-[7.5px] font-mono font-bold shadow-xs flex items-center justify-center border leading-none ${
                          candidateOrigin.rank === 1
                            ? 'bg-emerald-500 text-stone-950 border-emerald-300'
                            : candidateOrigin.rank === 2
                            ? 'bg-sky-500 text-stone-950 border-sky-300'
                            : 'bg-purple-500 text-stone-950 border-purple-300'
                        }`}
                        title={`Startfeld von Tipp #${candidateOrigin.rank}`}
                      >
                        #{candidateOrigin.rank}
                      </span>
                    </div>
                  )}

                  {/* Tactical Overlay: Candidate Target Ring & Win Probability Badge */}
                  {debugMode && showArrows && candidateTarget && (
                    <>
                      {/* Highlight Ring when hovered or active */}
                      <div
                        className={`absolute inset-0 z-15 pointer-events-none ring-2 ring-inset transition-all ${
                          candidateTarget.rank === 1
                            ? hoveredCandidateRank === 1
                              ? 'ring-emerald-400 bg-emerald-400/25'
                              : 'ring-emerald-500/70'
                            : candidateTarget.rank === 2
                            ? hoveredCandidateRank === 2
                              ? 'ring-sky-400 bg-sky-400/25'
                              : 'ring-sky-500/70'
                            : hoveredCandidateRank === 3
                            ? 'ring-purple-400 bg-purple-400/25'
                            : 'ring-purple-500/70'
                        }`}
                      />

                      {/* Top-Right Badge: Rank & Win Probability & Taktik-Kürzel */}
                      <div className="absolute top-0.5 right-0.5 z-25 pointer-events-none flex items-center shadow-xs">
                        <div
                          className={`flex items-center gap-0.5 px-1 py-0.2 rounded text-[7.5px] font-mono font-bold border shadow-xs leading-none ${
                            candidateTarget.rank === 1
                              ? 'bg-emerald-600 text-white border-emerald-400/70'
                              : candidateTarget.rank === 2
                              ? 'bg-sky-600 text-white border-sky-400/70'
                              : 'bg-purple-600 text-white border-purple-400/70'
                          }`}
                          title={`Taktik #${candidateTarget.rank} (${candidateTarget.tacticLabel || 'Taktik'}): ${candidateTarget.san} (${candidateTarget.winPercentage}% Siegchance)`}
                        >
                          <span className="opacity-90">#{candidateTarget.rank}</span>
                          <span className="font-extrabold">{candidateTarget.winPercentage}%</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tactical Overlay: Planning Mode Step Badge */}
                  {debugMode && plannedLine && plannedLine.length > 0 && plannedStepTarget && (
                    <div className="absolute top-0.5 right-0.5 z-25 pointer-events-none flex items-center shadow-xs">
                      <div
                        className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-mono font-bold border shadow-xs leading-none ${
                          plannedStepTarget.color === 'w'
                            ? 'bg-cyan-600 text-white border-cyan-300'
                            : 'bg-amber-600 text-white border-amber-300'
                        }`}
                        title={`Geplanter Zug #${plannedStepTarget.step}: ${plannedStepTarget.san} (${plannedStepTarget.color === 'w' ? 'Weiß' : 'Schwarz'})`}
                      >
                        <span>Zug {plannedStepTarget.step}:</span>
                        <span className="font-black">{plannedStepTarget.san}</span>
                      </div>
                    </div>
                  )}

                  {/* Piece Rendering with Hardware-Accelerated Smooth Slide Motion */}
                  {piece && (
                    <motion.div
                      key={`${square}-${piece.color}-${piece.type}-${lastMove?.from || ''}-${lastMove?.to || ''}`}
                      initial={moveOffset ? { x: `${moveOffset.x}%`, y: `${moveOffset.y}%`, scale: 1.04 } : false}
                      animate={{ x: 0, y: 0, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 340,
                        damping: 27,
                        mass: 0.85,
                      }}
                      draggable={isPlayerTurn && piece.color === playerColor}
                      onDragStart={(e) => handleDragStart(e, square)}
                      className={`relative z-10 w-[84%] h-[84%] flex items-center justify-center transition-transform duration-100 ${
                        piece.color === playerColor && isPlayerTurn
                          ? 'hover:scale-105 active:scale-110 active:-translate-y-1 cursor-grab active:cursor-grabbing'
                          : 'cursor-default'
                      } ${draggedSquare === square ? 'opacity-30 scale-95' : 'opacity-100'}`}
                    >
                      <PieceIcon
                        type={piece.type as PieceType}
                        color={piece.color as PlayerColor}
                        className="w-full h-full drop-shadow-[0_4px_5px_rgba(0,0,0,0.4)]"
                        customization={
                          pieceCustomization?.enabled
                            ? piece.color === 'w'
                              ? pieceCustomization.white
                              : pieceCustomization.black
                            : undefined
                        }
                      />
                    </motion.div>
                  )}

                  {/* Legal Move Indicators with Spring Scale Animation */}
                  <AnimatePresence>
                    {isLegalTarget && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                      >
                        {isCapture || piece ? (
                          <div className="w-[84%] h-[84%] rounded-full border-4 border-black/25 dark:border-black/35 ring-1 ring-white/30" />
                        ) : (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/25 shadow-inner" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tactical Hint Target Halo */}
                  {isHint && (
                    <motion.div
                      animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="absolute inset-1 z-10 border-2 border-blue-500 rounded-lg pointer-events-none shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Alert Bar below Board */}
      {checkSquare && !game.isGameOver() && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>SCHACH! Der König steht unter Beschuss.</span>
        </motion.div>
      )}
    </div>
  );
};
