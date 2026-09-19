import { Chess, Move, Square } from 'chess.js';
import { PlayerColor, PieceType } from '../types';
import { evaluateBoard } from './chessEngine';

export interface PlannedMoveStep {
  step: number; // 1, 2, 3, 4...
  san: string;
  from: Square;
  to: Square;
  color: PlayerColor;
  pieceType: PieceType;
  captured?: PieceType;
}

export interface CandidateMoveOption {
  rank: number; // 1, 2, or 3
  tacticType: 'aggressive' | 'solid' | 'positional';
  tacticLabel: string; // e.g. "Angriff & Druck", "Solide Verteidigung", "Zentrumskontrolle"
  move: Move;
  san: string;
  from: Square;
  to: Square;
  score: number; // centipawns
  winPercentage: number; // 0 to 100
  title: string;
  explanation: string;
  colorName: 'emerald' | 'sky' | 'purple';
  badgeColor: string; // hex
  arrowColor: string; // hex
  ringColor: string;
  plannedLine?: PlannedMoveStep[]; // Sequence of predicted best moves ahead
}

export interface AttackedPieceInfo {
  square: Square;
  pieceType: PieceType;
  color: PlayerColor;
  isPlayerPiece: boolean;
  attackers: Square[];
  attackersCount: number;
  isHanging: boolean; // attacked and not defended
  threatLevel: 'high' | 'medium' | 'low';
  attackerTypes?: PieceType[];
}

export interface EnemyLastMoveInfo {
  from: Square;
  to: Square;
  san: string;
  pieceType: PieceType;
  capturedPiece?: PieceType;
  threatenedSquares: Square[];
}

export interface TacticalDebugAnalysis {
  turnColor: PlayerColor;
  isPlayerTurn: boolean;
  evalScore: number;
  whiteWinPercentage: number;
  blackWinPercentage: number;
  playerWinPercentage: number;
  candidateMoves: CandidateMoveOption[];
  attackedPieces: AttackedPieceInfo[];
  enemyLastMove: EnemyLastMoveInfo | null;
}

/**
 * Calculates win percentage from centipawn evaluation using standard logistic model
 */
export function centipawnsToWinPercentage(score: number): number {
  if (score >= 90000) return 100;
  if (score <= -90000) return 0;
  // Standard Lichess / Stockfish conversion formula
  const winRate = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * score)) - 1);
  return Math.round(Math.max(1, Math.min(99, winRate)));
}

/**
 * Generates human-readable tactical explanation for a candidate move
 */
