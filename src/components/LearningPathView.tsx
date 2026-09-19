import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import {
  CHESS_LESSONS,
  LEARNING_CHAPTERS,
  ChessLesson,
  LearningChapter,
} from '../data/learningPath';
import { PieceIcon } from './PieceIcon';
import { soundFx } from '../services/audio';
import { PieceType, PlayerColor } from '../types';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  Crown,
  Eye,
} from 'lucide-react';

interface LearningProgress {
  completedLessons: Record<string, { stars: number; completedAt: number }>;
  unlockedLessons: string[];
}

const STORAGE_KEY = 'chess_learning_path_progress_v2';

const getInitialProgress = (): LearningProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse learning progress:', e);
  }
  // Default: first lesson unlocked
  return {
    completedLessons: {},
    unlockedLessons: ['lesson-1'],
  };
};

interface LearningPathViewProps {
  onBack: () => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<LearningProgress>(getInitialProgress);
  const [activeChapterId, setActiveChapterId] = useState<number | 'all'>('all');
  const [activeLesson, setActiveLesson] = useState<ChessLesson | null>(null);

  // Lesson interactive puzzle state
  const [lessonGame, setLessonGame] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [lessonStatus, setLessonStatus] = useState<'idle' | 'wrong' | 'continuation' | 'solved'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [revealedSolution, setRevealedSolution] = useState<boolean>(false);

