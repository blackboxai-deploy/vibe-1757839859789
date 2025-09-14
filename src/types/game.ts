// Game type definitions for Carrom game with AI assistant

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface CarromPiece {
  id: string;
  position: Position;
  velocity: Velocity;
  color: 'white' | 'black' | 'red';
  radius: number;
  isActive: boolean;
  isPocketed: boolean;
}

export interface Striker {
  id: string;
  position: Position;
  velocity: Velocity;
  radius: number;
  isActive: boolean;
}

export interface Pocket {
  id: string;
  position: Position;
  radius: number;
}

export interface GameBoard {
  width: number;
  height: number;
  pockets: Pocket[];
  centerCircle: {
    center: Position;
    radius: number;
  };
  outerBoundary: {
    center: Position;
    radius: number;
  };
}

export interface Player {
  id: string;
  name: string;
  score: number;
  color: 'white' | 'black';
  isAI: boolean;
}

export interface Shot {
  id: string;
  playerId: string;
  timestamp: number;
  strikerPosition: Position;
  angle: number;
  power: number;
  outcome: {
    piecesHit: string[];
    piecesPocketed: string[];
    strikerPocketed: boolean;
    points: number;
    foul: boolean;
  };
}

export interface AIAnalysis {
  recommendedShot: {
    angle: number;
    power: number;
    targetPiece?: string;
  };
  trajectory: Position[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  successProbability: number;
  alternativeShots: Array<{
    angle: number;
    power: number;
    successProbability: number;
    description: string;
  }>;
}

export interface AIAssistantSettings {
  enabled: boolean;
  showTrajectory: boolean;
  showAimGuide: boolean;
  autoPlay: boolean;
  assistanceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  showShotSuggestions: boolean;
  showDifficultyRating: boolean;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  currentPlayer: string;
  players: Player[];
  pieces: CarromPiece[];
  striker: Striker;
  board: GameBoard;
  shots: Shot[];
  turn: number;
  queen: {
    isPocketed: boolean;
    coveredBy?: string;
  };
  winner?: string;
  aiAnalysis?: AIAnalysis;
}

export interface GameSettings {
  gameMode: 'practice' | 'single-player' | 'multiplayer';
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  aiAssistant: AIAssistantSettings;
  physics: {
    friction: number;
    restitution: number;
    gravity: number;
  };
  visuals: {
    theme: 'classic' | 'modern' | 'neon';
    showGrid: boolean;
    showAngles: boolean;
    showVelocity: boolean;
  };
}

export interface GameEvents {
  onPieceHit: (pieceId: string) => void;
  onPiecePocketed: (pieceId: string) => void;
  onStrikerPocketed: () => void;
  onTurnComplete: (shot: Shot) => void;
  onGameComplete: (winner: Player) => void;
  onFoul: (foulType: string) => void;
}

export interface CollisionResult {
  occurred: boolean;
  point: Position;
  normal: Position;
  penetration: number;
}

export interface PhysicsWorld {
  pieces: CarromPiece[];
  striker: Striker;
  board: GameBoard;
  gravity: number;
  friction: number;
  restitution: number;
}