function getTacticalExplanation(move: Move, game: Chess, rank: number): { title: string; explanation: string } {
  const isCapture = Boolean(move.captured);
  const isCheck = move.san.includes('+') || move.san.includes('#');
  const isCastling = move.san === 'O-O' || move.san === 'O-O-O';
  const targetSquare = move.to;
  const isCenter = ['d4', 'd5', 'e4', 'e5'].includes(targetSquare);
  const isExtendedCenter = ['c4', 'c5', 'f4', 'f5', 'd3', 'e3', 'd6', 'e6'].includes(targetSquare);

  if (move.san.includes('#')) {
    return { title: 'Schachmatt!', explanation: 'Beendet die Partie sofort durch Matt.' };
  }

  if (isCastling) {
    return {
      title: 'Rochade & Königssicherheit',
      explanation: 'Bringt den König in Sicherheit und aktiviert den Turm für das Spiel.',
    };
  }

  if (isCapture) {
    const pieceNames: Record<string, string> = {
      p: 'Bauern',
      n: 'Springer',
      b: 'Läufer',
      r: 'Turm',
      q: 'die Dame',
      k: 'König',
    };
    const capturedName = pieceNames[move.captured || 'p'] || 'Figur';
    return {
      title: `Schlägt ${capturedName}`,
      explanation: `Gewinnt Material und eliminiert die gegnerische Figur auf ${move.to.toUpperCase()}.`,
    };
  }

  if (isCheck) {
    return {
      title: 'Schachgebot',
      explanation: 'Setzt den gegnerischen König unter direkten Druck und erzwingt Reaktionen.',
    };
  }

  if (move.piece === 'p' && isCenter) {
    return {
      title: 'Zentrumsvorstoß',
      explanation: 'Besetzt das Zentrum mit einem Bauern und öffnet Diagonalen für Läufer & Dame.',
    };
  }

  if (['n', 'b'].includes(move.piece) && (isCenter || isExtendedCenter)) {
    return {
      title: 'Aktive Figurenentwicklung',
      explanation: `Entwickelt den ${move.piece === 'n' ? 'Springer' : 'Läufer'} auf ein starkes Kontrollfeld.`,
    };
  }

  if (rank === 1) {
    return {
      title: 'Stärkster Zug (Hauptvariante)',
      explanation: 'Maximiert die Positionsevaluation, harmonisiert Figuren und hält Druck aufrecht.',
    };
  }

  if (rank === 2) {
    return {
      title: 'Starke Alternative',
      explanation: 'Solider Entwicklungs- oder Verteidigungszug mit geringem Risiko.',
    };
  }

  return {
    title: 'Taktische Option',
    explanation: 'Positioneller Ausgleich oder ruhiger Vorbereitungszug für zukünftige Angriffe.',
  };
}

/**
 * Generates a planned sequence of follow-up moves (up to 4-6 half-moves / 2-3 full turns)
 * by greedily choosing the best minimax reply for each side
 */
function calculatePlannedLine(
  game: Chess,
  initialMove: Move,
  depth: number = 4
): PlannedMoveStep[] {
  const line: PlannedMoveStep[] = [];
  const clone = new Chess(game.fen());

  try {
    const executedInitial = clone.move(initialMove);
    if (!executedInitial) return line;

    line.push({
      step: 1,
      san: executedInitial.san,
      from: executedInitial.from as Square,
      to: executedInitial.to as Square,
      color: executedInitial.color as PlayerColor,
      pieceType: executedInitial.piece as PieceType,
      captured: executedInitial.captured as PieceType | undefined,
    });

    for (let step = 2; step <= depth && !clone.isGameOver(); step++) {
      const legalMoves = clone.moves({ verbose: true });
      if (legalMoves.length === 0) break;

      const isTurnWhite = clone.turn() === 'w';
      let bestMove: Move = legalMoves[0];
      let bestScore = -Infinity;

      for (const m of legalMoves) {
        clone.move(m);
        let evalScore = evaluateBoard(clone);
        if (!isTurnWhite) evalScore = -evalScore;
        if (clone.isCheckmate()) evalScore += 50000;
        else if (clone.inCheck()) evalScore += 25;
        if (m.captured) evalScore += 15;
        clone.undo();

        if (evalScore > bestScore) {
          bestScore = evalScore;
          bestMove = m;
        }
      }

      const executed = clone.move(bestMove);
      if (!executed) break;

      line.push({
        step,
        san: executed.san,
        from: executed.from as Square,
        to: executed.to as Square,
        color: executed.color as PlayerColor,
        pieceType: executed.piece as PieceType,
        captured: executed.captured as PieceType | undefined,
      });
    }
  } catch {
    // fallback gracefully
  }

  return line;
}

/**
 * Calculates 3 tactical candidate moves for the active side,
 * representing 3 distinct tactical doctrines:
 * 1. 🟢 Grün (Emerald): Aggressiver Angriff & Schlagzug / Mattangriff
 * 2. 🔵 Blau (Sky): Solide Verteidigung & Königssicherheit / Festigung
 * 3. 🟣 Violett (Purple): Positioneller Raumgewinn & Zentrumskontrolle
 *
 * If a move is made, these three tactics are dynamically recalculated for the new position!
 */
