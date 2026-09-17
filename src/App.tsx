import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { AIEnemy, MoveRecord, PieceType, PlayerColor, BoardTheme, GameMode } from './types';
import { AI_ENEMIES } from './data/enemies';
import { evaluateBoard, getAIMove, getTacticalHint } from './services/chessEngine';
import { soundFx } from './services/audio';
import { performTacticalDebugAnalysis, CandidateMoveOption } from './services/tacticalAnalysis';
import { ChessBoard } from './components/ChessBoard';
import { EnemyProfile } from './components/EnemyProfile';
import { EnemySelector } from './components/EnemySelector';
import { MoveHistory } from './components/MoveHistory';
import { CapturedPieces } from './components/CapturedPieces';
import { EvaluationBar } from './components/EvaluationBar';
import { GameControls } from './components/GameControls';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { TitleScreen } from './components/TitleScreen';
import { AiVsAiDualProfile } from './components/AiVsAiDualProfile';
import { AiVsAiControls } from './components/AiVsAiControls';
import { DebugTacticalOverlay } from './components/DebugTacticalOverlay';
import { OpeningBanner } from './components/OpeningBanner';
import { OpeningSelectorModal } from './components/OpeningSelectorModal';
import { detectOpening } from './services/openingService';
import { ChessOpening } from './types';
import { Crown, Sparkles, X, ShieldAlert, Home, Swords, User, Bug, BookOpen } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'title' | 'game'>('title');
  const [gameMode, setGameMode] = useState<GameMode>('pvai');
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [enemy, setEnemy] = useState<AIEnemy>(AI_ENEMIES[1]); // Default to Felix Schneider
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('green');
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ w: PieceType[]; b: PieceType[] }>({ w: [], b: [] });
  const [evalScore, setEvalScore] = useState<number>(0);
  const [isOpeningSelectorOpen, setIsOpeningSelectorOpen] = useState<boolean>(false);

  // AI vs AI Mode state
  const [whiteEnemy, setWhiteEnemy] = useState<AIEnemy>(AI_ENEMIES[1]); // Felix Schneider
  const [blackEnemy, setBlackEnemy] = useState<AIEnemy>(AI_ENEMIES[4]); // Dr. Alexander Richter
  const [isAiVsAiRunning, setIsAiVsAiRunning] = useState<boolean>(true);
  const [aiVsAiSpeedMs, setAiVsAiSpeedMs] = useState<number>(800);
  const [whiteSpeech, setWhiteSpeech] = useState<string>(AI_ENEMIES[1].taunts.start[0]);
  const [blackSpeech, setBlackSpeech] = useState<string>(AI_ENEMIES[4].taunts.start[0]);
  const [enemySelectorTarget, setEnemySelectorTarget] = useState<'single' | 'white' | 'black'>('single');

  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [hintMove, setHintMove] = useState<{ from: Square; to: Square } | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState<boolean>(false);

  const [currentSpeech, setCurrentSpeech] = useState<string>(AI_ENEMIES[1].taunts.start[0]);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Tactical Debug Overlay State
  const [isDebugMode, setIsDebugMode] = useState<boolean>(true);
  const [hoveredCandidateRank, setHoveredCandidateRank] = useState<number | null>(null);
  const [activePlanRank, setActivePlanRank] = useState<number | null>(null);
  const [debugShowArrows, setDebugShowArrows] = useState<boolean>(true);
  const [debugShowThreats, setDebugShowThreats] = useState<boolean>(true);
  const [debugShowEnemyMove, setDebugShowEnemyMove] = useState<boolean>(true);

  // Game over state
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string>('');

  // AI thinking ref to avoid duplicate invocations
  const aiTurnProcessing = useRef<boolean>(false);
  const lastGeminiCommentaryTime = useRef<number>(0);

  // Recalculate tactical analysis on every move when in debug mode
  const debugAnalysis = useMemo(() => {
    if (!isDebugMode) return null;
    const activeColor = gameMode === 'aivsai' ? (game.turn() as PlayerColor) : playerColor;
    return performTacticalDebugAnalysis(game, activeColor, lastMove);
  }, [game, lastMove, isDebugMode, gameMode, playerColor, history.length]);

  // Opening book detection from move history
  const sanHistory = useMemo(() => history.map((h) => h.san), [history]);
  const detectedOpening = useMemo(() => detectOpening(sanHistory), [sanHistory]);

  // Dynamic persona fallback dialogue generator
  const triggerLocalDialogue = useCallback(
    (ctx: {
      isCheck?: boolean;
      isCheckmate?: boolean;
      isDraw?: boolean;
      captured?: PieceType;
      turnColor?: PlayerColor;
    }) => {
      if (ctx.isCheckmate) {
        const lines = ctx.turnColor === playerColor ? enemy.taunts.victory : enemy.taunts.defeat;
        if (lines?.length) setCurrentSpeech(lines[Math.floor(Math.random() * lines.length)]);
      } else if (ctx.isCheck) {
        const lines = ctx.turnColor === playerColor ? enemy.taunts.enemyCheck : enemy.taunts.playerCheck;
        if (lines?.length) setCurrentSpeech(lines[Math.floor(Math.random() * lines.length)]);
      } else if (ctx.captured) {
        const lines = ctx.turnColor === playerColor ? enemy.taunts.lostPiece : enemy.taunts.capturedGoodPiece;
        if (lines?.length) setCurrentSpeech(lines[Math.floor(Math.random() * lines.length)]);
      } else {
        const score = evaluateBoard(game, enemy);
        const playerIsAdvantaged = playerColor === 'w' ? score > 200 : score < -200;
        const enemyIsAdvantaged = playerColor === 'w' ? score < -200 : score > 200;

        if (playerIsAdvantaged && enemy.taunts.playerAdvantage.length > 0) {
          setCurrentSpeech(enemy.taunts.playerAdvantage[Math.floor(Math.random() * enemy.taunts.playerAdvantage.length)]);
        } else if (enemyIsAdvantaged && enemy.taunts.enemyAdvantage.length > 0) {
          setCurrentSpeech(enemy.taunts.enemyAdvantage[Math.floor(Math.random() * enemy.taunts.enemyAdvantage.length)]);
        } else {
          const pool = [...enemy.taunts.start, ...enemy.taunts.enemyAdvantage, ...enemy.taunts.playerAdvantage];
          if (pool.length > 0) {
            setCurrentSpeech(pool[Math.floor(Math.random() * pool.length)]);
          }
        }
      }
    },
    [enemy, game, playerColor]
  );

  // Fetch dynamic AI commentary with quota-conscious rate limiting
  const fetchCommentary = useCallback(
    async (context: {
      isCheck?: boolean;
      isCheckmate?: boolean;
      isDraw?: boolean;
      lastMoveSan?: string;
      captured?: PieceType;
      turnColor?: PlayerColor;
    }) => {
      const now = Date.now();
      const isHighPriorityEvent =
        context.isCheckmate ||
        context.isCheck ||
        context.isDraw ||
        context.captured === 'q' ||
        context.captured === 'r' ||
        (history.length > 0 && history.length % 6 === 0);

      // Conserve free tier quota: Only query Gemini on notable moments with a 12s cooldown
      const canCallRemote = isHighPriorityEvent && now - lastGeminiCommentaryTime.current > 12000;

      if (canCallRemote) {
        try {
          lastGeminiCommentaryTime.current = now;
          const res = await fetch('/api/gemini/commentary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enemyName: enemy.name,
              enemyPersona: enemy.persona,
              enemyDifficulty: enemy.difficulty,
              fen: game.fen(),
              lastMove: context.lastMoveSan,
              playerColor: playerColor === 'w' ? 'White' : 'Black',
              isCheck: context.isCheck,
              isCheckmate: context.isCheckmate,
              isDraw: context.isDraw,
              moveCount: history.length,
              capturedPiece: context.captured,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.commentary) {
              setCurrentSpeech(data.commentary);
              return;
            }
          }
        } catch (e) {
          // Gracefully fallback to local dialogue engine
        }
      }

      // Built-in character dialog line
      triggerLocalDialogue(context);
    },
    [enemy, game, history.length, playerColor, triggerLocalDialogue]
  );

  // Check game over condition
  const checkGameOverState = useCallback(
    (chessInstance: Chess) => {
      if (chessInstance.isCheckmate()) {
        const currentTurn = chessInstance.turn();
        const winningColor: PlayerColor = currentTurn === 'w' ? 'b' : 'w';
        setWinner(winningColor);
        setIsGameOver(true);
        setGameOverReason(`Checkmate! ${winningColor === playerColor ? 'You defeated the enemy!' : `${enemy.name} won!`}`);
        if (winningColor === playerColor) {
          soundFx.playVictory();
        } else {
          soundFx.playDefeat();
        }
        fetchCommentary({ isCheckmate: true, turnColor: currentTurn as PlayerColor });
        return true;
      }

      if (chessInstance.isDraw()) {
        setWinner('draw');
        setIsGameOver(true);
        const reason = chessInstance.isStalemate()
          ? 'Stalemate! No legal moves.'
          : chessInstance.isThreefoldRepetition()
          ? 'Draw by Threefold Repetition'
          : chessInstance.isInsufficientMaterial()
          ? 'Draw by Insufficient Material'
          : 'Draw by 50-move rule';
        setGameOverReason(reason);
        fetchCommentary({ isDraw: true });
        return true;
      }

      return false;
    },
    [enemy.name, fetchCommentary, playerColor]
  );

  // Execute AI Enemy turn
  const handleAiTurn = useCallback(async () => {
    if (aiTurnProcessing.current || isGameOver) return;
    aiTurnProcessing.current = true;
    setIsAiThinking(true);

    try {
      const { move } = await getAIMove(game, enemy, playerColor);
      if (move) {
        const targetPiece = game.get(move.to as Square);
        const executed = game.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || 'q',
        });

        if (executed) {
          // Play audio
          if (game.inCheck()) {
            soundFx.playCheck();
          } else if (executed.captured) {
            soundFx.playCapture();
          } else {
            soundFx.playMove();
          }

          // Update captured pieces
          if (executed.captured) {
            setCapturedPieces((prev) => ({
              ...prev,
              [executed.color]: [...prev[executed.color], executed.captured as PieceType],
            }));
          }

          setLastMove({ from: move.from as Square, to: move.to as Square });
          setHintMove(null);

          const moveRecord: MoveRecord = {
            san: executed.san,
            from: move.from,
            to: move.to,
            piece: executed.piece as PieceType,
            color: executed.color as PlayerColor,
            captured: executed.captured as PieceType | undefined,
            promotion: executed.promotion as PieceType | undefined,
            fenAfter: game.fen(),
          };

          setHistory((prev) => [...prev, moveRecord]);
          const currentScore = evaluateBoard(game, enemy);
          setEvalScore(currentScore);

          const isOver = checkGameOverState(game);
          if (!isOver) {
            fetchCommentary({
              isCheck: game.inCheck(),
              lastMoveSan: executed.san,
              captured: executed.captured as PieceType,
              turnColor: game.turn() as PlayerColor,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error during AI move:', err);
    } finally {
      setIsAiThinking(false);
      aiTurnProcessing.current = false;
    }
  }, [checkGameOverState, enemy, fetchCommentary, game, isGameOver, playerColor]);

  // Single step for AI vs AI simulation
  const handleAiVsAiStep = useCallback(async () => {
    if (aiTurnProcessing.current || isGameOver) return;
    aiTurnProcessing.current = true;
    setIsAiThinking(true);

    try {
      const currentTurn = game.turn() as PlayerColor;
      const currentBot = currentTurn === 'w' ? whiteEnemy : blackEnemy;
      const opponentBot = currentTurn === 'w' ? blackEnemy : whiteEnemy;

      const { move } = await getAIMove(game, currentBot, currentTurn === 'w' ? 'b' : 'w');

      if (move) {
        const executed = game.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || 'q',
        });

        if (executed) {
          if (game.inCheck()) {
            soundFx.playCheck();
          } else if (executed.captured) {
            soundFx.playCapture();
          } else {
            soundFx.playMove();
          }

          if (executed.captured) {
            setCapturedPieces((prev) => ({
              ...prev,
              [executed.color]: [...prev[executed.color], executed.captured as PieceType],
            }));
          }

          setLastMove({ from: move.from as Square, to: move.to as Square });
          setHintMove(null);

          const moveRecord: MoveRecord = {
            san: executed.san,
            from: move.from as Square,
            to: move.to as Square,
            piece: executed.piece as PieceType,
            color: executed.color as PlayerColor,
            captured: executed.captured as PieceType | undefined,
            promotion: executed.promotion as PieceType | undefined,
            fenAfter: game.fen(),
          };

          setHistory((prev) => [...prev, moveRecord]);
          setEvalScore(evaluateBoard(game, whiteEnemy));

          // Bot dynamic banter
          if (executed.captured) {
            const pool = currentBot.taunts.capturedGoodPiece;
            if (pool.length > 0) {
              const quote = pool[Math.floor(Math.random() * pool.length)];
              if (currentTurn === 'w') setWhiteSpeech(quote); else setBlackSpeech(quote);
            }
            const oppPool = opponentBot.taunts.lostPiece;
            if (oppPool.length > 0) {
              const oppQuote = oppPool[Math.floor(Math.random() * oppPool.length)];
              if (currentTurn === 'w') setBlackSpeech(oppQuote); else setWhiteSpeech(oppQuote);
            }
          } else if (game.inCheck()) {
            const pool = currentBot.taunts.playerCheck;
            if (pool.length > 0) {
              const quote = pool[Math.floor(Math.random() * pool.length)];
              if (currentTurn === 'w') setWhiteSpeech(quote); else setBlackSpeech(quote);
            }
            const oppPool = opponentBot.taunts.enemyCheck;
            if (oppPool.length > 0) {
              const oppQuote = oppPool[Math.floor(Math.random() * oppPool.length)];
              if (currentTurn === 'w') setBlackSpeech(oppQuote); else setWhiteSpeech(oppQuote);
            }
          }

          const isOver = checkGameOverState(game);
          if (isOver) {
            setIsAiVsAiRunning(false);
          }
        }
      }
    } catch (err) {
      console.error('Error in AI vs AI move:', err);
    } finally {
      setIsAiThinking(false);
      aiTurnProcessing.current = false;
    }
  }, [blackEnemy, checkGameOverState, game, isGameOver, whiteEnemy]);

  // Trigger AI if it's the AI's turn in Player vs AI mode
  useEffect(() => {
    if (gameMode !== 'pvai') return;
    const isAiTurn = currentView === 'game' && game.turn() !== playerColor && !isGameOver;
    if (isAiTurn && !isAiThinking && !aiTurnProcessing.current) {
      const timer = setTimeout(() => {
        handleAiTurn();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentView, gameMode, game, game.turn(), playerColor, isGameOver, isAiThinking, handleAiTurn]);

  // Continuous loop for AI vs AI mode
  useEffect(() => {
    if (
      currentView === 'game' &&
      gameMode === 'aivsai' &&
      isAiVsAiRunning &&
      !isGameOver &&
      !isAiThinking &&
      !aiTurnProcessing.current
    ) {
      const timer = setTimeout(() => {
        handleAiVsAiStep();
      }, aiVsAiSpeedMs);
      return () => clearTimeout(timer);
    }
  }, [
    currentView,
    gameMode,
    isAiVsAiRunning,
    isGameOver,
    isAiThinking,
    aiVsAiSpeedMs,
    handleAiVsAiStep,
    game,
  ]);

  // Make human move
  const handlePlayerMove = (from: Square, to: Square, promotion?: PieceType): boolean => {
    if (isAiThinking || isGameOver) return false;

    // Check for promotion required
    const piece = game.get(from);
    if (
      piece?.type === 'p' &&
      !promotion &&
      ((playerColor === 'w' && to[1] === '8') || (playerColor === 'b' && to[1] === '1'))
    ) {
      setPendingPromotion({ from, to });
      return false;
    }

    try {
      const executed = game.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (executed) {
        // Sound
        if (game.inCheck()) {
          soundFx.playCheck();
        } else if (executed.captured) {
          soundFx.playCapture();
        } else {
          soundFx.playMove();
        }

        // Captured list
        if (executed.captured) {
          setCapturedPieces((prev) => ({
            ...prev,
            [executed.color]: [...prev[executed.color], executed.captured as PieceType],
          }));
        }

        setLastMove({ from, to });
        setHintMove(null);
        setHintText(null);

        const moveRecord: MoveRecord = {
          san: executed.san,
          from,
          to,
          piece: executed.piece as PieceType,
          color: executed.color as PlayerColor,
          captured: executed.captured as PieceType | undefined,
          promotion: executed.promotion as PieceType | undefined,
          fenAfter: game.fen(),
        };

        setHistory((prev) => [...prev, moveRecord]);
        setEvalScore(evaluateBoard(game, enemy));

        const isOver = checkGameOverState(game);
        if (!isOver) {
          fetchCommentary({
            isCheck: game.inCheck(),
            lastMoveSan: executed.san,
            captured: executed.captured as PieceType,
            turnColor: game.turn() as PlayerColor,
          });
        }

        return true;
      }
    } catch (e) {
      return false;
    }

    return false;
  };

  // Promotion choice selection
  const handleSelectPromotion = (piece: PieceType) => {
    if (pendingPromotion) {
      handlePlayerMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    }
  };

  // Undo move
  const handleUndo = () => {
    if (history.length < 1 || isAiThinking) return;

    // In single player vs AI, if it's currently player's turn, undo both AI's move and player's move
    const isPlayersTurn = game.turn() === playerColor;
    const undoCount = isPlayersTurn && history.length >= 2 ? 2 : 1;

    for (let i = 0; i < undoCount; i++) {
      game.undo();
    }

    const newHistory = history.slice(0, history.length - undoCount);
    setHistory(newHistory);

    // Recompute captured pieces from new history
    const newCaptured: { w: PieceType[]; b: PieceType[] } = { w: [], b: [] };
    newHistory.forEach((m) => {
      if (m.captured) {
        newCaptured[m.color].push(m.captured);
      }
    });
    setCapturedPieces(newCaptured);

    if (newHistory.length > 0) {
      const last = newHistory[newHistory.length - 1];
      setLastMove({ from: last.from as Square, to: last.to as Square });
    } else {
      setLastMove(null);
    }

    setHintMove(null);
    setHintText(null);
    setIsGameOver(false);
    setWinner(null);
    setEvalScore(evaluateBoard(game, enemy));
  };

  // Tactical coach hint: calculates best move, highlights squares, and automatically moves the piece
  const handleGetHint = async () => {
    if (isAiThinking || isGameOver || game.turn() !== playerColor) return;
    setIsHintLoading(true);

    try {
      const hint = getTacticalHint(game, playerColor);
      if (hint.move) {
        const fromSquare = hint.move.from as Square;
        const toSquare = hint.move.to as Square;
        const promo = (hint.move.promotion as PieceType) || 'q';

        // 1. Highlight the best tactical move on board
        setHintMove({ from: fromSquare, to: toSquare });
        setHintText(`Bester Zug erkannt: ${hint.san}. Figur zieht automatisch...`);

        // 2. Brief visual delay so the user clearly sees the highlighted move initiating
        await new Promise((resolve) => setTimeout(resolve, 260));

        // 3. Automatically execute the move!
        const success = handlePlayerMove(fromSquare, toSquare, promo);

        if (success) {
          // 4. Enrich feedback with tactical rationale
          try {
            const res = await fetch('/api/gemini/hint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fen: game.fen(),
                turn: game.turn(),
                bestMoveSan: hint.san,
                legalMoves: game.moves(),
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setHintText(`Auto-Zug ausgeführt (${hint.san}): ${data.hint}`);
            } else {
              setHintText(`Auto-Zug ausgeführt: ${hint.san} (starke Feld- & Zentrumskontrolle).`);
            }
          } catch {
            setHintText(`Auto-Zug ausgeführt: ${hint.san}`);
          }
        }
      }
    } catch (e) {
      setHintText('Achte auf Zentrumskontrolle und die Sicherheit deines Königs.');
    } finally {
      setIsHintLoading(false);
    }
  };

  // Start fresh game with current or new enemy
  const handleResetGame = (newOpponent?: AIEnemy, newColor?: PlayerColor) => {
    const opp = newOpponent || enemy;
    const color = newColor || playerColor;

    const freshGame = new Chess();
    setGame(freshGame);
    if (newOpponent) setEnemy(opp);
    if (newColor) setPlayerColor(color);

    setHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setLastMove(null);
    setHintMove(null);
    setHintText(null);
    setIsGameOver(false);
    setWinner(null);
    setGameOverReason('');
    setEvalScore(0);
    setCurrentSpeech(opp.taunts.start[Math.floor(Math.random() * opp.taunts.start.length)]);

    aiTurnProcessing.current = false;
    setIsAiThinking(false);
  };

  // Load and apply an opening onto the board
  const handleSelectOpening = (opening: ChessOpening, playAsColor: PlayerColor) => {
    const newGame = new Chess();
    const newHistory: MoveRecord[] = [];
    const newCaptured: { w: PieceType[]; b: PieceType[] } = { w: [], b: [] };
    let lastPlayedMove: { from: Square; to: Square } | null = null;

    try {
      for (const san of opening.moves) {
        const moveRes = newGame.move(san);
        if (moveRes) {
          lastPlayedMove = { from: moveRes.from as Square, to: moveRes.to as Square };
          if (moveRes.captured) {
            const capColor = moveRes.color === 'w' ? 'b' : 'w';
            newCaptured[capColor].push(moveRes.captured as PieceType);
          }
          newHistory.push({
            san: moveRes.san,
            from: moveRes.from,
            to: moveRes.to,
            piece: moveRes.piece as PieceType,
            color: moveRes.color as PlayerColor,
            captured: moveRes.captured as PieceType | undefined,
            promotion: moveRes.promotion as PieceType | undefined,
            fenAfter: newGame.fen(),
          });
        }
      }
    } catch (err) {
      console.error('Error applying opening moves:', err);
    }

    setGame(newGame);
    setHistory(newHistory);
    setCapturedPieces(newCaptured);
    setLastMove(lastPlayedMove);
    setHintMove(null);
    setHintText(null);
    setIsGameOver(false);
    setWinner(null);
    setGameOverReason('');
    setPlayerColor(playAsColor);
    setEvalScore(evaluateBoard(newGame, enemy));
    setCurrentView('game');

    if (soundEnabled) {
      soundFx.playMove();
    }

    aiTurnProcessing.current = false;
    setIsAiThinking(false);
    setCurrentSpeech(`Eröffnung geladen: ${opening.name} (${opening.eco})! Lass uns spielen!`);
  };

  // Flip board color
  const handleFlipBoard = () => {
    const nextColor: PlayerColor = playerColor === 'w' ? 'b' : 'w';
    handleResetGame(enemy, nextColor);
  };

  // Resign match
  const handleResign = () => {
    if (isGameOver) return;
    const oppColor: PlayerColor = playerColor === 'w' ? 'b' : 'w';
    setWinner(oppColor);
    setIsGameOver(true);
    setGameOverReason(`You resigned. ${enemy.name} claims victory!`);
    soundFx.playDefeat();
    setCurrentSpeech(enemy.taunts.victory[0]);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
  };

  // Launch from Title Screen
  const handleStartGameFromTitle = (
    chosenEnemy: AIEnemy,
    chosenColor: PlayerColor,
    chosenTheme?: BoardTheme
  ) => {
    setGameMode('pvai');
    if (chosenTheme) {
      setBoardTheme(chosenTheme);
    }
    handleResetGame(chosenEnemy, chosenColor);
    setCurrentView('game');
  };

  // Launch AI vs AI from Title Screen
  const handleStartAiVsAiFromTitle = (
    wBot: AIEnemy,
    bBot: AIEnemy,
    chosenTheme?: BoardTheme,
    speedMs?: number
  ) => {
    setGameMode('aivsai');
    if (chosenTheme) setBoardTheme(chosenTheme);
    if (speedMs) setAiVsAiSpeedMs(speedMs);
    handleResetAiVsAiMatch(wBot, bBot);
    setCurrentView('game');
  };

  // Reset match in AI vs AI simulation
  const handleResetAiVsAiMatch = (newWhiteBot?: AIEnemy, newBlackBot?: AIEnemy) => {
    const wBot = newWhiteBot || whiteEnemy;
    const bBot = newBlackBot || blackEnemy;

    const freshGame = new Chess();
    setGame(freshGame);
    if (newWhiteBot) setWhiteEnemy(wBot);
    if (newBlackBot) setBlackEnemy(bBot);

    setHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setLastMove(null);
    setHintMove(null);
    setHintText(null);
    setIsGameOver(false);
    setWinner(null);
    setGameOverReason('');
    setEvalScore(0);
    setWhiteSpeech(wBot.taunts.start[Math.floor(Math.random() * wBot.taunts.start.length)]);
    setBlackSpeech(bBot.taunts.start[Math.floor(Math.random() * bBot.taunts.start.length)]);

    aiTurnProcessing.current = false;
    setIsAiThinking(false);
    setIsAiVsAiRunning(true);
  };

  const handleResumeGameFromTitle = () => {
    setCurrentView('game');
  };

  // Enemy selection dispatcher
  const handleEnemySelect = (newEnemy: AIEnemy) => {
    if (enemySelectorTarget === 'white') {
      setWhiteEnemy(newEnemy);
      handleResetAiVsAiMatch(newEnemy, blackEnemy);
    } else if (enemySelectorTarget === 'black') {
      setBlackEnemy(newEnemy);
      handleResetAiVsAiMatch(whiteEnemy, newEnemy);
    } else {
      handleResetGame(newEnemy, playerColor);
    }
    setIsSelectorOpen(false);
  };

  if (currentView === 'title') {
    return (
      <>
        <TitleScreen
          selectedEnemy={enemy}
          onSelectEnemy={(newEnemy) => setEnemy(newEnemy)}
          playerColor={playerColor}
          onSelectColor={(color) => setPlayerColor(color)}
          selectedTheme={boardTheme}
          onSelectTheme={(theme) => setBoardTheme(theme)}
          onStartGame={handleStartGameFromTitle}
          onStartAiVsAi={handleStartAiVsAiFromTitle}
          hasActiveGame={history.length > 0 && !isGameOver}
          onResumeGame={handleResumeGameFromTitle}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenOpenings={() => setIsOpeningSelectorOpen(true)}
        />
        <OpeningSelectorModal
          isOpen={isOpeningSelectorOpen}
          onClose={() => setIsOpeningSelectorOpen(false)}
          onSelectOpening={handleSelectOpening}
          currentOpeningId={detectedOpening?.opening.id}
          currentPlayerColor={playerColor}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-3 sm:p-6 select-none font-sans">
      {/* Top Header Bar */}
      <header className="w-full max-w-6xl flex items-center justify-between py-2 px-3 border-b border-stone-800/80 mb-3 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-100 flex items-center gap-2">
              Schach & KI-Gegner
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                {gameMode === 'aivsai' ? (
                  <>
                    <Swords className="w-3 h-3 text-amber-400" />
                    KI gegen KI Duell
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Gemini Dialoge
                  </>
                )}
              </span>
            </h1>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              {gameMode === 'aivsai'
                ? `Zuschauer-Modus: ${whiteEnemy.name} (Weiß) gegen ${blackEnemy.name} (Schwarz)`
                : `Spiele gegen ${enemy.name} (${enemy.rating} ELO) mit lebendigen Kommentaren`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Mode Switcher in Header */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
            <button
              id="header-mode-pvai"
              onClick={() => {
                if (gameMode !== 'pvai') {
                  setGameMode('pvai');
                  handleResetGame(enemy, playerColor);
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'pvai'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mensch vs KI</span>
            </button>
            <button
              id="header-mode-aivsai"
              onClick={() => {
                if (gameMode !== 'aivsai') {
                  setGameMode('aivsai');
                  handleResetAiVsAiMatch(whiteEnemy, blackEnemy);
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'aivsai'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span className="hidden md:inline">KI gegen KI</span>
            </button>
          </div>

          {/* Debug Tactical Overlay Toggle */}
          <button
            id="btn-header-toggle-debug"
            onClick={() => setIsDebugMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm ${
              isDebugMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
            title="Taktik- & Debug-Overlay (Tipps, Angriffe, Gegner-Spur & Siegchance)"
          >
            <Bug className={`w-3.5 h-3.5 ${isDebugMode ? 'text-emerald-400 animate-pulse' : 'text-stone-400'}`} />
            <span className="hidden sm:inline">Debug-Overlay:</span>
            <span>{isDebugMode ? 'AN' : 'AUS'}</span>
          </button>

          {/* Opening Library Header Button */}
          <button
            id="btn-header-openings"
            onClick={() => setIsOpeningSelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            title="Eröffnungsbibliothek öffnen"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Eröffnungen</span>
          </button>

          <button
            id="btn-header-to-title"
            onClick={() => setCurrentView('title')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            title="Zurück zum Titelbildschirm"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>Titelmenü</span>
          </button>
          {gameMode === 'pvai' && (
            <button
              id="btn-header-switch-enemy"
              onClick={() => {
                setEnemySelectorTarget('single');
                setIsSelectorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            >
              <span>Gegner wechseln</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Game Layout */}
      <main className="w-full max-w-6xl flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 sm:gap-7">
        {/* Left / Center Section: Chess Board & Evaluation & Controls */}
        <div className="w-full max-w-[580px] flex flex-col items-center">
          <div className="w-full flex items-center gap-3">
            {/* Centipawn Evaluation Bar */}
            <div className="hidden sm:flex shrink-0">
              <EvaluationBar
                score={evalScore}
                playerColor={gameMode === 'aivsai' ? 'w' : playerColor}
              />
            </div>

            {/* Chess Board Container */}
            <div className="flex-1 flex flex-col items-center">
              {/* Opening Banner directly above chessboard */}
              <OpeningBanner
                detectedOpening={detectedOpening}
                onOpenSelector={() => setIsOpeningSelectorOpen(true)}
              />

              <ChessBoard
                game={game}
                playerColor={playerColor}
                onMove={handlePlayerMove}
                isAiThinking={isAiThinking}
                isGameOver={isGameOver}
                lastMove={lastMove}
                hintMove={hintMove}
                theme={boardTheme}
                onThemeChange={(newTheme) => setBoardTheme(newTheme)}
                isAiVsAi={gameMode === 'aivsai'}
                debugMode={isDebugMode}
                candidateMoves={debugAnalysis?.candidateMoves || []}
                hoveredCandidateRank={hoveredCandidateRank}
                attackedPieces={debugAnalysis?.attackedPieces || []}
                enemyLastMoveInfo={debugAnalysis?.enemyLastMove || null}
                plannedLine={
                  activePlanRank !== null
                    ? (debugAnalysis?.candidateMoves.find((c) => c.rank === activePlanRank)?.plannedLine || null)
                    : null
                }
                activePlanRank={activePlanRank}
                showArrows={debugShowArrows}
                showThreats={debugShowThreats}
                showEnemyMove={debugShowEnemyMove}
                onSelectCandidateMove={(cand) => {
                  handlePlayerMove(
                    cand.from,
                    cand.to,
                    (cand.move.promotion as PieceType) || undefined
                  );
                }}
              />
            </div>
          </div>

          {/* Captured Pieces Loot Bar */}
          <div className="w-full mt-3 px-1">
            <CapturedPieces whiteCaptured={capturedPieces.w} blackCaptured={capturedPieces.b} />
          </div>

          {/* Tactical Coach Hint Callout */}
          {hintText && (
            <div className="w-full mt-3 p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-blue-200 text-xs animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="text-blue-300 block mb-0.5">Taktischer Tipp:</strong>
                <span>{hintText}</span>
              </div>
              <button
                onClick={() => {
                  setHintText(null);
                  setHintMove(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Controls toolbar */}
          <div className="w-full mt-3">
            {gameMode === 'aivsai' ? (
              <AiVsAiControls
                isRunning={isAiVsAiRunning}
                onTogglePlay={() => setIsAiVsAiRunning((prev) => !prev)}
                onStep={handleAiVsAiStep}
                onReset={() => handleResetAiVsAiMatch()}
                speedMs={aiVsAiSpeedMs}
                onChangeSpeed={(ms) => setAiVsAiSpeedMs(ms)}
                isThinking={isAiThinking}
                isGameOver={isGameOver}
                onFlipView={() => setPlayerColor((prev) => (prev === 'w' ? 'b' : 'w'))}
              />
            ) : (
              <GameControls
                onNewGame={() => handleResetGame()}
                onUndo={handleUndo}
                onHint={handleGetHint}
                onFlipBoard={handleFlipBoard}
                onResign={handleResign}
                isSoundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                canUndo={history.length > 0}
                isAiThinking={isAiThinking}
                isHintLoading={isHintLoading}
                onOpenOpenings={() => setIsOpeningSelectorOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Right Section: Enemy Profile / Dual Profile & Move History */}
        <div className="w-full max-w-[580px] lg:max-w-sm flex flex-col gap-4">
          {gameMode === 'aivsai' ? (
            <AiVsAiDualProfile
              whiteEnemy={whiteEnemy}
              whiteBot={whiteEnemy}
              blackEnemy={blackEnemy}
              blackBot={blackEnemy}
              currentTurn={game.turn() as PlayerColor}
              whiteSpeech={whiteSpeech}
              blackSpeech={blackSpeech}
              isThinking={isAiThinking}
              evalScore={evalScore}
              inCheck={game.inCheck()}
              isGameOver={isGameOver}
              winner={winner}
              onChangeWhite={() => {
                setEnemySelectorTarget('white');
                setIsSelectorOpen(true);
              }}
              onSwitchWhite={() => {
                setEnemySelectorTarget('white');
                setIsSelectorOpen(true);
              }}
              onChangeBlack={() => {
                setEnemySelectorTarget('black');
                setIsSelectorOpen(true);
              }}
              onSwitchBlack={() => {
                setEnemySelectorTarget('black');
                setIsSelectorOpen(true);
              }}
            />
          ) : (
            <EnemyProfile
              enemy={enemy}
              currentSpeech={currentSpeech}
              isThinking={isAiThinking}
              isAlarmed={game.inCheck() && game.turn() !== playerColor}
              isConfident={playerColor === 'w' ? evalScore < -250 : evalScore > 250}
              isDefeated={isGameOver && winner === playerColor}
              onOpenSelector={() => {
                setEnemySelectorTarget('single');
                setIsSelectorOpen(true);
              }}
            />
          )}

          {/* Debug Tactical Overlay Component */}
          {isDebugMode && debugAnalysis ? (
            <DebugTacticalOverlay
              analysis={debugAnalysis}
              playerColor={gameMode === 'aivsai' ? (game.turn() as PlayerColor) : playerColor}
              isPlayerTurn={gameMode === 'aivsai' ? true : game.turn() === playerColor}
              onSelectMove={(cand) => {
                handlePlayerMove(
                  cand.from,
                  cand.to,
                  (cand.move.promotion as PieceType) || undefined
                );
              }}
              hoveredCandidateRank={hoveredCandidateRank}
              onHoverCandidate={setHoveredCandidateRank}
              onClose={() => setIsDebugMode(false)}
              showArrows={debugShowArrows}
              onToggleArrows={() => setDebugShowArrows((prev) => !prev)}
              showThreats={debugShowThreats}
              onToggleThreats={() => setDebugShowThreats((prev) => !prev)}
              showEnemyMove={debugShowEnemyMove}
              onToggleEnemyMove={() => setDebugShowEnemyMove((prev) => !prev)}
              activePlanRank={activePlanRank}
              onSelectPlanRank={setActivePlanRank}
            />
          ) : (
            <button
              id="btn-enable-debug-sidebar"
              onClick={() => setIsDebugMode(true)}
              className="w-full py-2 px-3 rounded-2xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/40 text-stone-300 hover:text-emerald-300 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-emerald-400" />
                <span>Debug- & Taktik-Overlay aktivieren</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Tipps & Analyse
              </span>
            </button>
          )}

          {/* Move Log */}
          <div className="w-full flex-1 min-h-[220px]">
            <MoveHistory history={history} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl py-3 mt-4 border-t border-stone-800/60 text-center text-stone-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>FIDE-Standardregeln • Minimax Alpha-Beta Engine • Gemini Kontext-Dialoge</span>
        <span>
          {gameMode === 'aivsai'
            ? `Zuschauer-Ansicht: ${playerColor === 'w' ? 'Aus Sicht von Weiß' : 'Aus Sicht von Schwarz'}`
            : `Du spielst: ${playerColor === 'w' ? 'Weiß' : 'Schwarz'}`}
        </span>
      </footer>

      {/* Promotion Choice Modal */}
      <PromotionModal
        isOpen={Boolean(pendingPromotion)}
        color={playerColor}
        onSelect={handleSelectPromotion}
      />

      {/* Enemy Selector Modal */}
      <EnemySelector
        isOpen={isSelectorOpen}
        currentEnemyId={
          enemySelectorTarget === 'white'
            ? whiteEnemy.id
            : enemySelectorTarget === 'black'
            ? blackEnemy.id
            : enemy.id
        }
        onSelect={handleEnemySelect}
        onClose={() => setIsSelectorOpen(false)}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        winner={winner}
        playerColor={playerColor}
        reason={gameOverReason}
        enemy={enemy}
        totalMoves={Math.ceil(history.length / 2)}
        onRematch={() => (gameMode === 'aivsai' ? handleResetAiVsAiMatch() : handleResetGame())}
        onChooseEnemy={() => {
          setIsGameOver(false);
          setEnemySelectorTarget('single');
          setIsSelectorOpen(true);
        }}
        onBackToTitle={() => {
          setIsGameOver(false);
          setCurrentView('title');
        }}
        isAiVsAi={gameMode === 'aivsai'}
        whiteEnemy={whiteEnemy}
        whiteBot={whiteEnemy}
        blackEnemy={blackEnemy}
        blackBot={blackEnemy}
      />

      {/* Opening Library Selector Modal */}
      <OpeningSelectorModal
        isOpen={isOpeningSelectorOpen}
        onClose={() => setIsOpeningSelectorOpen(false)}
        onSelectOpening={handleSelectOpening}
        currentOpeningId={detectedOpening?.opening.id}
        currentPlayerColor={playerColor}
      />
    </div>
  );
}
