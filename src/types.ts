export type PlayerColor = 'w' | 'b';

export type GameMode = 'pvai' | 'aivsai' | 'pvp' | 'online';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  piece: PieceType;
  color: PlayerColor;
  captured?: PieceType;
  promotion?: PieceType;
  fenAfter: string;
}

export type BoardTheme = 'green' | 'wood' | 'blue' | 'amber' | 'emerald' | 'charcoal';

export type PieceStyleId =
  | 'classic'
  | 'royal'
  | 'cyber'
  | 'wood'
  | 'crystal'
  | 'shadow'
  | 'emerald'
  | 'minimal';

export type PieceGlowEffect = 'none' | 'subtle' | 'gold' | 'cyan' | 'ruby' | 'purple';

export interface PlayerPieceCustomization {
  styleId: PieceStyleId;
  primaryColor?: string; // custom fill hex (optional)
  accentColor?: string; // custom stroke or detail hex (optional)
  glow: PieceGlowEffect;
}

export type ArmySetupType =
  | 'standard'
  | 'custom'
  | 'queen_odds_white'
  | 'queen_odds_black'
  | 'rook_odds_black'
  | 'knight_squad'
  | 'pawn_rush';

export interface CustomArmyPreset {
  id: string;
  name: string;
  fen: string;
  description?: string;
  createdAt: number;
  whitePiecesCount: number;
  blackPiecesCount: number;
  turn: PlayerColor;
}

export interface PieceCustomizationState {
  enabled: boolean; // false = Regular (Standard FIDE), true = Custom
  white: PlayerPieceCustomization;
  black: PlayerPieceCustomization;
  armySetup: ArmySetupType;
  customFen?: string;
  customPresetName?: string;
  selectedPresetId?: string;
}

export type EnemyDifficulty =
  | 'Anfänger'
  | 'Fortgeschritten'
  | 'Taktiker'
  | 'Meister'
  | 'Großmeister'
  | 'Novice'
  | 'Intermediate'
  | 'Tactician'
  | 'Master'
  | 'Neural AI';

export interface AIEnemy {
  id: string;
  name: string;
  title: string;
  rating: number;
  difficulty: EnemyDifficulty;
  avatar: string; // SVG icon or distinct stylized avatar key
  avatarBg: string;
  themeColor: string; // Tailwind color name like emerald, amber, purple, rose, cyan
  borderColor: string;
  bio: string;
  persona: string;
  playStyle: string;
  engineDepth: number; // Search depth for minimax
  blunderRate: number; // 0.0 to 1.0 (probability of picking a sub-optimal move)
  greedMultiplier: number; // weight of taking pieces vs positional play
  centerControlWeight: number; // weight of controlling center squares
  kingSafetyWeight: number; // weight of protecting king
  taunts: {
    start: string[];
    playerAdvantage: string[];
    enemyAdvantage: string[];
    playerCheck: string[];
    enemyCheck: string[];
    capturedGoodPiece: string[];
    lostPiece: string[];
    defeat: string[];
    victory: string[];
  };
}

export interface CapturedPieces {
  w: PieceType[];
  b: PieceType[];
}

export interface GameSettings {
  playerColor: PlayerColor;
  timeControl: number | null; // minutes or null for infinite
  soundEnabled: boolean;
  showLegalMoves: boolean;
  autoFlip: boolean;
  aiThinkingDelayMs: number;
}

export interface EvaluationResult {
  score: number; // in centipawns (+ for white, - for black)
  mate?: number; // moves to mate if detected
  bestMove?: { from: string; to: string; promotion?: string };
}

export type OpeningCategory =
  | 'all'
  | 'open'
  | 'semi-open'
  | 'closed'
  | 'indian'
  | 'flank'
  | 'gambit';

export interface ChessOpening {
  id: string;
  name: string;
  eco: string;
  category: OpeningCategory;
  categoryLabel: string;
  moves: string[]; // SAN sequence, e.g. ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']
  description: string;
  style: 'Taktisch' | 'Positional' | 'Scharf' | 'Solide' | 'Aggressiv';
  preferredEnemies?: string[]; // IDs of AI enemies who prefer this opening
}

export interface OnlinePlayer {
  id: string;
  name: string;
  color?: PlayerColor;
  assignedColor?: PlayerColor;
  isHost: boolean;
  connected: boolean;
  ready: boolean;
}

export type LobbyStatus = 'waiting' | 'drawing_color' | 'playing' | 'game_over';

export interface OnlineLobbyData {
  id?: string;
  roomCode: string;
  hostId: string;
  players: Record<string, OnlinePlayer>;
  status: LobbyStatus;
  fen: string;
  history: MoveRecord[];
  moves?: MoveRecord[];
  turn: PlayerColor;
  currentTurn?: PlayerColor;
  lastMove?: { from: string; to: string; san?: string; captured?: PieceType };
  capturedPieces: CapturedPieces;
  inCheck: boolean;
  winner?: PlayerColor | 'draw' | null;
  winReason?: string;
  gameOverReason?: string;
  rematchRequestedBy?: string[];
  drawOfferedBy?: string | null;
  drawLottery?: {
    player1Id: string;
    player2Id: string;
    player1Color: PlayerColor;
    player2Color: PlayerColor;
    finishedAt: number;
  };
  createdAt?: number;
  lastActive?: number;
}

export interface OnlineChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

