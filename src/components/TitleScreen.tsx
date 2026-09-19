import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Swords,
  Shield,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Crown,
  RotateCcw,
  Palette,
  MessageSquare,
  Award,
  User,
  Users,
  Globe,
  Gauge,
  BookOpen,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { AIEnemy, PlayerColor, BoardTheme, PieceCustomizationState } from '../types';
import { AI_ENEMIES } from '../data/enemies';
import { PieceIcon } from './PieceIcon';
import { EnemyAvatar } from './EnemyAvatar';
import { THEME_STYLES } from './ChessBoard';

interface TitleScreenProps {
  selectedEnemy: AIEnemy;
  onSelectEnemy: (enemy: AIEnemy) => void;
  playerColor: PlayerColor;
  onSelectColor: (color: PlayerColor) => void;
  selectedTheme?: BoardTheme;
  onSelectTheme?: (theme: BoardTheme) => void;
  onStartGame: (enemy: AIEnemy, color: PlayerColor, theme?: BoardTheme) => void;
  onStartAiVsAi?: (whiteEnemy: AIEnemy, blackEnemy: AIEnemy, theme?: BoardTheme, speedMs?: number) => void;
  onStartPvP?: (theme?: BoardTheme) => void;
  hasActiveGame: boolean;
  onResumeGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  pieceCustomization?: PieceCustomizationState;
  onOpenPieceCustomizer?: (tab?: 'editor' | 'white' | 'black' | 'army' | 'presets') => void;
  onToggleCustomPieces?: (enabled: boolean) => void;
  onOpenOpenings?: () => void;
  onOpenLearningPath?: () => void;
  onOpenOnlineLobby?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedEnemy,
  onSelectEnemy,
  playerColor,
  onSelectColor,
  selectedTheme = 'green',
  onSelectTheme,
  onStartGame,
  onStartAiVsAi,
  onStartPvP,
  hasActiveGame,
  onResumeGame,
  soundEnabled,
  onToggleSound,
  pieceCustomization,
  onOpenPieceCustomizer,
  onToggleCustomPieces,
  onOpenOpenings,
  onOpenLearningPath,
  onOpenOnlineLobby,
}) => {
  const safeSelected = selectedEnemy || AI_ENEMIES[1];
  const [activeMode, setActiveMode] = useState<'pvai' | 'pvp' | 'online' | 'aivsai'>('pvai');
  const [chosenColor, setChosenColor] = useState<'w' | 'b' | 'random'>(playerColor);
  const [currentTheme, setCurrentTheme] = useState<BoardTheme>(selectedTheme);
  const [whiteBot, setWhiteBot] = useState<AIEnemy>(AI_ENEMIES[1]);
  const [blackBot, setBlackBot] = useState<AIEnemy>(AI_ENEMIES[4]);
  const [aiSpeedMs, setAiSpeedMs] = useState<number>(800);

  const handleLaunch = () => {
    let finalColor: PlayerColor;
    if (chosenColor === 'random') {
      finalColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      finalColor = chosenColor;
    }
    onSelectColor(finalColor);
    onStartGame(safeSelected, finalColor, currentTheme);
  };

  const handleLaunchAiVsAi = () => {
    if (onStartAiVsAi) {
      onStartAiVsAi(whiteBot, blackBot, currentTheme, aiSpeedMs);
    }
  };

  const handleLaunchPvP = () => {
    if (onStartPvP) {
      onStartPvP(currentTheme);
    } else {
      onStartGame(safeSelected, 'w', currentTheme);
    }
  };

  const handleThemeChange = (theme: BoardTheme) => {
    setCurrentTheme(theme);
    if (onSelectTheme) {
      onSelectTheme(theme);
    }
  };

  const themeList = (Object.keys(THEME_STYLES) as BoardTheme[]);

  return (
    <div
      id="title-screen-container"
      className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-x-hidden select-none font-sans"
    >
      {/* Ambient background atmosphere & warm lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(245,158,11,0.18),rgba(12,10,9,0))]" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `repeating-conic-gradient(#facc15 0% 25%, transparent 0% 50%)`,
          backgroundSize: '72px 72px',
        }}
      />

      {/* Top Header Bar */}
      <header
        id="title-header"
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10 border-b border-stone-800/60 backdrop-blur-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
            <PieceIcon type="n" color="w" className="w-7 h-7 drop-shadow" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SCHACH ARENA
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Staunton Edition
              </span>
            </h1>
            <p className="text-xs text-stone-400 hidden sm:block">
              Spiele gegen authentische KI-Gegner mit individuellen Taktiken
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenOnlineLobby && (
            <button
              id="title-btn-online-lobby-header"
              onClick={onOpenOnlineLobby}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition cursor-pointer shadow-md text-xs font-bold"
              title="Online-Multiplayer Lobby erstellen oder per Code beitreten"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Online-Lobby</span>
            </button>
          )}

          {onOpenLearningPath && (
            <button
              id="title-btn-learning-path-header"
              onClick={onOpenLearningPath}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 border border-amber-500/40 text-amber-300 transition cursor-pointer shadow-sm text-xs font-bold"
              title="Interaktiven Schach-Lernpfad mit 18 Stationen öffnen"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Schach-Lernpfad</span>
            </button>
          )}

          <button
            id="title-sound-toggle"
            onClick={onToggleSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shadow-sm text-xs font-medium"
            title={soundEnabled ? 'Ton stummschalten' : 'Ton aktivieren'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Ton an</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Ton aus</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col items-center justify-center z-10">
        {/* Heraldic Title & Center Crest */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center justify-center gap-4 sm:gap-7 p-3.5 sm:p-5 rounded-3xl bg-gradient-to-b from-stone-900/90 to-stone-950/90 border border-stone-800 shadow-2xl mb-4 relative"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 transform -rotate-6 hover:rotate-0 transition-transform">
              <PieceIcon type="n" color="w" className="w-12 h-12 sm:w-16 sm:h-16 filter drop-shadow" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400/80 font-serif text-lg sm:text-2xl font-bold tracking-widest">VS</span>
              <span className="text-[10px] text-stone-400 tracking-wider font-mono">STAUNTON</span>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-stone-800/80 border border-stone-700/80 transform rotate-6 hover:rotate-0 transition-transform">
              <PieceIcon type="k" color="b" className="w-12 h-12 sm:w-16 sm:h-16 filter drop-shadow" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2"
          >
            Wähle dein Duell
          </motion.h2>
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto mb-4"
          >
            5 authentische Schachspieler mit eigenen Spielstilen, ELO-Stärken und lebendigen Dialogen.
          </motion.p>

          {/* Interactive Learning Path Banner */}
          {onOpenLearningPath && (
            <div className="w-full max-w-md mx-auto mb-4">
              <button
                id="title-btn-open-learning-path"
                onClick={onOpenLearningPath}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900 to-amber-500/10 border border-amber-500/40 hover:border-amber-400 text-stone-200 hover:text-white flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-lg hover:shadow-amber-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                      <span>SCHACH-LERNPFAD</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-200 font-mono">18 Lektionen</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Rochade, Springergabel, Spieße, Mattmuster & Endspiele interaktiv trainieren
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

          {/* Mode Switcher: Mensch vs KI | Mensch gegen Mensch | Online-Lobby | KI gegen KI */}
          <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl max-w-2xl w-full backdrop-blur-xs flex-wrap sm:flex-nowrap gap-1">
            <button
              id="title-mode-pvai"
              onClick={() => setActiveMode('pvai')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'pvai'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Mensch vs KI</span>
            </button>
            <button
              id="title-mode-pvp"
              onClick={() => setActiveMode('pvp')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'pvp'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lokal (1 Gerät)</span>
            </button>
            <button
              id="title-mode-online"
              onClick={() => {
                setActiveMode('online');
                if (onOpenOnlineLobby) onOpenOnlineLobby();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'online'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Online-Lobby</span>
            </button>
            <button
              id="title-mode-aivsai"
              onClick={() => setActiveMode('aivsai')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'aivsai'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>KI gegen KI</span>
            </button>
          </div>
        </div>

        {/* Global Game Type Setting: Regular Chess vs. Custom Pieces & Army per Player */}
        <div className="w-full max-w-2xl mb-5 px-1">
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  pieceCustomization?.enabled
                    ? 'bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-300 shadow-md'
                    : 'bg-stone-800/80 border-stone-700 text-stone-300'
                }`}
              >
                {pieceCustomization?.enabled ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <PieceIcon type="k" color="w" className="w-7 h-7 drop-shadow-xs" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Figuren-Modus:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pieceCustomization?.enabled
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    {pieceCustomization?.enabled ? 'Individuell (Custom)' : 'Regulär (Standard)'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  {pieceCustomization?.enabled
                    ? pieceCustomization.armySetup === 'custom'
                      ? `Eigene Aufstellung: ${pieceCustomization.customPresetName || 'Freies Setup'} • Weiß: ${pieceCustomization.white.styleId} • Schwarz: ${pieceCustomization.black.styleId}`
                      : `Weiß: ${pieceCustomization.white.styleId} • Schwarz: ${pieceCustomization.black.styleId} • ${
                          pieceCustomization.armySetup === 'standard' ? '16 vs 16' : 'Sonder-Aufstellung'
                        }`
                    : 'Klassische Turnierfiguren und Standard 16 vs. 16 Aufstellung'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 flex-wrap">
              <button
                id="btn-toggle-regular-pieces"
                onClick={() => onToggleCustomPieces?.(!pieceCustomization?.enabled)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors cursor-pointer"
              >
                {pieceCustomization?.enabled ? 'Zu Regulär' : 'Zu Individuell'}
              </button>

              {onOpenPieceCustomizer && (
                <>
                  <button
                    id="btn-open-board-editor"
                    onClick={() => onOpenPieceCustomizer('editor')}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Figuren frei auf das Brett ziehen und eigenes Preset speichern"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aufstellung bauen</span>
                  </button>

                  <button
                    id="btn-open-title-customizer"
                    onClick={() => onOpenPieceCustomizer('white')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Design & Farben</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* --- MODE 1: SPIELER VS KI --- */}
        {activeMode === 'pvai' && (
          <>
            {/* 1. Gegner-Auswahl (Opponents Grid) */}
        <div className="w-full max-w-5xl mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Gegner auswählen
            </span>
            <span className="text-xs text-amber-400/90 font-medium">
              Ausgewählt: <strong className="text-amber-300">{selectedEnemy.name}</strong> ({selectedEnemy.rating} ELO)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {AI_ENEMIES.map((opp) => {
              const isSelected = selectedEnemy.id === opp.id;
              return (
                <button
                  key={opp.id}
                  id={`title-enemy-select-${opp.id}`}
                  onClick={() => onSelectEnemy(opp)}
                  className={`relative p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between h-full border cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30 scale-[1.02]'
                      : 'bg-stone-900/60 border-stone-800 hover:bg-stone-900 hover:border-stone-700'
                  }`}
                >
                  {/* Header with Avatar & Name */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <EnemyAvatar
                      avatarKey={opp?.avatar || 'felix'}
                      size="sm"
                      className="w-11 h-11 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{opp?.name || 'Gegner'}</div>
                      <div className="text-[11px] text-stone-400 truncate">{opp?.title || ''}</div>
                    </div>
                  </div>

                  {/* Rating & Difficulty */}
                  <div className="mt-auto pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-amber-400">{opp.rating} ELO</span>
                    <span className="text-stone-400 font-medium">{opp.difficulty}</span>
                  </div>

                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[10px] font-bold shadow-md">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Spotlight-Karte des ausgewählten Gegners */}
        <AnimatePresence mode="wait">
          <motion.div
            key={safeSelected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-5xl rounded-2xl bg-stone-900/80 border border-stone-800 p-4 sm:p-5 shadow-xl mb-6 backdrop-blur-xs"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <EnemyAvatar
                  avatarKey={safeSelected?.avatar || 'felix'}
                  size="lg"
                  className="w-16 h-16 shrink-0 shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-white">{safeSelected.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {safeSelected.rating} ELO
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700">
                      {safeSelected.difficulty}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">{safeSelected.bio}</p>
                </div>
              </div>

              {/* Quote bubble */}
              <div className="w-full md:w-auto md:max-w-xs bg-stone-950/80 border border-stone-800/90 rounded-xl p-3 text-xs text-stone-300 italic flex items-start gap-2 shadow-inner">
                <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>„{safeSelected?.taunts?.start?.[0] || 'Lass uns eine Runde spielen.'}“</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        </>
        )}

        {/* --- MODE PVP: MENSCH GEGEN MENSCH PREVIEW --- */}
        {activeMode === 'pvp' && (
          <div className="w-full max-w-5xl mb-6 flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>Lokaler 2-Spieler-Modus:</strong> Zwei Personen spielen abwechselnd am selben Bildschirm. Der taktische Zugvorschlag mit den 3 farbigen Pfeilen (Aggressiv, Solide, Positionell) passt sich bei jedem Zug live an die jeweilige Farbe an!
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Spieler 1 (Weiß) */}
              <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-950 font-black text-2xl shadow-md">
                    W
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">1. Zug</span>
                    <h3 className="text-base font-bold text-white">Spieler 1 (Weiß)</h3>
                    <p className="text-xs text-stone-400">Eröffnet die Partie mit den weißen Figuren</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-semibold">
                  Mensch
                </div>
              </div>

              {/* Spieler 2 (Schwarz) */}
              <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-stone-950 border border-stone-700 flex items-center justify-center text-stone-100 font-black text-2xl shadow-md">
                    S
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Antwortet</span>
                    <h3 className="text-base font-bold text-white">Spieler 2 (Schwarz)</h3>
                    <p className="text-xs text-stone-400">Reagiert mit den schwarzen Figuren</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-semibold">
                  Mensch
                </div>
              </div>
            </div>

            {/* Online option banner */}
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-stone-300">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Möchtest du auf zwei verschiedenen Geräten spielen? Erstelle eine Online-Lobby mit Code & Farbauslosung!</span>
              </div>
              {onOpenOnlineLobby && (
                <button
                  type="button"
                  onClick={onOpenOnlineLobby}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer shrink-0 shadow-sm"
                >
                  Online-Lobby öffnen
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- MODE ONLINE: MULTIPLAYER LOBBY PREVIEW --- */}
        {activeMode === 'online' && (
          <div className="w-full max-w-5xl mb-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900/90 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Online Multiplayer Schach
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      Live Code-Lobby
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Erstelle einen 6-stelligen Raum-Code, teile ihn mit einer zweiten Person und spielt in Echtzeit gegeneinander.
                  </p>
                </div>
              </div>

              {onOpenOnlineLobby && (
                <button
                  type="button"
                  onClick={onOpenOnlineLobby}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
                >
                  Lobby jetzt öffnen
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                  1
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Code teilen</h4>
                <p className="text-xs text-stone-400">
                  Generiere mit einem Klick eine private Lobby und teile den 6-stelligen Code oder Direktlink.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                  2
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Farbauslosung</h4>
                <p className="text-xs text-stone-400">
                  Sobald der Gast beitritt, werden Weiß und Schwarz automatisch und unparteiisch per Zufall verlost.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                  3
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Echtzeit-Partie</h4>
                <p className="text-xs text-stone-400">
                  Jeder Zug wird live synchronisiert, inklusive Chat, Remis-Angeboten und Revanche-Option.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- MODE 2: KI GEGEN KI DUELL --- */}
        {activeMode === 'aivsai' && (
          <div className="w-full max-w-5xl mb-6 flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <Swords className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>Zuschauer-Modus:</strong> Wähle zwei KIs aus. Sie treten vollautomatisch gegeneinander an. Du kannst zuschauen, pausieren, das Tempo steuern und Spielzüge analysieren!
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bot Weiß Auswahl */}
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-stone-100 border border-stone-400 shadow-sm" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
                      Weißer Bot (1. Zug)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {whiteBot.name} ({whiteBot.rating} ELO)
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {AI_ENEMIES.map((bot) => {
                    const isSelected = whiteBot.id === bot.id;
                    return (
                      <button
                        key={`white-${bot.id}`}
                        onClick={() => setWhiteBot(bot)}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow font-bold'
                            : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <EnemyAvatar avatarKey={bot.avatar} size="sm" className="w-8 h-8" />
                        <span className="text-[11px] truncate w-full">{bot.name.split(' ')[0]}</span>
                        <span className="text-[9px] font-mono opacity-80">{bot.rating}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bot Schwarz Auswahl */}
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-stone-900 border border-stone-600 shadow-sm" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
                      Schwarzer Bot
                    </span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {blackBot.name} ({blackBot.rating} ELO)
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {AI_ENEMIES.map((bot) => {
                    const isSelected = blackBot.id === bot.id;
                    return (
                      <button
                        key={`black-${bot.id}`}
                        onClick={() => setBlackBot(bot)}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow font-bold'
                            : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <EnemyAvatar avatarKey={bot.avatar} size="sm" className="w-8 h-8" />
                        <span className="text-[11px] truncate w-full">{bot.name.split(' ')[0]}</span>
                        <span className="text-[9px] font-mono opacity-80">{bot.rating}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Speed selection for AI vs AI */}
            <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Simulations-Tempo:</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Gemütlich (1.5s)', ms: 1500 },
                  { label: 'Normal (0.8s)', ms: 800 },
                  { label: 'Schnell (0.35s)', ms: 350 },
                  { label: 'Blitz (0.15s)', ms: 150 },
                ].map((s) => (
                  <button
                    key={s.ms}
                    onClick={() => setAiSpeedMs(s.ms)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      aiSpeedMs === s.ms
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Brett-Farben & Variationen (Board Theme Selector) */}
        <div className="w-full max-w-5xl mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              Brett-Design & Farben (6 Variationen)
            </span>
            <span className="text-xs text-stone-400">
              Aktuell: <strong className="text-stone-200">{THEME_STYLES[currentTheme].name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {themeList.map((t) => {
              const st = THEME_STYLES[t];
              const isSelected = currentTheme === t;
              return (
                <button
                  key={t}
                  id={`title-theme-${t}`}
                  onClick={() => handleThemeChange(t)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-stone-900 border-amber-500 shadow-md ring-2 ring-amber-500/25'
                      : 'bg-stone-900/50 border-stone-800 hover:bg-stone-900 hover:border-stone-700'
                  }`}
                >
                  {/* 2x2 Board Preview Swatch */}
                  <div className="w-full h-12 rounded-lg overflow-hidden flex flex-wrap border border-black/40 shadow-inner mb-2">
                    <div className="w-1/2 h-1/2 flex items-center justify-center" style={{ backgroundColor: st.lightHex }}>
                      <span className="text-[10px] opacity-20">♚</span>
                    </div>
                    <div className="w-1/2 h-1/2 flex items-center justify-center" style={{ backgroundColor: st.darkHex }}>
                      <span className="text-[10px] opacity-20">♘</span>
                    </div>
                    <div className="w-1/2 h-1/2 flex items-center justify-center" style={{ backgroundColor: st.darkHex }}>
                      <span className="text-[10px] opacity-20">♟</span>
                    </div>
                    <div className="w-1/2 h-1/2 flex items-center justify-center" style={{ backgroundColor: st.lightHex }}>
                      <span className="text-[10px] opacity-20">♜</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-stone-200 truncate">{st.name}</div>
                    <div className="text-[10px] text-stone-400 truncate">{st.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Start-Aktionen */}
        {activeMode === 'pvai' && (
          <div className="w-full max-w-xl bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 text-center">
              Deine Spielfarbe
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <button
                id="title-color-white"
                onClick={() => setChosenColor('w')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium text-xs sm:text-sm cursor-pointer ${
                  chosenColor === 'w'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-stone-100 border border-stone-400 shadow-sm" />
                <span>Weiß (1. Zug)</span>
              </button>

              <button
                id="title-color-black"
                onClick={() => setChosenColor('b')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium text-xs sm:text-sm cursor-pointer ${
                  chosenColor === 'b'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-stone-900 border border-stone-600 shadow-sm" />
                <span>Schwarz (KI 1.)</span>
              </button>

              <button
                id="title-color-random"
                onClick={() => setChosenColor('random')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium text-xs sm:text-sm cursor-pointer ${
                  chosenColor === 'random'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Zufall (50/50)</span>
              </button>
            </div>

            {/* Action Launch Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="title-btn-start-game"
                onClick={handleLaunch}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Partie starten gegen {selectedEnemy.name.split(' ')[0]}</span>
              </button>

              {hasActiveGame && (
                <button
                  id="title-btn-resume-game"
                  onClick={onResumeGame}
                  className="py-3.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Fortsetzen</span>
                </button>
              )}
            </div>

            {/* Quick Opening Library Button */}
            {onOpenOpenings && (
              <div className="mt-3 pt-3 border-t border-stone-800/80">
                <button
                  id="title-btn-open-openings"
                  onClick={onOpenOpenings}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-950/80 hover:bg-stone-800 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Eröffnung wählen & trainieren (30+ Systeme: Sizilianisch, Spanisch, Gambits...)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- MODE PVP: MENSCH GEGEN MENSCH --- */}
        {activeMode === 'pvp' && (
          <div className="w-full max-w-xl bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Mensch gegen Mensch:</strong> Zwei Personen spielen abwechselnd am selben Bildschirm. Der taktische Zugvorschlag mit den 3 farbigen Taktiken (Aggressiv, Solide, Positionell) passt sich bei jedem Zug dynamisch für den jeweils aktiven Spieler an!
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="title-btn-start-pvp"
                onClick={handleLaunchPvP}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Users className="w-5 h-5" />
                <span>Mensch gegen Mensch starten</span>
              </button>

              {hasActiveGame && (
                <button
                  id="title-btn-resume-game-pvp"
                  onClick={onResumeGame}
                  className="py-3.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Fortsetzen</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- MODE ONLINE: LAUNCH BUTTONS --- */}
        {activeMode === 'online' && (
          <div className="w-full max-w-xl bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="title-btn-start-online"
                onClick={onOpenOnlineLobby}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Globe className="w-5 h-5" />
                <span>Online-Lobby betreten</span>
              </button>
            </div>
          </div>
        )}

        {/* --- MODE 3: KI GEGEN KI DUELL --- */}
        {activeMode === 'aivsai' && (
          <div className="w-full max-w-xl bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="title-btn-start-aivsai"
                onClick={handleLaunchAiVsAi}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Swords className="w-5 h-5" />
                <span>KI-Duell starten: {whiteBot.name.split(' ')[0]} vs {blackBot.name.split(' ')[0]}</span>
              </button>

              {hasActiveGame && (
                <button
                  id="title-btn-resume-game-aivsai"
                  onClick={onResumeGame}
                  className="py-3.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Fortsetzen</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feature Badges Footer */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>FIDE-Turnierregeln</span>
          </div>
          <span className="text-stone-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <PieceIcon type="n" color="w" className="w-4 h-4" />
            <span>Klassisches Staunton-Design</span>
          </div>
          <span className="text-stone-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>5 KI-Persönlichkeiten</span>
          </div>
          <span className="text-stone-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>6 Farbvarianten</span>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full text-center py-3 text-[11px] text-stone-500 z-10 border-t border-stone-900">
        Staunton Tournament Chess • Handgefertigtes Schachdesign mit KI-Gegnern
      </footer>
    </div>
  );
};
