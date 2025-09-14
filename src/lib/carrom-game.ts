import { GameState, CarromPiece, Striker, Player, GameBoard, GameSettings, Shot, AIAssistantSettings } from '@/types/game';
import { PhysicsEngine } from './physics-engine';
import { AIAssistant } from './ai-assistant';

export class CarromGame {
  private gameState: GameState;
  private physicsEngine: PhysicsEngine;
  private aiAssistant: AIAssistant;
  private settings: GameSettings;
  private gameLoop: number | null = null;
  private onStateUpdate?: (state: GameState) => void;

  constructor(settings: GameSettings, onStateUpdate?: (state: GameState) => void) {
    this.settings = settings;
    this.onStateUpdate = onStateUpdate;
    this.physicsEngine = new PhysicsEngine(
      settings.physics.friction,
      settings.physics.restitution
    );
    this.aiAssistant = new AIAssistant(settings.aiAssistant);
    this.gameState = this.initializeGame();
  }

  private initializeGame(): GameState {
    const board = this.createBoard();
    const pieces = this.createPieces();
    const striker = this.createStriker();
    const players = this.createPlayers();

    return {
      id: `game_${Date.now()}`,
      status: 'waiting',
      currentPlayer: players[0].id,
      players,
      pieces,
      striker,
      board,
      shots: [],
      turn: 1,
      queen: {
        isPocketed: false
      }
    };
  }

  private createBoard(): GameBoard {
    const boardSize = 600;
    const pocketRadius = 35;
    const pocketOffset = 50;

    return {
      width: boardSize,
      height: boardSize,
      centerCircle: {
        center: { x: boardSize / 2, y: boardSize / 2 },
        radius: 60
      },
      outerBoundary: {
        center: { x: boardSize / 2, y: boardSize / 2 },
        radius: boardSize / 2 - 20
      },
      pockets: [
        { id: 'p1', position: { x: pocketOffset, y: pocketOffset }, radius: pocketRadius },
        { id: 'p2', position: { x: boardSize - pocketOffset, y: pocketOffset }, radius: pocketRadius },
        { id: 'p3', position: { x: boardSize - pocketOffset, y: boardSize - pocketOffset }, radius: pocketRadius },
        { id: 'p4', position: { x: pocketOffset, y: boardSize - pocketOffset }, radius: pocketRadius }
      ]
    };
  }

  private createPieces(): CarromPiece[] {
    const pieces: CarromPiece[] = [];
    const center = { x: 300, y: 300 };
    const pieceRadius = 12;
    
    // Create arrangement in center circle
    const positions = [
      { x: 0, y: 0 }, // Queen in center
      { x: -25, y: 0 }, { x: 25, y: 0 }, // White pieces
      { x: 0, y: -25 }, { x: 0, y: 25 }, // White pieces
      { x: -18, y: -18 }, { x: 18, y: -18 }, // Black pieces
      { x: -18, y: 18 }, { x: 18, y: 18 }, // Black pieces
      { x: -35, y: -12 }, { x: 35, y: -12 }, // White pieces
      { x: -35, y: 12 }, { x: 35, y: 12 }, // White pieces
      { x: -12, y: -35 }, { x: 12, y: -35 }, // Black pieces
      { x: -12, y: 35 }, { x: 12, y: 35 }, // Black pieces
      { x: -28, y: -28 }, { x: 28, y: 28 }, // Additional pieces
      { x: -28, y: 28 }, { x: 28, y: -28 }
    ];

    positions.forEach((pos, index) => {
      let color: 'white' | 'black' | 'red';
      if (index === 0) {
        color = 'red'; // Queen
      } else if (index % 2 === 1) {
        color = 'white';
      } else {
        color = 'black';
      }

      pieces.push({
        id: `piece_${index}`,
        position: { x: center.x + pos.x, y: center.y + pos.y },
        velocity: { x: 0, y: 0 },
        color,
        radius: pieceRadius,
        isActive: false,
        isPocketed: false
      });
    });

    return pieces;
  }

