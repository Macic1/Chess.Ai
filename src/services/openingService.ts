import { Chess, Move } from 'chess.js';
import { ChessOpening, OpeningCategory } from '../types';
import { CHESS_OPENINGS } from '../data/openings';

export interface DetectedOpeningInfo {
  opening: ChessOpening;
  matchedMovesCount: number;
  totalOpeningMoves: number;
  isExact: boolean; // Exact line reached
  isInBook: boolean; // Position still follows opening book
}

/**
 * Normalizes a SAN move (strips checks '+' and checkmates '#') for lenient prefix comparison
 */
function normalizeSan(san: string): string {
  return san.replace(/[+#]/g, '').trim();
}

/**
 * Detects which chess opening best matches the current game moves played so far
 */
export function detectOpening(sanHistory: string[]): DetectedOpeningInfo | null {
  if (!sanHistory || sanHistory.length === 0) return null;

  const normHistory = sanHistory.map(normalizeSan);

  let bestMatch: ChessOpening | null = null;
  let maxMatched = 0;

  for (const opening of CHESS_OPENINGS) {
    const normOpeningMoves = opening.moves.map(normalizeSan);

    // Check how many moves from the start of opening match normHistory
    let matches = 0;
    const checkLength = Math.min(normHistory.length, normOpeningMoves.length);

    for (let i = 0; i < checkLength; i++) {
      if (normHistory[i] === normOpeningMoves[i]) {
        matches++;
      } else {
        break;
      }
    }

    if (matches > 0 && matches === Math.min(normHistory.length, normOpeningMoves.length)) {
      // If full prefix match or full opening match
      if (matches > maxMatched) {
        maxMatched = matches;
        bestMatch = opening;
      }
    }
  }

  if (!bestMatch) return null;

  const isExact = maxMatched >= bestMatch.moves.length;
  const isInBook = maxMatched === normHistory.length && normHistory.length <= bestMatch.moves.length;

  return {
    opening: bestMatch,
    matchedMovesCount: maxMatched,
    totalOpeningMoves: bestMatch.moves.length,
    isExact,
    isInBook,
  };
}

/**
 * Finds opening book continuation moves for the AI
 */
export function getOpeningBookMoveForAI(
  game: Chess,
  sanHistory: string[],
  enemyId?: string
): Move | null {
  if (sanHistory.length >= 16) return null; // Opening phase is typically within the first 8-10 moves (16 plies)

  const normHistory = sanHistory.map(normalizeSan);
  const nextMoveIndex = normHistory.length;

  // Find all openings that strictly match the prefix so far and have at least one move ahead
  const candidates: { opening: ChessOpening; nextSan: string }[] = [];

  for (const opening of CHESS_OPENINGS) {
    if (opening.moves.length <= nextMoveIndex) continue;

    const normOpeningMoves = opening.moves.map(normalizeSan);
    let isPrefix = true;
    for (let i = 0; i < nextMoveIndex; i++) {
      if (normHistory[i] !== normOpeningMoves[i]) {
        isPrefix = false;
        break;
      }
    }

    if (isPrefix) {
      candidates.push({
        opening,
        nextSan: opening.moves[nextMoveIndex],
      });
    }
  }

  if (candidates.length === 0) return null;

  // Filter or prioritize by enemy preferences if available
  let filtered = candidates;
  if (enemyId) {
    const enemyFavorites = candidates.filter((c) =>
      c.opening.preferredEnemies?.includes(enemyId)
    );
    if (enemyFavorites.length > 0) {
      filtered = enemyFavorites;
    }
  }

  // Pick one of the matching next SAN moves
  const chosen = filtered[Math.floor(Math.random() * filtered.length)];

  // Try to execute this SAN in a clone to verify it is legally playable
  try {
    const legalMoves = game.moves({ verbose: true });
    const targetMove = legalMoves.find(
      (m) => normalizeSan(m.san) === normalizeSan(chosen.nextSan)
    );

    return targetMove || null;
  } catch {
    return null;
  }
}

/**
 * Filter openings by category and/or search query
 */
export function filterOpenings(
  category: OpeningCategory = 'all',
  searchQuery = ''
): ChessOpening[] {
  const query = searchQuery.trim().toLowerCase();

  return CHESS_OPENINGS.filter((op) => {
    if (category !== 'all' && op.category !== category) {
      return false;
    }

    if (!query) return true;

    const matchName = op.name.toLowerCase().includes(query);
    const matchEco = op.eco.toLowerCase().includes(query);
    const matchDesc = op.description.toLowerCase().includes(query);
    const matchMoves = op.moves.join(' ').toLowerCase().includes(query);

    return matchName || matchEco || matchDesc || matchMoves;
  });
}
