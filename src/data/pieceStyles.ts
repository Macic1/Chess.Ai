import {
  PieceStyleId,
  PieceGlowEffect,
  ArmySetupType,
  PieceCustomizationState,
  PlayerPieceCustomization,
} from '../types';

export interface StyleMeta {
  id: PieceStyleId;
  name: string;
  subtitle: string;
  tag: string;
  defaultWhiteFill: string;
  defaultWhiteStroke: string;
  defaultBlackFill: string;
  defaultBlackStroke: string;
  description: string;
}

export const PIECE_STYLES: StyleMeta[] = [
  {
    id: 'classic',
    name: 'Klassisch Staunton',
    subtitle: 'Offizieller FIDE-Turniersatz',
    tag: 'Turnier-Standard',
    defaultWhiteFill: '#ffffff',
    defaultWhiteStroke: '#1a1a1a',
    defaultBlackFill: '#22252a',
    defaultBlackStroke: '#0f1115',
    description: 'Der zeitlose Weltstandard für Turniere und Vereine – präzise, ausbalanciert und gewohnt lesbar.',
  },
  {
    id: 'royal',
    name: 'Kaiserlich Gold & Silber',
    subtitle: 'Königliche Palast-Garde',
    tag: 'Edelmetall',
    defaultWhiteFill: '#fef08a',
    defaultWhiteStroke: '#ca8a04',
    defaultBlackFill: '#1c1917',
    defaultBlackStroke: '#eab308',
    description: 'Goldglänzende Verzierungen, kaiserliche Kronen und poliertes Silber für erhabene Schachduelle.',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Neon',
    subtitle: 'Futuristische Leuchtlinien',
    tag: 'Sci-Fi Synth',
    defaultWhiteFill: '#083344',
    defaultWhiteStroke: '#06b6d4',
    defaultBlackFill: '#310022',
    defaultBlackStroke: '#ec4899',
    description: 'Elektrisierendes Cyan und pulsierendes Neon-Magenta mit leuchtenden Konturen aus der Zukunft.',
  },
  {
    id: 'wood',
    name: 'Meister-Holzschnitt',
    subtitle: 'Ahorn & Walnussholz',
    tag: 'Handwerk',
    defaultWhiteFill: '#fef3c7',
    defaultWhiteStroke: '#78350f',
    defaultBlackFill: '#451a03',
    defaultBlackStroke: '#b45309',
    description: 'Warmes kanadisches Ahornholz trifft auf tiefes Walnussholz mit feiner Schnitz-Ästhetik.',
  },
  {
    id: 'crystal',
    name: 'Frost-Kristall & Eis',
    subtitle: 'Diamantener Glanz',
    tag: 'Arktisch',
    defaultWhiteFill: '#e0f2fe',
    defaultWhiteStroke: '#0284c7',
    defaultBlackFill: '#0f172a',
    defaultBlackStroke: '#38bdf8',
    description: 'Gefrorene Eiskristalle mit schillerndem Lichtbrechungseffekt und frostigen Azur-Akzenten.',
  },
  {
    id: 'shadow',
    name: 'Schatten-Obsidian',
    subtitle: 'Gothische Blutglut',
    tag: 'Dunkelmagie',
    defaultWhiteFill: '#f8fafc',
    defaultWhiteStroke: '#64748b',
    defaultBlackFill: '#09090b',
    defaultBlackStroke: '#ef4444',
    description: 'Finsterer Obsidian-Stein mit glühenden Rubin-Adern und unheilvoller gothischer Eleganz.',
  },
  {
    id: 'emerald',
    name: 'Kaiser-Smaragd',
    subtitle: 'Jade & Feingold',
    tag: 'Kostbar',
    defaultWhiteFill: '#d1fae5',
    defaultWhiteStroke: '#059669',
    defaultBlackFill: '#022c22',
    defaultBlackStroke: '#10b981',
    description: 'Chinesische Jade und tiefgrüner Malachit, eingefasst in antikes Kaisergold.',
  },
  {
    id: 'minimal',
    name: 'Bauhaus Modern',
    subtitle: 'Minimalistisches Design',
    tag: 'Avantgarde',
    defaultWhiteFill: '#f1f5f9',
    defaultWhiteStroke: '#0f172a',
    defaultBlackFill: '#18181b',
    defaultBlackStroke: '#a1a1aa',
    description: 'Reduzierte, markante geometrische Formen nach den Prinzipien des modernen Industriedesigns.',
  },
];

