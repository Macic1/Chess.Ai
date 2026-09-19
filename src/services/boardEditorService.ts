import { Chess } from 'chess.js';
import { PieceType, PlayerColor, CustomArmyPreset } from '../types';

export type BoardSquare = { type: PieceType; color: PlayerColor } | null;

export const DEFAULT_STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

const LOCAL_STORAGE_CUSTOM_PRESETS_KEY = 'chess_custom_army_presets_v1';

export const STARTER_CUSTOM_PRESETS: CustomArmyPreset[] = [
  {
    id: 'preset_triple_queens',
    name: 'Damen-Duell (3 vs 3)',
    fen: 'q1q1kq1q/pppppppp/8/8/8/8/PPPPPPPP/Q1Q1KQ1Q w - - 0 1',
    description: 'Beide Seiten starten mit je 3 Damen für maximale Angriffskraft und dynamische Taktiken.',
    createdAt: Date.now() - 100000,
    whitePiecesCount: 18,
    blackPiecesCount: 18,
    turn: 'w',
  },
  {
    id: 'preset_knight_cavalry',
    name: 'Kavallerie-Offensive',
    fen: 'nnnnknnn/pppppppp/8/8/8/8/PPPPPPPP/NNNNKNNN w - - 0 1',
    description: 'Eine Armee aus Springern: 6 Springer auf beiden Seiten führen zu wilden Springergabeln.',
    createdAt: Date.now() - 80000,
    whitePiecesCount: 15,
    blackPiecesCount: 15,
    turn: 'w',
  },
  {
    id: 'preset_heavy_artillery',
    name: 'Schwere Artillerie (4 Türme)',
    fen: 'rrrqkrrr/pppppppp/8/8/8/8/PPPPPPPP/RRRQKRRR w - - 0 1',
    description: 'Offene Linien und enorme Durchschlagskraft mit 6 Türmen auf dem Brett.',
    createdAt: Date.now() - 60000,
    whitePiecesCount: 16,
    blackPiecesCount: 16,
    turn: 'w',
  },
];

/**
 * Converts a FEN string to an 8x8 matrix (r=0 is rank 8, r=7 is rank 1).
 */
export function fenToBoard(fen: string): BoardSquare[][] {
  const board: BoardSquare[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const cleanFen = fen.trim() || DEFAULT_STARTING_FEN;
  const [placement] = cleanFen.split(' ');
  if (!placement) return board;

  const ranks = placement.split('/');
  for (let r = 0; r < Math.min(8, ranks.length); r++) {
    const rankStr = ranks[r];
    let c = 0;
    for (let i = 0; i < rankStr.length && c < 8; i++) {
      const char = rankStr[i];
      if (char >= '1' && char <= '8') {
        c += parseInt(char, 10);
      } else {
        const isWhite = char === char.toUpperCase();
        const type = char.toLowerCase() as PieceType;
        board[r][c] = { type, color: isWhite ? 'w' : 'b' };
        c++;
      }
    }
  }
  return board;
}

/**
 * Automatically computes standard castling flags if rooks and kings are on starting squares.
 */
export function autoDetectCastling(board: BoardSquare[][]): string {
  let castling = '';

  // White king at e1 (r=7, c=4)
  const whiteKing = board[7][4];
  if (whiteKing?.type === 'k' && whiteKing.color === 'w') {
    // Kingside rook at h1 (r=7, c=7)
    const h1 = board[7][7];
    if (h1?.type === 'r' && h1.color === 'w') castling += 'K';
    // Queenside rook at a1 (r=7, c=0)
    const a1 = board[7][0];
    if (a1?.type === 'r' && a1.color === 'w') castling += 'Q';
  }

  // Black king at e8 (r=0, c=4)
  const blackKing = board[0][4];
  if (blackKing?.type === 'k' && blackKing.color === 'b') {
    // Kingside rook at h8 (r=0, c=7)
    const h8 = board[0][7];
    if (h8?.type === 'r' && h8.color === 'b') castling += 'k';
    // Queenside rook at a8 (r=0, c=0)
    const a8 = board[0][0];
    if (a8?.type === 'r' && a8.color === 'b') castling += 'q';
  }

  return castling.length > 0 ? castling : '-';
}

/**
 * Converts an 8x8 matrix back to a valid FEN string.
 */
export function boardToFen(
  board: BoardSquare[][],
  turn: PlayerColor = 'w',
  castling?: string
): string {
  const ranks: string[] = [];
  for (let r = 0; r < 8; r++) {
    let rankStr = '';
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        const char = piece.type;
        rankStr += piece.color === 'w' ? char.toUpperCase() : char.toLowerCase();
      }
    }
    if (emptyCount > 0) {
      rankStr += emptyCount.toString();
    }
    ranks.push(rankStr.length > 0 ? rankStr : '8');
  }

  const placement = ranks.join('/');
  const finalCastling = castling !== undefined ? castling : autoDetectCastling(board);
  return `${placement} ${turn} ${finalCastling} - 0 1`;
}

