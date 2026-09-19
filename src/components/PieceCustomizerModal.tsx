import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieceCustomizationState,
  PieceStyleId,
  PieceGlowEffect,
  ArmySetupType,
  GameMode,
  PieceType,
} from '../types';
import {
  PIECE_STYLES,
  WHITE_COLOR_PRESETS,
  BLACK_COLOR_PRESETS,
  GLOW_PRESETS,
  ARMY_SETUPS,
  PRESET_THEMES,
} from '../data/pieceStyles';
import { PieceIcon } from './PieceIcon';
import {
  Palette,
  Sparkles,
  Swords,
  Shield,
  RotateCcw,
  Check,
  X,
  Crown,
  Info,
  Layers,
  ChevronRight,
  PenTool,
} from 'lucide-react';
import { BoardSetupEditor } from './BoardSetupEditor';

interface PieceCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: PieceCustomizationState;
  onChangeCustomization: (newConfig: PieceCustomizationState) => void;
  currentGameMode?: GameMode;
  inActiveGame?: boolean;
  onRestartWithNewArmy?: (armyType: ArmySetupType) => void;
  initialTab?: 'editor' | 'white' | 'black' | 'army' | 'presets';
}

export const PieceCustomizerModal: React.FC<PieceCustomizerModalProps> = ({
  isOpen,
  onClose,
  customization,
  onChangeCustomization,
  currentGameMode = 'pvai',
  inActiveGame = false,
  onRestartWithNewArmy,
  initialTab = 'editor',
}) => {
  const [localConfig, setLocalConfig] = useState<PieceCustomizationState>(() => ({
    ...customization,
    white: { ...customization.white },
    black: { ...customization.black },
  }));

  const [activeTab, setActiveTab] = useState<'editor' | 'white' | 'black' | 'army' | 'presets'>(
    initialTab || 'editor'
  );
  const [pendingArmyRestart, setPendingArmyRestart] = useState<boolean>(false);

  // Sync with prop when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalConfig({
        ...customization,
        white: { ...customization.white },
        black: { ...customization.black },
      });
      setPendingArmyRestart(false);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, customization, initialTab]);

  if (!isOpen) return null;

  const handleToggleMode = (enabled: boolean) => {
    setLocalConfig((prev) => ({
      ...prev,
      enabled,
      // If toggling to regular, reset army setup to standard as well
      armySetup: enabled ? prev.armySetup : 'standard',
    }));
  };

  const handleApply = () => {
    onChangeCustomization(localConfig);
    if (pendingArmyRestart && inActiveGame && onRestartWithNewArmy) {
      onRestartWithNewArmy(localConfig.armySetup);
    }
    onClose();
  };

  const handleResetToStandard = () => {
    setLocalConfig({
      enabled: false,
      white: { styleId: 'classic', glow: 'none' },
      black: { styleId: 'classic', glow: 'none' },
      armySetup: 'standard',
    });
  };

  const samplePieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

  return (
    <div
      id="piece-customizer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        id="piece-customizer-dialog"
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-stone-950/80 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Figuren- & Partie-Anpassung</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-amber-500/20">
                  {currentGameMode === 'pvai'
                    ? 'Spieler vs. KI'
                    : currentGameMode === 'pvp'
                    ? 'Mensch vs. Mensch'
                    : currentGameMode === 'aivsai'
                    ? 'KI vs. KI Duell'
                    : 'Online-Partie'}
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Wähle zwischen regulärem Turnierschach oder passe jedes Spieler-Set individuell an.
              </p>
            </div>
          </div>

          <button
            id="btn-close-piece-customizer"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Choice: Regular vs Custom Mode */}
        <div className="p-4 sm:px-6 bg-stone-950/50 border-b border-stone-800/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Regular Button */}
            <button
              id="btn-select-regular-chess"
              onClick={() => handleToggleMode(false)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                !localConfig.enabled
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/5'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  !localConfig.enabled
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                <PieceIcon type="k" color="w" className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Reguläres Schach</span>
                  {!localConfig.enabled && (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Klassische Staunton-Figuren, gewohnte 16 vs. 16 Standardaufstellung.
                </p>
              </div>
            </button>

            {/* Custom Mode Button */}
            <button
              id="btn-select-custom-pieces"
              onClick={() => handleToggleMode(true)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                localConfig.enabled
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/5'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  localConfig.enabled
                    ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Individuelle Figuren & Setup</span>
                  {localConfig.enabled && (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Jeder Spieler mit eigenem Design-Stil, Farbwahl, Glanz und optionalem Armee-Handicap.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className="px-4 py-3 bg-stone-950/90 border-b border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Aktuelle Figuren-Vorschau:</span>
          </div>

          <div className="flex items-center gap-4">
            {/* White preview */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800">
              <span className="text-[11px] font-bold text-stone-300 mr-1">Weiß:</span>
              <div className="flex items-center -space-x-0.5">
                {samplePieces.map((p) => (
                  <PieceIcon
                    key={`w-${p}`}
                    type={p}
                    color="w"
                    className="w-5 h-5"
                    customization={localConfig.enabled ? localConfig.white : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Black preview */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800">
              <span className="text-[11px] font-bold text-stone-400 mr-1">Schwarz:</span>
              <div className="flex items-center -space-x-0.5">
                {samplePieces.map((p) => (
                  <PieceIcon
                    key={`b-${p}`}
                    type={p}
                    color="b"
                    className="w-5 h-5"
                    customization={localConfig.enabled ? localConfig.black : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Customization Controls (Active when custom mode is selected) */}
        {localConfig.enabled ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2 overflow-x-auto">
              <button
                id="tab-btn-editor"
                onClick={() => setActiveTab('editor')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700/80'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Aufstellungs-Editor (Figuren hineinziehen)</span>
              </button>

              <button
                onClick={() => setActiveTab('white')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'white'
                    ? 'bg-stone-100 text-stone-950 shadow'
                    : 'bg-stone-800/60 text-stone-400 hover:text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-stone-200 border border-stone-400"></div>
                <span>Spieler 1 (Weiß) Design</span>
              </button>

              <button
                onClick={() => setActiveTab('black')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'black'
                    ? 'bg-stone-100 text-stone-950 shadow'
                    : 'bg-stone-800/60 text-stone-400 hover:text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-stone-700"></div>
                <span>Spieler 2 (Schwarz) Design</span>
              </button>

              <button
                onClick={() => setActiveTab('army')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'army'
                    ? 'bg-stone-100 text-stone-950 shadow'
                    : 'bg-stone-800/60 text-stone-400 hover:text-white'
                }`}
              >
                <Swords className="w-3.5 h-3.5 text-amber-500" />
                <span>Vorgabe-Handicaps</span>
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-stone-100 text-stone-950 shadow'
                    : 'bg-stone-800/60 text-stone-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Fertige Duell-Themes</span>
              </button>
            </div>

            {/* TAB: FREE BOARD SETUP EDITOR */}
            {activeTab === 'editor' && (
              <div className="animate-fadeIn">
                <BoardSetupEditor
                  customization={localConfig}
                  onApplyCustomSetup={(fen, presetName) => {
                    const nextConfig: PieceCustomizationState = {
                      ...localConfig,
                      enabled: true,
                      armySetup: 'custom',
                      customFen: fen,
                      customPresetName: presetName || 'Eigene Aufstellung',
                    };
                    setLocalConfig(nextConfig);
                    onChangeCustomization(nextConfig);
                    if (onRestartWithNewArmy) {
                      onRestartWithNewArmy('custom');
                    }
                    onClose();
                  }}
                  onClose={onClose}
                  isGameInProgress={inActiveGame}
                />
              </div>
            )}

            {/* TAB: WHITE PIECES */}
            {activeTab === 'white' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Style Selection */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">
                    Figuren-Stil für Weiß auswählen:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PIECE_STYLES.map((style) => {
                      const isSelected = localConfig.white.styleId === style.id;
                      return (
                        <button
                          key={style.id}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              white: {
                                ...prev.white,
                                styleId: style.id,
                                primaryColor: undefined, // reset custom override when switching style
                                accentColor: undefined,
                              },
                            }))
                          }
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/40'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <PieceIcon
                              type="k"
                              color="w"
                              styleId={style.id}
                              className="w-7 h-7 drop-shadow-sm"
                            />
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                              {style.tag}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {style.name}
                          </div>
                          <div className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                            {style.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Palettes for White */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">
                    Farbton / Legierung für Weiß:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {WHITE_COLOR_PRESETS.map((preset) => {
                      const isSelected =
                        localConfig.white.primaryColor === preset.fill ||
                        (!localConfig.white.primaryColor && preset.id === 'pure_white');
                      return (
                        <button
                          key={preset.id}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              white: {
                                ...prev.white,
                                primaryColor: preset.fill,
                                accentColor: preset.stroke,
                              },
                            }))
                          }
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-500 ring-1 ring-amber-500/40'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border shadow-inner shrink-0"
                            style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
                          />
                          <span className="text-[11px] font-medium text-stone-200 truncate">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aura & Glow for White */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">
                    Magischer Glanz / Aura-Effekt für Weiß:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {GLOW_PRESETS.map((glow) => {
                      const isSelected = localConfig.white.glow === glow.id;
                      return (
                        <button
                          key={glow.id}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              white: { ...prev.white, glow: glow.id },
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-500 ring-1 ring-amber-500/40'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <div className="text-[11px] font-medium text-stone-200">
                            {glow.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BLACK PIECES */}
            {activeTab === 'black' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Style Selection */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">
                    Figuren-Stil für Schwarz auswählen:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PIECE_STYLES.map((style) => {
                      const isSelected = localConfig.black.styleId === style.id;
                      return (
                        <button
                          key={style.id}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              black: {
                                ...prev.black,
                                styleId: style.id,
                                primaryColor: undefined,
                                accentColor: undefined,
                              },
                            }))
                          }
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/40'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <PieceIcon
                              type="k"
                              color="b"
                              styleId={style.id}
                              className="w-7 h-7 drop-shadow-sm"
                            />
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                              {style.tag}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {style.name}
                          </div>
                          <div className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                            {style.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Palettes for Black */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">
                    Farbton / Textur für Schwarz:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {BLACK_COLOR_PRESETS.map((preset) => {
                      const isSelected =
                        localConfig.black.primaryColor === preset.fill ||
                        (!localConfig.black.primaryColor && preset.id === 'obsidian');
                      return (
                        <button
                          key={preset.id}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              black: {
                                ...prev.black,
                                primaryColor: preset.fill,
                                accentColor: preset.stroke,
                              },
                            }))
                          }
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-500 ring-1 ring-amber-500/40'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border shadow-inner shrink-0"
                            style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
                          />
                          <span className="text-[11px] font-medium text-stone-200 truncate">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aura & Glow for Black */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">
                    Magischer Glanz / Aura-Effekt für Schwarz:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {GLOW_PRESETS.map((glow) => {
                      const isSelected = localConfig.black.glow === glow.id;
                      return (
                        <button
                          key={glow.id}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              black: { ...prev.black, glow: glow.id },
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-500 ring-1 ring-amber-500/40'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <div className="text-[11px] font-medium text-stone-200">
                            {glow.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ARMY SETUP & HANDICAPS */}
            {activeTab === 'army' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    Hier kannst du entscheiden, ob ihr mit einer vollständigen klassischen 16-gegen-16
                    Aufstellung spielt oder mit gezielten Figuren-Handicaps (z. B. Dame-Vorteil, Springer-Staffel
                    oder vorgezogenen Bauern).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ARMY_SETUPS.map((setup) => {
                    const isSelected = localConfig.armySetup === setup.id;
                    return (
                      <button
                        key={setup.id}
                        onClick={() => {
                          setLocalConfig((prev) => ({
                            ...prev,
                            armySetup: setup.id,
                          }));
                          if (inActiveGame && setup.id !== customization.armySetup) {
                            setPendingArmyRestart(true);
                          }
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-white">{setup.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              setup.advantage === 'Ausgeglichen'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {setup.advantage}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">{setup.description}</p>
                      </button>
                    );
                  })}
                </div>

                {pendingArmyRestart && inActiveGame && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      Hinweis: Eine Änderung der Start-Aufstellung startet eine neue Partie mit den gewählten Figuren.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB: READY DUEL PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-4 animate-fadeIn">
                <p className="text-xs text-stone-400">
                  Wähle ein perfekt abgestimmtes Figuren-Set für beide Spieler mit einem Klick:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          white: { ...preset.white },
                          black: { ...preset.black },
                        }))
                      }
                      className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 hover:border-amber-500/60 hover:bg-stone-800/40 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {preset.title}
                          </div>
                          <div className="text-xs text-stone-400">{preset.subtitle}</div>
                        </div>

                        {/* Dual Kings preview */}
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-900 border border-stone-800">
                          <PieceIcon
                            type="k"
                            color="w"
                            className="w-6 h-6"
                            customization={preset.white}
                          />
                          <PieceIcon
                            type="k"
                            color="b"
                            className="w-6 h-6"
                            customization={preset.black}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* REGULAR CHESS VIEW */
          <div className="p-6 sm:p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PieceIcon type="k" color="w" className="w-10 h-10" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-white">Reguläre Figuren aktiv</h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Du spielst mit dem klassischen FIDE Staunton-Figurensatz und Standard-Regeln.
                Möchtest du eigene Farben, Stile oder Handicaps für jeden Spieler wählen?
              </p>
            </div>
            <button
              onClick={() => handleToggleMode(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Figuren jetzt individuell anpassen</span>
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={handleResetToStandard}
            className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zurücksetzen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              id="btn-apply-piece-customization"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Übernehmen</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