export interface ColorPreset {
  id: string;
  name: string;
  fill: string;
  stroke: string;
}

export const WHITE_COLOR_PRESETS: ColorPreset[] = [
  { id: 'pure_white', name: 'Elfenbeinweiß', fill: '#ffffff', stroke: '#1a1a1a' },
  { id: 'warm_gold', name: 'Kaisergold', fill: '#fef08a', stroke: '#ca8a04' },
  { id: 'ice_azure', name: 'Gletscher-Azur', fill: '#e0f2fe', stroke: '#0284c7' },
  { id: 'mint_jade', name: 'Smaragd-Jade', fill: '#d1fae5', stroke: '#059669' },
  { id: 'rose_pearl', name: 'Roségold Perle', fill: '#ffe4e6', stroke: '#e11d48' },
  { id: 'cyber_cyan', name: 'Cyber-Cyan', fill: '#083344', stroke: '#22d3ee' },
];

export const BLACK_COLOR_PRESETS: ColorPreset[] = [
  { id: 'obsidian', name: 'Tiefschwarz Obsidian', fill: '#22252a', stroke: '#0f1115' },
  { id: 'crimson_ruby', name: 'Blutrubin', fill: '#3b0712', stroke: '#ef4444' },
  { id: 'midnight_navy', name: 'Mitternachts-Saphir', fill: '#030712', stroke: '#3b82f6' },
  { id: 'dark_bronze', name: 'Antik-Bronze', fill: '#291404', stroke: '#d97706' },
  { id: 'neon_purple', name: 'Cyber-Violett', fill: '#2e1065', stroke: '#c084fc' },
  { id: 'forest_emerald', name: 'Dunkler Malachit', fill: '#022c22', stroke: '#10b981' },
];

export const GLOW_PRESETS: { id: PieceGlowEffect; label: string; previewColor: string }[] = [
  { id: 'none', label: 'Kein Leuchten', previewColor: 'transparent' },
  { id: 'subtle', label: 'Dezenter Schatten', previewColor: '#78716c' },
  { id: 'gold', label: 'Goldene Aura', previewColor: '#eab308' },
  { id: 'cyan', label: 'Neon Cyan Glow', previewColor: '#06b6d4' },
  { id: 'ruby', label: 'Rubinrote Glut', previewColor: '#ef4444' },
  { id: 'purple', label: 'Mystisches Violett', previewColor: '#a855f7' },
];

export interface ArmySetupMeta {
  id: ArmySetupType;
  title: string;
  badge: string;
  description: string;
  advantage: 'Ausgeglichen' | 'Vorteil Schwarz' | 'Vorteil Weiß' | 'Sonderregel';
  fen: string;
}