export interface BoardValidationResult {
  isValid: boolean;
  whiteKings: number;
  blackKings: number;
  whitePiecesCount: number;
  blackPiecesCount: number;
  whitePoints: number;
  blackPoints: number;
  hasPawnsOnInvalidRanks: boolean;
  errors: string[];
  warnings: string[];
}

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Validates whether the board layout complies with chess rules and can be played by chess.js engine.
 */
export function validateBoard(board: BoardSquare[][], turn: PlayerColor = 'w'): BoardValidationResult {
  let whiteKings = 0;
  let blackKings = 0;
  let whitePiecesCount = 0;
  let blackPiecesCount = 0;
  let whitePoints = 0;
  let blackPoints = 0;
  let hasPawnsOnInvalidRanks = false;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      if (piece.color === 'w') {
        whitePiecesCount++;
        whitePoints += PIECE_VALUES[piece.type] || 0;
        if (piece.type === 'k') whiteKings++;
      } else {
        blackPiecesCount++;
        blackPoints += PIECE_VALUES[piece.type] || 0;
        if (piece.type === 'k') blackKings++;
      }

      // Check pawns on first (r=7) or eighth (r=0) rank
      if (piece.type === 'p' && (r === 0 || r === 7)) {
        hasPawnsOnInvalidRanks = true;
      }
    }
  }

  if (whiteKings === 0) {
    errors.push('Weiß benötigt genau 1 König auf dem Brett.');
  } else if (whiteKings > 1) {
    errors.push(`Weiß hat ${whiteKings} Könige (maximal 1 erlaubt).`);
  }

  if (blackKings === 0) {
    errors.push('Schwarz benötigt genau 1 König auf dem Brett.');
  } else if (blackKings > 1) {
    errors.push(`Schwarz hat ${blackKings} Könige (maximal 1 erlaubt).`);
  }

  if (hasPawnsOnInvalidRanks) {
    errors.push('Bauern dürfen nicht auf der 1. oder 8. Reihe platziert werden (Umwandlungs-Regel).');
  }

  // If kings are correct and no invalid pawns, test full FEN with chess.js engine
  if (whiteKings === 1 && blackKings === 1 && !hasPawnsOnInvalidRanks) {
    const testFen = boardToFen(board, turn);
    try {
      const testGame = new Chess();
      testGame.load(testFen);

      // Check if the side NOT to move is in check (illegal in chess)
      const inactiveColor = turn === 'w' ? 'b' : 'w';
      // In chess.js, if the inactive king is under attack, it throws or is invalid
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('in check') || msg.toLowerCase().includes('king')) {
        errors.push('Der gegnerische König darf nicht im Schach stehen, während die andere Seite am Zug ist.');
      } else {
        warnings.push(`Hinweis zur Stellung: ${msg}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    whiteKings,
    blackKings,
    whitePiecesCount,
    blackPiecesCount,
    whitePoints,
    blackPoints,
    hasPawnsOnInvalidRanks,
    errors,
    warnings,
  };
}

/**
 * Loads custom presets from localStorage or returns default starter set.
 */
export function getSavedCustomPresets(): CustomArmyPreset[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading saved custom presets', e);
  }
  return STARTER_CUSTOM_PRESETS;
}

/**
 * Persists a new custom preset into localStorage.
 */
export function saveCustomPreset(presetData: {
  name: string;
  fen: string;
  description?: string;
  whitePiecesCount: number;
  blackPiecesCount: number;
  turn: PlayerColor;
}): CustomArmyPreset {
  const current = getSavedCustomPresets();
  const newPreset: CustomArmyPreset = {
    id: `custom_preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: presetData.name.trim() || 'Mein Figuren-Preset',
    fen: presetData.fen,
    description: presetData.description || 'Eigenes Aufstellungs-Preset',
    createdAt: Date.now(),
    whitePiecesCount: presetData.whitePiecesCount,
    blackPiecesCount: presetData.blackPiecesCount,
    turn: presetData.turn,
  };

  const updated = [newPreset, ...current];
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed saving custom preset to localStorage', e);
  }

  return newPreset;
}

/**
 * Deletes a custom preset by ID.
 */
export function deleteCustomPreset(presetId: string): CustomArmyPreset[] {
  const current = getSavedCustomPresets();
  const updated = current.filter((p) => p.id !== presetId);
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed deleting custom preset', e);
  }
  return updated;
}