export function getTopCandidateMoves(game: Chess, playerColor: PlayerColor): CandidateMoveOption[] {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return [];

  const turn = game.turn();
  const isTurnWhite = turn === 'w';

  interface MoveEvaluation {
    move: Move;
    baseScore: number;
    aggressiveScore: number;
    solidScore: number;
    positionalScore: number;
  }

  const evaluatedList: MoveEvaluation[] = [];

  for (const move of legalMoves) {
    try {
      game.move(move);
      let baseScore = evaluateBoard(game);
      if (!isTurnWhite) baseScore = -baseScore;

      const isMate = game.isCheckmate();
      const inChk = game.inCheck();
      const isCapt = Boolean(move.captured);
      const isCastle = move.san === 'O-O' || move.san === 'O-O-O';
      const target = move.to;
      const isCenter = ['d4', 'd5', 'e4', 'e5'].includes(target);
      const isExtendedCenter = ['c4', 'c5', 'f4', 'f5', 'd3', 'e3', 'd6', 'e6'].includes(target);

      if (isMate) baseScore += 50000;
      else if (inChk) baseScore += 35;

      // Aggressive doctrine: heavy rewards for checks, captures, attacking high-value targets
      let aggressiveScore = baseScore;
      if (isCapt) aggressiveScore += 60;
      if (inChk) aggressiveScore += 45;
      if (isMate) aggressiveScore += 100000;
      if (move.piece === 'q' || move.piece === 'r' || move.piece === 'n') aggressiveScore += 15;

      // Solid doctrine: heavy rewards for castling, king safety, protecting attacked pieces, quiet defensive steps
      let solidScore = baseScore;
      if (isCastle) solidScore += 90;
      if (!isCapt && !inChk) solidScore += 20; // calmness
      if (['f2', 'g2', 'h2', 'f7', 'g7', 'h7', 'c2', 'b2', 'c7', 'b7'].includes(target) && (move.piece === 'k' || move.piece === 'r')) {
        solidScore += 30; // king shield
      }

      // Positional doctrine: rewards for center occupation, piece harmonization, pawn structures
      let positionalScore = baseScore;
      if (isCenter) positionalScore += 50;
      else if (isExtendedCenter) positionalScore += 25;
      if (['n', 'b'].includes(move.piece) && (isCenter || isExtendedCenter)) positionalScore += 35;
      if (move.piece === 'p' && (isCenter || isExtendedCenter)) positionalScore += 30;

      evaluatedList.push({
        move,
        baseScore,
        aggressiveScore,
        solidScore,
        positionalScore,
      });

      game.undo();
    } catch {
      // ignore
    }
  }

  // Sort candidates by overall best score first
  evaluatedList.sort((a, b) => b.baseScore - a.baseScore);

  // Pick 3 moves prioritizing distinct tactical flavors:
  // 1. Emerald (Aggressive): top aggressive move
  // 2. Sky (Solid): top solid move (distinct)
  // 3. Purple (Positional): top positional/space move (distinct)
  const selectedMoves: {
    move: Move;
    score: number;
    tacticType: 'aggressive' | 'solid' | 'positional';
    tacticLabel: string;
    colorName: 'emerald' | 'sky' | 'purple';
    badgeColor: string;
    arrowColor: string;
    ringColor: string;
  }[] = [];

  const usedSans = new Set<string>();

  // Slot 1: Aggressive / Angriff (Emerald)
  const aggressiveSorted = [...evaluatedList].sort((a, b) => b.aggressiveScore - a.aggressiveScore);
  const bestAggressive = aggressiveSorted[0];
  if (bestAggressive) {
    selectedMoves.push({
      move: bestAggressive.move,
      score: bestAggressive.baseScore,
      tacticType: 'aggressive',
      tacticLabel: 'Offensiv & Angriff',
      colorName: 'emerald',
      badgeColor: '#10b981',
      arrowColor: '#10b981',
      ringColor: 'ring-emerald-500 bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    });
    usedSans.add(bestAggressive.move.san);
  }

  // Slot 2: Solid / Sicherheit & Verteidigung (Sky)
  const solidSorted = [...evaluatedList]
    .filter((m) => !usedSans.has(m.move.san))
    .sort((a, b) => b.solidScore - a.solidScore);
  const bestSolid = solidSorted[0] || evaluatedList.find((m) => !usedSans.has(m.move.san));
  if (bestSolid) {
    selectedMoves.push({
      move: bestSolid.move,
      score: bestSolid.baseScore,
      tacticType: 'solid',
      tacticLabel: 'Solide & Absicherung',
      colorName: 'sky',
      badgeColor: '#0ea5e9',
      arrowColor: '#0ea5e9',
      ringColor: 'ring-sky-500 bg-sky-500/20 text-sky-300 border-sky-500/50',
    });
    usedSans.add(bestSolid.move.san);
  }

  // Slot 3: Positional / Zentrum & Struktur (Purple)
  const positionalSorted = [...evaluatedList]
    .filter((m) => !usedSans.has(m.move.san))
    .sort((a, b) => b.positionalScore - a.positionalScore);
  const bestPositional = positionalSorted[0] || evaluatedList.find((m) => !usedSans.has(m.move.san));
  if (bestPositional) {
    selectedMoves.push({
      move: bestPositional.move,
      score: bestPositional.baseScore,
      tacticType: 'positional',
      tacticLabel: 'Strategie & Zentrum',
      colorName: 'purple',
      badgeColor: '#a855f7',
      arrowColor: '#a855f7',
      ringColor: 'ring-purple-500 bg-purple-500/20 text-purple-300 border-purple-500/50',
    });
    usedSans.add(bestPositional.move.san);
  }

  return selectedMoves.map((sm, index) => {
    const rank = index + 1;
    const { title, explanation } = getTacticalExplanation(sm.move, game, rank);
    const winPct = centipawnsToWinPercentage(sm.score);
    const plannedLine = calculatePlannedLine(game, sm.move, 4);

    return {
      rank,
      tacticType: sm.tacticType,
      tacticLabel: sm.tacticLabel,
      move: sm.move,
      san: sm.move.san,
      from: sm.move.from as Square,
      to: sm.move.to as Square,
      score: sm.score,
      winPercentage: winPct,
      title,
      explanation,
      colorName: sm.colorName,
      badgeColor: sm.badgeColor,
      arrowColor: sm.arrowColor,
      ringColor: sm.ringColor,
      plannedLine,
    };
  });
}

/**
 * Finds all attacked pieces on the board (both player and enemy)
 */
export function getAttackedPieces(game: Chess, playerColor: PlayerColor): AttackedPieceInfo[] {
  const attackedPieces: AttackedPieceInfo[] = [];
  const board = game.board();
  const currentTurn = game.turn();

  // Test attacks using chess attack checks
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c];
      const rank = ['8', '7', '6', '5', '4', '3', '2', '1'][r];
      const square = `${file}${rank}` as Square;

      const opponentColor: PlayerColor = piece.color === 'w' ? 'b' : 'w';

      // Check if this square is attacked by opponent
      const isAttacked = game.isAttacked(square, opponentColor);

      if (isAttacked) {
        // Collect attacker squares by inspecting moves of opponent
        const attackers: Square[] = [];
        try {
          // Clone with opponent to move
          const fenParts = game.fen().split(' ');
          fenParts[1] = opponentColor;
          fenParts[3] = '-';
          const clone = new Chess(fenParts.join(' '));
          const oppMoves = clone.moves({ verbose: true });
          oppMoves.forEach((m) => {
            if (m.to === square && !attackers.includes(m.from as Square)) {
              attackers.push(m.from as Square);
            }
          });
        } catch {
          // fallback
        }

        // Check if defended by friendly piece
        let isDefended = false;
        try {
          const fenParts = game.fen().split(' ');
          fenParts[1] = piece.color;
          fenParts[3] = '-';
          const cloneDef = new Chess(fenParts.join(' '));
          isDefended = cloneDef.isAttacked(square, piece.color);
        } catch {
          // fallback
        }

        const isPlayerPiece = piece.color === playerColor;
        const isHanging = !isDefended;

        let threatLevel: 'high' | 'medium' | 'low' = 'low';
        if (['q', 'r', 'k'].includes(piece.type) || isHanging) {
          threatLevel = 'high';
        } else if (['b', 'n'].includes(piece.type)) {
          threatLevel = 'medium';
        }

        const attackerTypes: PieceType[] = attackers
          .map((atkSq) => game.get(atkSq)?.type as PieceType)
          .filter(Boolean);

        attackedPieces.push({
          square,
          pieceType: piece.type as PieceType,
          color: piece.color as PlayerColor,
          isPlayerPiece,
          attackers,
          attackersCount: Math.max(1, attackers.length),
          isHanging,
          threatLevel,
          attackerTypes,
        });
      }
    }
  }

  // Sort so highest threats and player pieces under attack come first
  attackedPieces.sort((a, b) => {
    if (a.isPlayerPiece !== b.isPlayerPiece) return a.isPlayerPiece ? -1 : 1;
    if (a.isHanging !== b.isHanging) return a.isHanging ? -1 : 1;
    const valueOrder: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 10 };
    return (valueOrder[b.pieceType] || 0) - (valueOrder[a.pieceType] || 0);
  });

  return attackedPieces;
}

