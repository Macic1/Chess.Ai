import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieceType,
  PlayerColor,
  PieceCustomizationState,
  CustomArmyPreset,
} from '../types';
import { PieceIcon } from './PieceIcon';
import {
  BoardSquare,
  DEFAULT_STARTING_FEN,
  EMPTY_BOARD_FEN,
  fenToBoard,
  boardToFen,
  validateBoard,
  getSavedCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  BoardValidationResult,
} from '../services/boardEditorService';
import {
  Sparkles,
  Trash2,
  RotateCcw,
  Plus,
  Check,
  AlertCircle,
  Save,
  Play,
  Layers,
  ArrowUpDown,
  BookOpen,
  Info,
  Crown,
} from 'lucide-react';

interface BoardSetupEditorProps {
  customization: PieceCustomizationState;
  onApplyCustomSetup: (fen: string, presetName?: string) => void;
  onClose?: () => void;
  isGameInProgress?: boolean;
}

const PIECE_TYPES: { type: PieceType; name: string; maxHint?: string }[] = [
  { type: 'k', name: 'König', maxHint: 'Genau 1' },
  { type: 'q', name: 'Dame', maxHint: 'Beliebig viele' },
  { type: 'r', name: 'Turm', maxHint: 'Beliebig viele' },
  { type: 'b', name: 'Läufer', maxHint: 'Beliebig viele' },
  { type: 'n', name: 'Springer', maxHint: 'Beliebig viele' },
  { type: 'p', name: 'Bauer', maxHint: 'Reihen 2-7' },
];

