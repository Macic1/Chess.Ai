import { Chess, Move } from 'chess.js';
import { AIEnemy, EvaluationResult, PlayerColor } from '../types';
import { getOpeningBookMoveForAI } from './openingService';

// Standard chess piece values (in centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (from White's perspective, index [row][col] where row 0 is rank 8, row 7 is rank 1)
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE_MID = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getPieceSquareValue(piece: string, color: 'w' | 'b', row: number, col: number): number {
  const r = color === 'w' ? row : 7 - row;
  const c = col;

  switch (piece) {
    case 'p':
      return PAWN_TABLE[r][c];
    case 'n':
      return KNIGHT_TABLE[r][c];
    case 'b':
      return BISHOP_TABLE[r][c];
    case 'r':
      return ROOK_TABLE[r][c];
    case 'q':
      return QUEEN_TABLE[r][c];
    case 'k':
      return KING_TABLE_MID[r][c];
    default:
      return 0;
  }
}

/**
 * Static evaluation function of the board
 * Returns centipawn score from White's perspective (+ means White is winning, - means Black is winning)
 */
export function evaluateBoard(game: Chess, enemy?: AIEnemy): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  let totalScore = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = board[r][c];
      if (!square) continue;

      const val = PIECE_VALUES[square.type] || 0;
      const positional = getPieceSquareValue(square.type, square.color, r, c);
      const pieceVal = val + positional;

      if (square.color === 'w') {
        totalScore += pieceVal;
      } else {
        totalScore -= pieceVal;
      }
    }
  }

  // Positional bonuses based on enemy persona
  if (enemy) {
    // Center control bias (d4, e4, d5, e5)
    const centerSquares = ['d4', 'e4', 'd5', 'e5'];
    let centerBalance = 0;
    centerSquares.forEach((sq) => {
      const piece = game.get(sq as any);
      if (piece) {
        centerBalance += piece.color === 'w' ? 25 : -25;
      }
    });
    totalScore += centerBalance * (enemy.centerControlWeight - 1);
  }

  return totalScore;
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  enemy: AIEnemy
): { score: number; bestMove?: Move } {
  if (depth === 0 || game.isGameOver()) {
    return { score: evaluateBoard(game, enemy) };
  }

  const moves = game.moves({ verbose: true });

  // Order moves to improve alpha-beta pruning (captures and checks first)
  moves.sort((a, b) => {
    const aScore = (a.captured ? PIECE_VALUES[a.captured] * 10 : 0) + (a.san.includes('+') ? 50 : 0);
    const bScore = (b.captured ? PIECE_VALUES[b.captured] * 10 : 0) + (b.san.includes('+') ? 50 : 0);
    return bScore - aScore;
  });

  let bestMove: Move | undefined = moves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false, enemy).score;
      game.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cutoff
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true, enemy).score;
      game.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return { score: minEval, bestMove };
  }
}

/**
 * Choose the AI enemy's next move based on personality & difficulty
 */
export async function getAIMove(
  game: Chess,
  enemy: AIEnemy,
  playerColor: PlayerColor
): Promise<{ move: Move | null; score: number }> {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return { move: null, score: 0 };
  }

  // Artificial thinking pause for human feel
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 250));

  // 0. Opening Book Lookup (Variety of authentic openings according to enemy style)
  const history = game.history();
  if (history.length < 16) {
    const bookMove = getOpeningBookMoveForAI(game, history, enemy.id);
    if (bookMove) {
      // Novice enemies might deviate slightly, others play book moves reliably
      const playsBook = enemy.blunderRate > 0.2 ? Math.random() > enemy.blunderRate : true;
      if (playsBook) {
        return { move: bookMove, score: 15 };
      }
    }
  }

  const isAIMaximizing = game.turn() === 'w';

  // 1. Blunder check for novice / casual enemies
  if (Math.random() < enemy.blunderRate) {
    // Pick random or sub-optimal move
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return { move: randomMove, score: 0 };
  }

  // 2. Greed logic (for Sir Ronald)
  if (enemy.greedMultiplier > 1.8) {
    const captures = legalMoves.filter((m) => m.captured);
    if (captures.length > 0) {
      // Sort captures by piece value captured
      captures.sort((a, b) => (PIECE_VALUES[b.captured || 'p'] || 0) - (PIECE_VALUES[a.captured || 'p'] || 0));
      // 80% chance Sir Ronald snatches the most valuable piece on offer
      if (Math.random() < 0.8) {
        return { move: captures[0], score: 50 };
      }
    }
  }

  // 3. Minimax Alpha-Beta search with configured depth
  const searchDepth = Math.max(1, Math.min(enemy.engineDepth, 4));
  const result = minimax(game, searchDepth, -Infinity, Infinity, isAIMaximizing, enemy);

  return {
    move: result.bestMove || legalMoves[0],
    score: result.score,
  };
}

/**
 * Get quick tactical hint for player
 */
export function getTacticalHint(game: Chess, playerColor: PlayerColor): { move: Move | null; san: string } {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return { move: null, san: '' };

  const isMaximizing = playerColor === 'w';
  // Use a balanced depth 2 search for player hint
  const dummyEnemy: AIEnemy = {
    id: 'hint-coach',
    name: 'Coach',
    title: 'Coach',
    rating: 2000,
    difficulty: 'Master',
    avatar: 'coach',
    avatarBg: '',
    themeColor: 'blue',
    borderColor: '',
    bio: '',
    persona: '',
    playStyle: '',
    engineDepth: 2,
    blunderRate: 0,
    greedMultiplier: 1.0,
    centerControlWeight: 1.5,
    kingSafetyWeight: 2.0,
    taunts: {} as any,
  };

  const result = minimax(game, 2, -Infinity, Infinity, isMaximizing, dummyEnemy);
  const best = result.bestMove || legalMoves[0];

  return {
    move: best,
    san: best.san,
  };
}