  // Save progress changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save learning progress:', e);
    }
  }, [progress]);

  // Total stars and completed count
  const totalStars = useMemo(() => {
    return (Object.values(progress.completedLessons) as Array<{ stars: number; completedAt: number }>).reduce(
      (acc, l) => acc + (l?.stars || 0),
      0
    );
  }, [progress.completedLessons]);

  const completedCount = useMemo(() => {
    return Object.keys(progress.completedLessons).length;
  }, [progress.completedLessons]);

  const maxStars = CHESS_LESSONS.length * 3;
  const progressPercent = Math.round((completedCount / CHESS_LESSONS.length) * 100);

  // Rank title
  const rankTitle = useMemo(() => {
    if (totalStars >= 48) return 'Großmeister des Pfades';
    if (totalStars >= 36) return 'Kandidat-Meister';
    if (totalStars >= 24) return 'Kombinations-Künstler';
    if (totalStars >= 15) return 'Zentrums-Stratege';
    if (totalStars >= 6) return 'Taktik-Schüler';
    return 'Schach-Novize';
  }, [totalStars]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    if (activeChapterId === 'all') return CHESS_LESSONS;
    return CHESS_LESSONS.filter((l) => l.chapterId === activeChapterId);
  }, [activeChapterId]);

  // Launch a lesson
  const handleOpenLesson = (lesson: ChessLesson) => {
    const isUnlocked = progress.unlockedLessons.includes(lesson.id) || progress.completedLessons[lesson.id];
    if (!isUnlocked) return;

    setActiveLesson(lesson);
    const newGame = new Chess(lesson.initialFen);
    setLessonGame(newGame);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setLessonStatus('idle');
    setStatusMessage('');
    setShowHint(false);
    setRevealedSolution(false);
  };

  // Reset current lesson puzzle
  const handleResetCurrentLesson = () => {
    if (!activeLesson) return;
    const newGame = new Chess(activeLesson.initialFen);
    setLessonGame(newGame);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setLessonStatus('idle');
    setStatusMessage('');
    setShowHint(false);
    setRevealedSolution(false);
  };

  // Check if a move is correct
  const isMoveCorrect = (san: string, fromTo: string, correctList: string[]) => {
    return correctList.some(
      (c) =>
        c.toLowerCase() === san.toLowerCase() ||
        c.toLowerCase() === fromTo.toLowerCase() ||
        c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === san.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );
  };

  // Handle board square click during interactive lesson
  const handleSquareClick = (square: Square) => {
    if (!lessonGame || !activeLesson || lessonStatus === 'solved') return;

    const piece = lessonGame.get(square);
    const isPlayerPiece = piece && piece.color === activeLesson.playerColor;

    // If square clicked is one of the valid destination moves
    if (selectedSquare && validMoves.includes(square)) {
      const from = selectedSquare;
      const to = square;

      try {
        const moveResult = lessonGame.move({
          from,
          to,
          promotion: 'q',
        });

        if (moveResult) {
          soundFx.playMove();
          setLastMove({ from, to });
          setSelectedSquare(null);
          setValidMoves([]);

          const fromTo = `${from}${to}`;
          const isFirstStepCorrect = isMoveCorrect(moveResult.san, fromTo, activeLesson.correctMoves);

          if (isFirstStepCorrect) {
            // Check if there is an opponent continuation
            if (activeLesson.continuation && lessonStatus !== 'continuation') {
              setLessonStatus('continuation');
              setStatusMessage('Exzellenter Zug! Der Gegner antwortet...');

              setTimeout(() => {
                try {
                  const replyMove = lessonGame.move(activeLesson.continuation!.opponentMove);
                  if (replyMove) {
                    soundFx.playMove();
                    setLastMove({ from: replyMove.from as Square, to: replyMove.to as Square });
                    setStatusMessage('Finde nun den entscheidenden finalen Zug!');
                  }
                } catch (err) {
                  console.error('Failed continuation move:', err);
                }
              }, 600);
            } else {
              // Solved!
              handleLessonSuccess();
            }
          } else if (lessonStatus === 'continuation' && activeLesson.continuation) {
            const isSecondStepCorrect = isMoveCorrect(
              moveResult.san,
              fromTo,
              activeLesson.continuation.nextCorrectMoves
            );
            if (isSecondStepCorrect) {
              handleLessonSuccess();
            } else {
              handleLessonFailure();
            }
          } else {
            handleLessonFailure();
          }
        }
      } catch (e) {
        console.error('Invalid move in lesson:', e);
      }
      return;
    }

    // Otherwise selecting a piece of player's color
    if (isPlayerPiece) {
      setSelectedSquare(square);
      const moves = lessonGame.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Lesson success trigger
  const handleLessonSuccess = () => {
    if (!activeLesson) return;
    setLessonStatus('solved');
    setStatusMessage('Hervorragend gelöst! 3 Sterne erhalten! ⭐⭐⭐');
    soundFx.playVictory();

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    // Save progress
    setProgress((prev) => {
      const nextCompleted = {
        ...prev.completedLessons,
        [activeLesson.id]: { stars: 3, completedAt: Date.now() },
      };

      // Find next lesson to unlock
      const currentIndex = CHESS_LESSONS.findIndex((l) => l.id === activeLesson.id);
      const nextLesson = CHESS_LESSONS[currentIndex + 1];
      const nextUnlocked = [...prev.unlockedLessons];

      if (nextLesson && !nextUnlocked.includes(nextLesson.id)) {
        nextUnlocked.push(nextLesson.id);
      }

      return {
        completedLessons: nextCompleted,
        unlockedLessons: nextUnlocked,
      };
    });
  };

  // Lesson failure trigger
  const handleLessonFailure = () => {
    setLessonStatus('wrong');
    setStatusMessage('Noch nicht optimal. Probiere eine andere Taktik!');
    soundFx.playDefeat();

    setTimeout(() => {
      if (activeLesson) {
        const resetGame = new Chess(activeLesson.initialFen);
        setLessonGame(resetGame);
        setSelectedSquare(null);
        setValidMoves([]);
        setLastMove(null);
        setLessonStatus('idle');
      }
    }, 1100);
  };

  // Auto-demonstrate solution
  const handleShowSolution = () => {
    if (!activeLesson || !lessonGame) return;
    setRevealedSolution(true);
    const resetGame = new Chess(activeLesson.initialFen);
    setLessonGame(resetGame);

    const firstMoveTarget = activeLesson.correctMoves[0];
    try {
      const executed = resetGame.move(firstMoveTarget);
      if (executed) {
        soundFx.playMove();
        setLastMove({ from: executed.from as Square, to: executed.to as Square });
        setStatusMessage(`Musterlösung: ${executed.san} (${activeLesson.goalDescription})`);
      }
    } catch (e) {
      // fallback try from-to if san fails
      try {
        const from = firstMoveTarget.slice(0, 2) as Square;
        const to = firstMoveTarget.slice(2, 4) as Square;
        const executed = resetGame.move({ from, to, promotion: 'q' });
        if (executed) {
          soundFx.playMove();
          setLastMove({ from, to });
          setStatusMessage(`Musterlösung: ${executed.san}`);
        }
      } catch (err) {
        console.error('Failed to show solution:', err);
      }
    }
  };

  // Advance to next lesson
  const handleNextLesson = () => {
    if (!activeLesson) return;
    const currentIndex = CHESS_LESSONS.findIndex((l) => l.id === activeLesson.id);
    const nextLesson = CHESS_LESSONS[currentIndex + 1];
    if (nextLesson) {
      handleOpenLesson(nextLesson);
    } else {
      setActiveLesson(null);
    }
  };

  // Unlock all for testing/review
  const handleUnlockAll = () => {
    if (window.confirm('Möchtest du alle Lektionen des Pfades zum freien Erkunden freischalten?')) {
      setProgress((prev) => ({
        ...prev,
        unlockedLessons: CHESS_LESSONS.map((l) => l.id),
      }));
    }
  };

  // Reset progress
  const handleResetProgress = () => {
    if (window.confirm('Möchtest du deinen gesamten Lernfortschritt wirklich auf 0 zurücksetzen?')) {
      const resetState = {
        completedLessons: {},
        unlockedLessons: ['lesson-1'],
      };
      setProgress(resetState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
    }
  };

  // Render board for lesson puzzle
  const renderBoardGrid = () => {
    if (!lessonGame) return null;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
      <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square border-4 border-stone-800 rounded-2xl overflow-hidden shadow-2xl bg-stone-900 select-none">
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const square = `${file}${rank}` as Square;
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            const piece = lessonGame.get(square);
            const isSelected = selectedSquare === square;
            const isValidDestination = validMoves.includes(square);
            const isLastMoveSquare =
              lastMove && (lastMove.from === square || lastMove.to === square);

            return (
              <div
                key={square}
                id={`learn-sq-${square}`}
                onClick={() => handleSquareClick(square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isLight ? 'bg-[#e3c28c]' : 'bg-[#a37042]'
                } ${isSelected ? '!bg-amber-400/80 ring-4 ring-amber-300 inset-0' : ''} ${
                  isLastMoveSquare ? '!bg-amber-300/50' : ''
                }`}
              >
                {/* Coordinates */}
                {file === 'a' && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] font-bold ${
                      isLight ? 'text-[#a37042]' : 'text-[#e3c28c]'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rank === '1' && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] font-bold ${
                      isLight ? 'text-[#a37042]' : 'text-[#e3c28c]'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Valid Move Indicator */}
                {isValidDestination && (
                  <div
                    className={`absolute z-10 pointer-events-none rounded-full ${
                      piece
                        ? 'w-full h-full border-4 border-amber-500/80 bg-amber-500/20'
                        : 'w-3.5 h-3.5 bg-amber-500/80 ring-2 ring-amber-400'
                    }`}
                  />
                )}

                {/* Piece rendering */}
                {piece && (
                  <div className="z-10 w-[82%] h-[82%] flex items-center justify-center transition-transform hover:scale-105">
                    <PieceIcon
                      type={piece.type as PieceType}
                      color={piece.color as PlayerColor}
                      className="w-full h-full drop-shadow-md"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div
      id="chess-learning-path-screen"
      className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-x-hidden font-sans select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(245,158,11,0.2),rgba(12,10,9,0))]" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10 border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-from-learning-path"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Zurück zum Hauptmenü"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Zurück</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              SCHACH-LERNPFAD
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                {rankTitle}
              </span>
            </h1>
            <p className="text-xs text-stone-400 hidden sm:block">
              Dein Weg vom Anfänger zum meisterlichen Taktiker & Strategen
            </p>
          </div>
        </div>

        {/* Global Stars & Completed Stats */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>
              {totalStars} / {maxStars}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {completedCount} / {CHESS_LESSONS.length} Lektionen
            </span>
          </div>
        </div>
      </header>

      {/* Progress Journey Bar Banner */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2 z-10">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900/90 via-stone-900/70 to-stone-900/90 border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Gesamtfortschritt der Lern-Reise</span>
                <span className="text-xs font-black text-amber-400">{progressPercent}%</span>
              </div>
              <div className="text-xs text-stone-400">
                Schließe jede Station durch interaktives Lösen der Stellung ab, um den nächsten Schritt freizuschalten.
              </div>
            </div>
          </div>

          {/* Progress Visual Bar */}
          <div className="w-full sm:w-64 flex flex-col gap-1.5">
            <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${Math.max(4, progressPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>Novize</span>
              <span>Stratege</span>
              <span>Großmeister</span>
            </div>
          </div>
        </div>

        {/* Chapter Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
          <button
            id="learn-filter-all"
            onClick={() => setActiveChapterId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeChapterId === 'all'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            Alle 5 Kapitel
          </button>
          {LEARNING_CHAPTERS.map((ch) => {
            const isSelected = activeChapterId === ch.id;
            return (
              <button
                key={ch.id}
                id={`learn-filter-ch-${ch.id}`}
                onClick={() => setActiveChapterId(ch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <span>{ch.badge}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Path Map */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1 z-10">
        <div className="relative flex flex-col items-center gap-8">
          {/* Vertical Connecting Ribbon / Road Behind Nodes */}
          <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-amber-500/60 via-amber-500/20 to-stone-800 pointer-events-none rounded-full" />

          {filteredLessons.map((lesson, idx) => {
            const isCompleted = Boolean(progress.completedLessons[lesson.id]);
            const isUnlocked = progress.unlockedLessons.includes(lesson.id) || isCompleted;
            const stars = progress.completedLessons[lesson.id]?.stars || 0;

            // Zig-zag offset for serpentine path layout
            const isEven = idx % 2 === 0;

            return (
              <div
                key={lesson.id}
                id={`node-${lesson.id}`}
                className={`relative w-full max-w-xl flex items-center gap-4 sm:gap-6 ${
                  isEven ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Visual Milestone Node Button */}
                <button
                  id={`btn-lesson-${lesson.id}`}
                  onClick={() => handleOpenLesson(lesson)}
                  disabled={!isUnlocked}
                  className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                    isCompleted
                      ? 'bg-gradient-to-b from-emerald-950 to-stone-900 border-emerald-500/60 text-emerald-300 hover:scale-105 shadow-emerald-500/10'
                      : isUnlocked
                      ? 'bg-gradient-to-b from-amber-950 to-stone-900 border-amber-400 text-amber-300 hover:scale-105 shadow-amber-500/20 ring-4 ring-amber-500/20 animate-pulse'
                      : 'bg-stone-900/60 border-stone-800 text-stone-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-0.5" />
                      <div className="flex gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      </div>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <Play className="w-6 h-6 text-amber-400 fill-amber-400 ml-0.5 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Start</span>
                    </>
                  ) : (
                    <Lock className="w-5 h-5 text-stone-600" />
                  )}

                  {/* Level Number Pin */}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-stone-900 border border-stone-700 text-[10px] font-bold text-stone-300 flex items-center justify-center shadow-md">
                    {idx + 1}
                  </span>
                </button>

                {/* Lesson Detail Card on Side */}
                <div
                  onClick={() => isUnlocked && handleOpenLesson(lesson)}
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    isUnlocked ? 'cursor-pointer hover:border-amber-500/40' : 'cursor-not-allowed'
                  } ${
                    isCompleted
                      ? 'bg-stone-900/80 border-stone-800 text-stone-200'
                      : isUnlocked
                      ? 'bg-stone-900/95 border-amber-500/30 text-white shadow-lg'
                      : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-stone-700 uppercase tracking-wider">
                      {lesson.chapterBadge}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        lesson.difficulty === 'Einsteiger'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {lesson.difficulty}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold tracking-tight mb-1 text-white">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed mb-2.5">
                    {lesson.subtitle}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs">
                    <span className="text-stone-400 text-[11px] truncate max-w-[200px]">
                      {lesson.goalDescription}
                    </span>
                    {isUnlocked && (
                      <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px] shrink-0">
                        <span>Lösen</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls & unlock helper */}
        <div className="mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <button
              id="btn-unlock-all-learning"
              onClick={handleUnlockAll}
              className="hover:text-amber-400 transition cursor-pointer underline text-[11px]"
            >
              Alle Kapitel freischalten (Entwickler-Modus)
            </button>
            <span>•</span>
            <button
              id="btn-reset-learning-progress"
              onClick={handleResetProgress}
              className="hover:text-red-400 transition cursor-pointer text-[11px]"
            >
              Fortschritt zurücksetzen
            </button>
          </div>
          <span className="text-[11px] text-stone-500">18 handverlesene Taktik- und Strategie-Stationen</span>
        </div>
      </main>

      {/* Interactive Lesson Modal Workspace */}
      {activeLesson && (
        <div
          id="active-lesson-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {activeLesson.chapterTitle}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white">{activeLesson.title}</h2>
                </div>
              </div>

              <button
                id="btn-close-lesson-modal"
                onClick={() => setActiveLesson(null)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                title="Lektion schließen"
              >
                ✕
              </button>
            </div>

            {/* Split Content: Left Theory & Mission, Right Interactive Board */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Theory, Mission, Pro Tips & Actions */}
              <div className="md:col-span-5 flex flex-col gap-3.5">
                {/* Mission Card */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Deine Aufgabe</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold leading-snug">
                    {activeLesson.goalDescription}
                  </p>
                </div>

                {/* Pedagogical Explanation */}
                <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 text-stone-300 text-xs leading-relaxed">
                  <div className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Konzept & Erklärung</span>
                  </div>
                  <p>{activeLesson.conceptExplanation}</p>
                </div>

                {/* Grandmaster Pro Tip */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">
                  <div className="font-bold text-emerald-400 mb-0.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Meister-Tipp</span>
                  </div>
                  <p>{activeLesson.proTip}</p>
                </div>

                {/* Status alert if solved or failed */}
                {statusMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold transition-all ${
                      lessonStatus === 'solved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-bounce'
                        : lessonStatus === 'wrong'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {statusMessage}
                  </div>
                )}

                {/* Hint Card if toggled */}
                {showHint && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs animate-fade-in">
                    <strong>💡 Hinweis:</strong> {activeLesson.hint}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    id="btn-lesson-toggle-hint"
                    onClick={() => setShowHint((prev) => !prev)}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showHint ? 'Hinweis verbergen' : 'Hinweis'}</span>
                  </button>

                  <button
                    id="btn-lesson-reset-pos"
                    onClick={handleResetCurrentLesson}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                    title="Stellung neu aufbauen"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                    <span>Reset</span>
                  </button>

                  <button
                    id="btn-lesson-show-solution"
                    onClick={handleShowSolution}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                    title="Musterzug anzeigen"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lösung</span>
                  </button>
                </div>

                {/* Next lesson button if solved */}
                {lessonStatus === 'solved' && (
                  <button
                    id="btn-lesson-next-continue"
                    onClick={handleNextLesson}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition active:scale-95"
                  >
                    <span>Nächste Lektion auf dem Pfad</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right Column: Interactive Chessboard */}
              <div className="md:col-span-7 flex flex-col items-center">
                <div className="w-full max-w-[420px]">
                  {renderBoardGrid()}
                </div>
                <div className="text-[11px] text-stone-400 mt-2.5 text-center flex items-center justify-center gap-2">
                  <span>Klicke auf die Figur und dann auf das Zielfeld, um den Zug auszuführen.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