export const BoardSetupEditor: React.FC<BoardSetupEditorProps> = ({
  customization,
  onApplyCustomSetup,
  onClose,
  isGameInProgress = false,
}) => {
  // Board state: 8x8 matrix (r=0 is rank 8, r=7 is rank 1, c=0 is file a, c=7 is file h)
  const [board, setBoard] = useState<BoardSquare[][]>(() => {
    if (customization.customFen) {
      try {
        return fenToBoard(customization.customFen);
      } catch {
        // fallback
      }
    }
    return fenToBoard(DEFAULT_STARTING_FEN);
  });

  const [turn, setTurn] = useState<PlayerColor>('w');
  const [activeTool, setActiveTool] = useState<{ type: PieceType; color: PlayerColor } | 'trash' | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    source: 'bank' | 'board';
    type: PieceType;
    color: PlayerColor;
    sourceRow?: number;
    sourceCol?: number;
  } | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<{ r: number; c: number } | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Preset saving state
  const [presetName, setPresetName] = useState<string>('');
  const [savedPresets, setSavedPresets] = useState<CustomArmyPreset[]>(() => getSavedCustomPresets());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'presets'>('editor');

  // Validation calculation
  const validation: BoardValidationResult = validateBoard(board, turn);

  // Count pieces on board
  const pieceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const key = `${p.color}_${p.type}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    return counts;
  }, [board]);

  const handleSquareClick = (r: number, c: number) => {
    if (activeTool === 'trash') {
      // Clear square
      const next = board.map((row) => [...row]);
      next[r][c] = null;
      setBoard(next);
      return;
    }

    if (activeTool) {
      // Stamp active tool piece onto square
      const next = board.map((row) => [...row]);
      // If placing a pawn on row 0 or 7, warn or prevent
      if (activeTool.type === 'p' && (r === 0 || r === 7)) {
        return;
      }
      next[r][c] = { type: activeTool.type, color: activeTool.color };
      setBoard(next);
      return;
    }

    // If clicking an existing piece with no tool active, toggle picking it up as active tool
    const existing = board[r][c];
    if (existing) {
      setActiveTool({ type: existing.type, color: existing.color });
    }
  };

  const handleSquareContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    // Right-click deletes piece on square
    const next = board.map((row) => [...row]);
    next[r][c] = null;
    setBoard(next);
  };

  const handleDragStartFromBank = (e: React.DragEvent, type: PieceType, color: PlayerColor) => {
    setDraggedItem({ source: 'bank', type, color });
    e.dataTransfer.setData('text/plain', `${color}_${type}`);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragStartFromBoard = (
    e: React.DragEvent,
    type: PieceType,
    color: PlayerColor,
    r: number,
    c: number
  ) => {
    setDraggedItem({ source: 'board', type, color, sourceRow: r, sourceCol: c });
    e.dataTransfer.setData('text/plain', `${color}_${type}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!hoveredSquare || hoveredSquare.r !== r || hoveredSquare.c !== c) {
      setHoveredSquare({ r, c });
    }
  };

  const handleDropOnSquare = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    setHoveredSquare(null);

    if (!draggedItem) return;

    // Prevent pawns on row 0 or 7
    if (draggedItem.type === 'p' && (r === 0 || r === 7)) {
      setDraggedItem(null);
      return;
    }

    const next = board.map((row) => [...row]);

    // If moved from another board square, clear source square
    if (
      draggedItem.source === 'board' &&
      draggedItem.sourceRow !== undefined &&
      draggedItem.sourceCol !== undefined
    ) {
      next[draggedItem.sourceRow][draggedItem.sourceCol] = null;
    }

    // Place piece
    next[r][c] = { type: draggedItem.type, color: draggedItem.color };
    setBoard(next);
    setDraggedItem(null);
  };

  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      draggedItem?.source === 'board' &&
      draggedItem.sourceRow !== undefined &&
      draggedItem.sourceCol !== undefined
    ) {
      const next = board.map((row) => [...row]);
      next[draggedItem.sourceRow][draggedItem.sourceCol] = null;
      setBoard(next);
    }
    setDraggedItem(null);
  };

  const handleClearBoard = () => {
    setBoard(fenToBoard(EMPTY_BOARD_FEN));
  };

  const handleResetStandard = () => {
    setBoard(fenToBoard(DEFAULT_STARTING_FEN));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const fen = boardToFen(board, turn);
    const newPreset = saveCustomPreset({
      name: presetName.trim(),
      fen,
      whitePiecesCount: validation.whitePiecesCount,
      blackPiecesCount: validation.blackPiecesCount,
      turn,
    });
    setSavedPresets(getSavedCustomPresets());
    setPresetName('');
    setSaveSuccessMsg(`Preset "${newPreset.name}" erfolgreich gespeichert!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleLoadPreset = (preset: CustomArmyPreset) => {
    try {
      const loaded = fenToBoard(preset.fen);
      setBoard(loaded);
      setTurn(preset.turn || 'w');
      setActiveTab('editor');
      setSaveSuccessMsg(`Preset "${preset.name}" geladen!`);
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePreset = (id: string) => {
    const updated = deleteCustomPreset(id);
    setSavedPresets(updated);
  };

  const handleApplyCurrentBoard = (pName?: string) => {
    if (!validation.isValid) return;
    const fen = boardToFen(board, turn);
    onApplyCustomSetup(fen, pName || 'Eigene Aufstellung');
    if (onClose) onClose();
  };

  // Files & ranks arrays depending on board flip
  const displayRanks = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayFiles = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const fileLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Editor Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            id="tab-editor-board"
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schachbrett & Werkbank</span>
          </button>
          <button
            id="tab-editor-saved"
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Gespeicherte Presets ({savedPresets.length})</span>
          </button>
        </div>

        {/* Startspieler & Flip Board */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5 text-xs">
            <span className="text-[11px] text-stone-400 px-2 font-medium">1. Zug:</span>
            <button
              onClick={() => setTurn('w')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                turn === 'w' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Weiß
            </button>
            <button
              onClick={() => setTurn('b')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                turn === 'b' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Schwarz
            </button>
          </div>

          <button
            onClick={() => setIsFlipped((prev) => !prev)}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
            title="Brett-Ansicht drehen"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success alert banner */}
      <AnimatePresence>
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-semibold shadow-md"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'presets' ? (
        /* --- SAVED PRESETS LIST VIEW --- */
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Hier findest du alle deine selbst gebauten Aufstellungen. Wähle ein Preset aus, um es auf das Brett zu laden oder sofort in deiner Partie zu aktivieren!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {savedPresets.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 transition-all shadow-md flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-sm text-stone-100 truncate">{p.name}</h5>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-stone-700 font-mono shrink-0">
                      {p.turn === 'w' ? 'Weiß 1.' : 'Schwarz 1.'}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400 font-mono">
                    <span>Weiß: {p.whitePiecesCount} Figuren</span>
                    <span>•</span>
                    <span>Schwarz: {p.blackPiecesCount} Figuren</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-800/80">
                  <button
                    onClick={() => handleLoadPreset(p)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bearbeiten</span>
                  </button>
                  <button
                    onClick={() => {
                      onApplyCustomSetup(p.fen, p.name);
                      if (onClose) onClose();
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Aktivieren & Spielen</span>
                  </button>
                  <button
                    onClick={() => handleDeletePreset(p.id)}
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-900/50 text-stone-400 hover:text-rose-300 border border-stone-700 transition cursor-pointer"
                    title="Preset löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- MAIN INTERACTIVE BOARD & PALETTES VIEW --- */
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6">
          {/* LEFT: WHITE PIECE BANK / PALETTE */}
          <div className="w-full lg:w-44 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-lg flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-400 inline-block shadow-xs" />
                Weiße Figuren
              </span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {validation.whitePiecesCount} Stk ({validation.whitePoints} Pkt)
              </span>
            </div>

            <p className="text-[10px] text-stone-400">
              Ziehen oder anklicken zum Platzieren auf dem Brett:
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-2 gap-2">
              {PIECE_TYPES.map((pt) => {
                const count = pieceCounts[`w_${pt.type}`] || 0;
                const isSelected = activeTool !== 'trash' && activeTool?.type === pt.type && activeTool?.color === 'w';
                const isKing = pt.type === 'k';
                const kingMissing = isKing && count === 0;

                return (
                  <div
                    key={`bank_w_${pt.type}`}
                    draggable
                    onDragStart={(e) => handleDragStartFromBank(e, pt.type, 'w')}
                    onClick={() => {
                      if (isSelected) {
                        setActiveTool(null);
                      } else {
                        setActiveTool({ type: pt.type, color: 'w' });
                      }
                    }}
                    className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-grab active:cursor-grabbing select-none ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                        : kingMissing
                        ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                        : 'bg-stone-800/80 border-stone-700 hover:border-stone-500 hover:bg-stone-700/70'
                    }`}
                    title={`${pt.name} (Weiß) - Ziehen oder anklicken`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <PieceIcon
                        type={pt.type}
                        color="w"
                        className="w-7 h-7 drop-shadow-md"
                        customization={customization.enabled ? customization.white : undefined}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-stone-300 truncate w-full text-center">
                      {pt.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isKing
                          ? count === 1
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                          : 'bg-stone-900 text-stone-300'
                      }`}
                    >
                      {count > 0 ? `×${count}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER: THE 8x8 CHESSBOARD CANVAS */}
          <div className="flex flex-col items-center">
            {/* Active tool indicator bar */}
            <div className="w-full mb-2 px-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-[11px]">Aktiver Pinsel:</span>
                {activeTool === 'trash' ? (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Radierer aktiv
                  </span>
                ) : activeTool ? (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5">
                    <PieceIcon
                      type={activeTool.type}
                      color={activeTool.color}
                      className="w-3.5 h-3.5"
                      customization={
                        customization.enabled
                          ? activeTool.color === 'w'
                            ? customization.white
                            : customization.black
                          : undefined
                      }
                    />
                    {activeTool.color === 'w' ? 'Weiß' : 'Schwarz'}{' '}
                    {PIECE_TYPES.find((p) => p.type === activeTool.type)?.name}
                  </span>
                ) : (
                  <span className="text-stone-500 text-[11px] italic">Figur aus Palette anklicken</span>
                )}
              </div>

              {activeTool && (
                <button
                  onClick={() => setActiveTool(null)}
                  className="text-[10px] text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Pinsel abwählen
                </button>
              )}
            </div>

            {/* The 8x8 board */}
            <div className="relative p-2.5 rounded-2xl bg-stone-900 border-2 border-stone-800 shadow-2xl">
              <div className="grid grid-cols-8 grid-rows-8 w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px] rounded-xl overflow-hidden border border-stone-700 select-none">
                {displayRanks.map((r) =>
                  displayFiles.map((c) => {
                    const isLight = (r + c) % 2 === 0;
                    const piece = board[r][c];
                    const isHovered = hoveredSquare?.r === r && hoveredSquare?.c === c;
                    const squareName = `${fileLetters[c]}${8 - r}`;
                    const isPawnInvalidRank = (r === 0 || r === 7);

                    return (
                      <div
                        key={`sq_${r}_${c}`}
                        onDragOver={(e) => handleDragOver(e, r, c)}
                        onDrop={(e) => handleDropOnSquare(e, r, c)}
                        onClick={() => handleSquareClick(r, c)}
                        onContextMenu={(e) => handleSquareContextMenu(e, r, c)}
                        className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                          isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'
                        } ${
                          isHovered
                            ? 'ring-4 ring-amber-400 ring-inset bg-amber-400/40'
                            : ''
                        }`}
                        title={`${squareName} - Klicken zum Setzen oder Rechtsklick zum Löschen`}
                      >
                        {/* Square Coordinate Labels on edges */}
                        {c === (isFlipped ? 7 : 0) && (
                          <span
                            className={`absolute top-0.5 left-1 text-[9px] font-bold font-mono pointer-events-none ${
                              isLight ? 'text-[#779556]' : 'text-[#ebecd0]'
                            }`}
                          >
                            {8 - r}
                          </span>
                        )}
                        {r === (isFlipped ? 0 : 7) && (
                          <span
                            className={`absolute bottom-0.5 right-1 text-[9px] font-bold font-mono pointer-events-none ${
                              isLight ? 'text-[#779556]' : 'text-[#ebecd0]'
                            }`}
                          >
                            {fileLetters[c]}
                          </span>
                        )}

                        {/* Piece Icon on Square */}
                        {piece && (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStartFromBoard(e, piece.type, piece.color, r, c)}
                            className="w-4/5 h-4/5 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                          >
                            <PieceIcon
                              type={piece.type}
                              color={piece.color}
                              className="w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)]"
                              customization={
                                customization.enabled
                                  ? piece.color === 'w'
                                    ? customization.white
                                    : customization.black
                                  : undefined
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Bar Below Board */}
            <div className="w-full mt-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-editor-clear-board"
                  onClick={handleClearBoard}
                  className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-stone-700"
                  title="Alle Figuren vom Brett entfernen"
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Brett leeren</span>
                </button>
                <button
                  id="btn-editor-reset-standard"
                  onClick={handleResetStandard}
                  className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-stone-700"
                  title="Standard-Aufstellung 16 vs 16 wiederherstellen"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Standard 16 vs 16</span>
                </button>
              </div>

              {/* Trash Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={handleDropOnTrash}
                onClick={() => {
                  setActiveTool(activeTool === 'trash' ? null : 'trash');
                }}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTool === 'trash'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md ring-2 ring-rose-500/30'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-rose-300 hover:border-rose-500/30'
                }`}
                title="Hierhin ziehen zum Löschen oder anklicken für Radierer-Modus"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Figur löschen</span>
              </div>
            </div>
          </div>

          {/* RIGHT: BLACK PIECE BANK / PALETTE */}
          <div className="w-full lg:w-44 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-lg flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-600 inline-block shadow-xs" />
                Schwarze Figuren
              </span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {validation.blackPiecesCount} Stk ({validation.blackPoints} Pkt)
              </span>
            </div>

            <p className="text-[10px] text-stone-400">
              Ziehen oder anklicken zum Platzieren auf dem Brett:
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-2 gap-2">
              {PIECE_TYPES.map((pt) => {
                const count = pieceCounts[`b_${pt.type}`] || 0;
                const isSelected = activeTool !== 'trash' && activeTool?.type === pt.type && activeTool?.color === 'b';
                const isKing = pt.type === 'k';
                const kingMissing = isKing && count === 0;

                return (
                  <div
                    key={`bank_b_${pt.type}`}
                    draggable
                    onDragStart={(e) => handleDragStartFromBank(e, pt.type, 'b')}
                    onClick={() => {
                      if (isSelected) {
                        setActiveTool(null);
                      } else {
                        setActiveTool({ type: pt.type, color: 'b' });
                      }
                    }}
                    className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-grab active:cursor-grabbing select-none ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                        : kingMissing
                        ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                        : 'bg-stone-800/80 border-stone-700 hover:border-stone-500 hover:bg-stone-700/70'
                    }`}
                    title={`${pt.name} (Schwarz) - Ziehen oder anklicken`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <PieceIcon
                        type={pt.type}
                        color="b"
                        className="w-7 h-7 drop-shadow-md"
                        customization={customization.enabled ? customization.black : undefined}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-stone-300 truncate w-full text-center">
                      {pt.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isKing
                          ? count === 1
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                          : 'bg-stone-900 text-stone-300'
                      }`}
                    >
                      {count > 0 ? `×${count}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Validation & Errors/Warnings Banner */}
      {validation.errors.length > 0 ? (
        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold text-rose-300">Aufstellung noch unvollständig:</strong>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">
            Gültige Schachstellung ({validation.whitePiecesCount} Weiß vs. {validation.blackPiecesCount} Schwarz) – spielbereit für alle Spielmodi!
          </span>
        </div>
      )}

      {/* BOTTOM SECTION: SAVE AS CUSTOM PRESET & APPLY CONTROLS */}
      <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Save Preset Input Form */}
        <div className="w-full md:flex-1 flex items-center gap-2">
          <input
            id="input-custom-preset-name"
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset-Name (z.B. 4 Damen Schlacht, Chaos Armee)..."
            className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-hidden focus:border-amber-400"
          />
          <button
            id="btn-save-custom-preset"
            onClick={handleSavePreset}
            disabled={!presetName.trim() || !validation.isValid}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              presetName.trim() && validation.isValid
                ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-stone-950 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Als Preset speichern</span>
          </button>
        </div>

        {/* Action Button: Apply to Current Game */}
        <div className="w-full md:w-auto flex items-center gap-2 justify-end">
          <button
            id="btn-apply-editor-setup"
            onClick={() => handleApplyCurrentBoard(presetName || 'Eigene Aufstellung')}
            disabled={!validation.isValid}
            className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              validation.isValid
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 shadow-amber-500/25 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Diese Aufstellung ins Spiel übernehmen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