/**
 * Parses information about where the enemy moved on their last turn
 */
export function getEnemyLastMoveInfo(
  lastMove: { from: Square; to: Square } | null,
  game: Chess,
  playerColor: PlayerColor
): EnemyLastMoveInfo | null {
  if (!lastMove) return null;

  const targetPiece = game.get(lastMove.to);
  if (!targetPiece) return null;

  // We only consider it an enemy move if target piece belongs to the opponent
  const isEnemyMove = targetPiece.color !== playerColor;
  if (!isEnemyMove) return null;

  // Get squares threatened by this arrived piece
  const threatenedSquares: Square[] = [];
  try {
    const moves = game.moves({ square: lastMove.to, verbose: true });
    moves.forEach((m) => {
      const target = game.get(m.to as Square);
      if (target && target.color === playerColor) {
        threatenedSquares.push(m.to as Square);
      }
    });
  } catch {
    // ignore
  }

  return {
    from: lastMove.from,
    to: lastMove.to,
    san: `${lastMove.from}➔${lastMove.to}`,
    pieceType: targetPiece.type as PieceType,
    threatenedSquares,
  };
}

/**
 * Performs full debug and tactical analysis of the current board
 */
export function performTacticalDebugAnalysis(
  game: Chess,
  playerColor: PlayerColor,
  lastMove: { from: Square; to: Square } | null
): TacticalDebugAnalysis {
  const turnColor = game.turn() as PlayerColor;
  const isPlayerTurn = turnColor === playerColor;
  const evalScore = evaluateBoard(game);

  const whiteWinPercentage = centipawnsToWinPercentage(evalScore);
  const blackWinPercentage = 100 - whiteWinPercentage;
  const playerWinPercentage = playerColor === 'w' ? whiteWinPercentage : blackWinPercentage;

  const candidateMoves = getTopCandidateMoves(game, playerColor);
  const attackedPieces = getAttackedPieces(game, playerColor);
  const enemyLastMove = getEnemyLastMoveInfo(lastMove, game, playerColor);

  return {
    turnColor,
    isPlayerTurn,
    evalScore,
    whiteWinPercentage,
    blackWinPercentage,
    playerWinPercentage,
    candidateMoves,
    attackedPieces,
    enemyLastMove,
  };
}