  private createStriker(): Striker {
    return {
      id: 'striker',
      position: { x: 300, y: 500 }, // Start at bottom
      velocity: { x: 0, y: 0 },
      radius: 15,
      isActive: false
    };
  }

  private createPlayers(): Player[] {
    const players: Player[] = [
      {
        id: 'player1',
        name: 'Player 1',
        score: 0,
        color: 'white',
        isAI: false
      }
    ];

    if (this.settings.gameMode === 'single-player') {
      players.push({
        id: 'ai',
        name: 'AI Assistant',
        score: 0,
        color: 'black',
        isAI: true
      });
    }

    return players;
  }

  // Start the game
  startGame(): void {
    this.gameState.status = 'playing';
    this.startGameLoop();
    this.notifyStateUpdate();
  }

  // Pause/resume the game
  pauseGame(): void {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
      this.stopGameLoop();
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'playing';
      this.startGameLoop();
    }
    this.notifyStateUpdate();
  }

  // Make a shot
  makeShot(angle: number, power: number): void {
    if (this.gameState.status !== 'playing' || this.gameState.striker.isActive) {
      return;
    }

    const angleRad = (angle * Math.PI) / 180;
    const velocity = {
      x: Math.cos(angleRad) * power,
      y: Math.sin(angleRad) * power
    };

    this.gameState.striker.velocity = velocity;
    this.gameState.striker.isActive = true;

    // Record the shot
    const shot: Shot = {
      id: `shot_${Date.now()}`,
      playerId: this.gameState.currentPlayer,
      timestamp: Date.now(),
      strikerPosition: { ...this.gameState.striker.position },
      angle,
      power,
      outcome: {
        piecesHit: [],
        piecesPocketed: [],
        strikerPocketed: false,
        points: 0,
        foul: false
      }
    };

    this.gameState.shots.push(shot);
    this.notifyStateUpdate();
  }

  // Auto-play for AI turn
  makeAIMove(): void {
    if (this.gameState.status !== 'playing') return;

    const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayer);
    if (!currentPlayer?.isAI) return;

    const aiMove = this.aiAssistant.generateAutoPlayMove(this.gameState);
    
    // Add slight delay for realism
    setTimeout(() => {
      this.makeShot(aiMove.angle, aiMove.power);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  }

  // Get AI analysis for current state
  getAIAnalysis(): any {
    return this.aiAssistant.analyzeGameState(this.gameState);
  }

  // Update AI assistant settings
  updateAISettings(settings: Partial<AIAssistantSettings>): void {
    this.aiAssistant.updateSettings(settings);
  }

  private startGameLoop(): void {
    if (this.gameLoop) return;

    const update = () => {
      this.updatePhysics();
      this.checkTurnCompletion();
      
      if (this.gameState.status === 'playing') {
        this.gameLoop = requestAnimationFrame(update);
      }
    };

    this.gameLoop = requestAnimationFrame(update);
  }

  private stopGameLoop(): void {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }

  private updatePhysics(): void {
    const deltaTime = 16.67; // ~60fps
    this.physicsEngine.updatePhysics(
      this.gameState.pieces,
      this.gameState.striker,
      this.gameState.board,
      deltaTime
    );

    this.notifyStateUpdate();
  }

  private checkTurnCompletion(): void {
    // Check if all objects have stopped moving
    const allStopped = !this.gameState.striker.isActive && 
      this.gameState.pieces.every(piece => !piece.isActive || piece.isPocketed);

    if (allStopped && this.gameState.shots.length > 0) {
      this.completeTurn();
    }
  }

  private completeTurn(): void {
    const lastShot = this.gameState.shots[this.gameState.shots.length - 1];
    if (!lastShot) return;

    // Calculate turn outcome
    const outcome = this.calculateTurnOutcome();
    lastShot.outcome = outcome;

    // Update scores
    this.updateScores(outcome);

    // Check for game end
    if (this.checkGameEnd()) {
      this.endGame();
      return;
    }

    // Switch turns if no pieces were pocketed or if it was a foul
    if (outcome.piecesPocketed.length === 0 || outcome.foul) {
      this.switchTurn();
    }

    // Reset striker position
    this.resetStriker();

    // If next player is AI, trigger AI move
    const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayer);
    if (currentPlayer?.isAI) {
      this.makeAIMove();
    }

    this.notifyStateUpdate();
  }

  private calculateTurnOutcome(): Shot['outcome'] {
    const piecesHit: string[] = [];
    const piecesPocketed: string[] = [];
    let points = 0;
    let foul = false;

    // Find pocketed pieces since last turn
    this.gameState.pieces.forEach(piece => {
      if (piece.isPocketed) {
        piecesPocketed.push(piece.id);
        
        // Award points based on piece type
        if (piece.color === 'red') {
          points += 3; // Queen
        } else {
          points += 1; // Regular piece
        }
      }
    });

    // Check for fouls
    const strikerPocketed = !this.gameState.striker.isActive && this.isStrikerInPocket();
    if (strikerPocketed) {
      foul = true;
      points = -1; // Penalty
    }

    return {
      piecesHit,
      piecesPocketed,
      strikerPocketed,
      points,
      foul
    };
  }

  private isStrikerInPocket(): boolean {
    return this.gameState.board.pockets.some(pocket => {
      const distance = Math.sqrt(
        Math.pow(this.gameState.striker.position.x - pocket.position.x, 2) +
        Math.pow(this.gameState.striker.position.y - pocket.position.y, 2)
      );
      return distance <= pocket.radius;
    });
  }

  private updateScores(outcome: Shot['outcome']): void {
    const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayer);
    if (currentPlayer) {
      currentPlayer.score += outcome.points;
      
      // Ensure score doesn't go negative
      if (currentPlayer.score < 0) {
        currentPlayer.score = 0;
      }
    }
  }

  private checkGameEnd(): boolean {
    const activePieces = this.gameState.pieces.filter(p => !p.isPocketed);
    const whiteActivePieces = activePieces.filter(p => p.color === 'white');
    const blackActivePieces = activePieces.filter(p => p.color === 'black');

    // Game ends when one player has pocketed all their pieces
    return whiteActivePieces.length === 0 || blackActivePieces.length === 0;
  }

  private endGame(): void {
    this.gameState.status = 'finished';
    
    // Determine winner
    const [player1, player2] = this.gameState.players;
    if (player1 && player2) {
      if (player1.score > player2.score) {
        this.gameState.winner = player1.id;
      } else if (player2.score > player1.score) {
        this.gameState.winner = player2.id;
      }
      // Draw if scores are equal
    }

    this.stopGameLoop();
    this.notifyStateUpdate();
  }

  private switchTurn(): void {
    const currentIndex = this.gameState.players.findIndex(p => p.id === this.gameState.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.gameState.players.length;
    this.gameState.currentPlayer = this.gameState.players[nextIndex].id;
    this.gameState.turn++;
  }

  private resetStriker(): void {
    this.gameState.striker.position = { x: 300, y: 500 };
    this.gameState.striker.velocity = { x: 0, y: 0 };
    this.gameState.striker.isActive = false;
  }

  private notifyStateUpdate(): void {
    if (this.onStateUpdate) {
      this.onStateUpdate({ ...this.gameState });
    }
  }

  // Public getters
  getGameState(): GameState {
    return { ...this.gameState };
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update physics engine if physics settings changed
    if (newSettings.physics) {
      this.physicsEngine = new PhysicsEngine(
        this.settings.physics.friction,
        this.settings.physics.restitution
      );
    }
    
    // Update AI assistant if AI settings changed
    if (newSettings.aiAssistant) {
      this.aiAssistant.updateSettings(newSettings.aiAssistant);
    }
  }

  // Cleanup
  destroy(): void {
    this.stopGameLoop();
  }
}