export const ARMY_SETUPS: ArmySetupMeta[] = [
  {
    id: 'standard',
    title: 'Klassische Aufstellung (16 vs 16)',
    badge: 'Standard',
    description: 'Vollständige reguläre Schachaufstellung mit allen 32 Figuren und Standardregeln.',
    advantage: 'Ausgeglichen',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
  {
    id: 'queen_odds_white',
    title: 'Damen-Handicap (Weiß ohne Dame)',
    badge: 'Handicap Weiß',
    description: 'Weiß startet ohne Dame (auf d1). Ausgezeichnet zum Ausgleich unterschiedlicher Spielstärken.',
    advantage: 'Vorteil Schwarz',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',
  },
  {
    id: 'queen_odds_black',
    title: 'Damen-Handicap (Schwarz ohne Dame)',
    badge: 'Handicap Schwarz',
    description: 'Schwarz startet ohne Dame (auf d8). Perfekt, um Angriffsspiel gegen starke KIs zu trainieren.',
    advantage: 'Vorteil Weiß',
    fen: 'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
  {
    id: 'rook_odds_black',
    title: 'Turm-Handicap (Schwarz ohne a8-Turm)',
    badge: 'Handicap Schwarz',
    description: 'Schwarz verzichtet auf den linken Eckturm. Moderates Handicap für spannende Partien.',
    advantage: 'Vorteil Weiß',
    fen: '1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
  {
    id: 'knight_squad',
    title: 'Kavallerie-Staffel (Springer statt Läufer)',
    badge: 'Variante',
    description: 'Beide Seiten spielen mit 4 Springern und ohne Läufer! Enorme taktische Gabel-Gefahr.',
    advantage: 'Sonderregel',
    fen: 'rnnqknnr/pppppppp/8/8/8/8/PPPPPPPP/RNNQKNNR w KQkq - 0 1',
  },
  {
    id: 'pawn_rush',
    title: 'Bauern-Offensive (Pawn Rush)',
    badge: 'Temporeich',
    description: 'Alle Bauern starten auf Reihe 3 (Weiß) und Reihe 6 (Schwarz). Sofortiger Kontakt im Zentrum!',
    advantage: 'Sonderregel',
    fen: 'rnbqkbnr/8/pppppppp/8/8/PPPPPPPP/8/RNBQKBNR w KQkq - 0 1',
  },
];

export const DEFAULT_PIECE_CUSTOMIZATION: PieceCustomizationState = {
  enabled: false, // Default to regular tournament style
  white: {
    styleId: 'classic',
    glow: 'none',
  },
  black: {
    styleId: 'classic',
    glow: 'none',
  },
  armySetup: 'standard',
};

export const PRESET_THEMES = [
  {
    id: 'preset_classic',
    title: 'Klassisch Staunton',
    subtitle: 'Standard Turnier',
    white: { styleId: 'classic' as PieceStyleId, glow: 'none' as PieceGlowEffect },
    black: { styleId: 'classic' as PieceStyleId, glow: 'none' as PieceGlowEffect },
  },
  {
    id: 'preset_royal',
    title: 'Kaisergold vs. Obsidian',
    subtitle: 'Prunkvoll & Episch',
    white: { styleId: 'royal' as PieceStyleId, primaryColor: '#fef08a', accentColor: '#ca8a04', glow: 'gold' as PieceGlowEffect },
    black: { styleId: 'royal' as PieceStyleId, primaryColor: '#1c1917', accentColor: '#eab308', glow: 'subtle' as PieceGlowEffect },
  },
  {
    id: 'preset_cyber',
    title: 'Cyberpunk Neon-Duell',
    subtitle: 'Cyan vs. Magenta',
    white: { styleId: 'cyber' as PieceStyleId, primaryColor: '#083344', accentColor: '#06b6d4', glow: 'cyan' as PieceGlowEffect },
    black: { styleId: 'cyber' as PieceStyleId, primaryColor: '#310022', accentColor: '#ec4899', glow: 'purple' as PieceGlowEffect },
  },
  {
    id: 'preset_woodcraft',
    title: 'Meister-Echtholz',
    subtitle: 'Ahorn & Walnuss',
    white: { styleId: 'wood' as PieceStyleId, primaryColor: '#fef3c7', accentColor: '#78350f', glow: 'none' as PieceGlowEffect },
    black: { styleId: 'wood' as PieceStyleId, primaryColor: '#451a03', accentColor: '#b45309', glow: 'none' as PieceGlowEffect },
  },
  {
    id: 'preset_crystal_shadow',
    title: 'Eiskristall vs. Blutglut',
    subtitle: 'Frost & Schattenfeuer',
    white: { styleId: 'crystal' as PieceStyleId, primaryColor: '#e0f2fe', accentColor: '#0284c7', glow: 'cyan' as PieceGlowEffect },
    black: { styleId: 'shadow' as PieceStyleId, primaryColor: '#09090b', accentColor: '#ef4444', glow: 'ruby' as PieceGlowEffect },
  },
];
