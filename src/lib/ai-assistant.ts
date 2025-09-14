import { Position, CarromPiece, Striker, GameBoard, GameState, AIAnalysis, AIAssistantSettings } from '@/types/game';
import { PhysicsEngine } from './physics-engine';

export class AIAssistant {
  private physicsEngine: PhysicsEngine;
  private settings: AIAssistantSettings;

  constructor(settings: AIAssistantSettings) {
    this.physicsEngine = new PhysicsEngine();
    this.settings = settings;
  }

  // Analyze current game state and provide AI recommendations
  analyzeGameState(gameState: GameState): AIAnalysis {
    const { pieces, striker, board, currentPlayer } = gameState;
    const currentPlayerData = gameState.players.find(p => p.id === currentPlayer);
    
    if (!currentPlayerData) {
      return this.getDefaultAnalysis();
    }

    const playerColor = currentPlayerData.color;
    const playerPieces = pieces.filter(p => p.color === playerColor && !p.isPocketed);
    const opponentPieces = pieces.filter(p => p.color !== playerColor && p.color !== 'red' && !p.isPocketed);
    const queen = pieces.find(p => p.color === 'red' && !p.isPocketed);

    // Calculate best shot options
    const shotOptions = this.calculateBestShots(striker, playerPieces, opponentPieces, queen, board);
    const bestShot = shotOptions[0];

    // Calculate trajectory for the best shot
    const trajectory = this.physicsEngine.calculateTrajectory(
      striker.position,
      {
        x: Math.cos(bestShot.angle * Math.PI / 180) * bestShot.power,
        y: Math.sin(bestShot.angle * Math.PI / 180) * bestShot.power
      },
      pieces,
      board
    );

    // Determine difficulty
    const difficulty = this.calculateShotDifficulty(bestShot, striker.position, pieces, board);

    // Generate alternative shots
    const alternatives = shotOptions.slice(1, 4).map(shot => ({
      angle: shot.angle,
      power: shot.power,
      successProbability: shot.successProbability,
      description: shot.description
    }));

    return {
      recommendedShot: {
        angle: bestShot.angle,
        power: bestShot.power,
        targetPiece: bestShot.targetPiece
      },
      trajectory,
      difficulty,
      successProbability: bestShot.successProbability,
      alternativeShots: alternatives
    };
  }

  private calculateBestShots(
    striker: Striker,
    playerPieces: CarromPiece[],
    opponentPieces: CarromPiece[],
    queen: CarromPiece | undefined,
    board: GameBoard
  ): Array<{
    angle: number;
    power: number;
    successProbability: number;
    description: string;
    targetPiece?: string;
    score: number;
  }> {
    const shots: Array<{
      angle: number;
      power: number;
      successProbability: number;
      description: string;
      targetPiece?: string;
      score: number;
    }> = [];

    // Priority 1: Pocket own pieces
    playerPieces.forEach(piece => {
      const pocketShots = this.calculatePocketingShots(striker, piece, board);
      pocketShots.forEach(shot => {
        shots.push({
          ...shot,
          description: `Pocket ${piece.color} piece`,
          targetPiece: piece.id,
          score: shot.successProbability * 100 + 50 // High priority for own pieces
        });
      });
    });

    // Priority 2: Pocket the queen (if advantageous)
    if (queen) {
      const queenShots = this.calculatePocketingShots(striker, queen, board);
      queenShots.forEach(shot => {
        shots.push({
          ...shot,
          description: 'Pocket the Queen',
          targetPiece: queen.id,
          score: shot.successProbability * 80 + 40 // High priority but risky
        });
      });
    }

    // Priority 3: Strategic positioning shots
    const positioningShots = this.calculatePositioningShots(striker, playerPieces, opponentPieces, board);
    positioningShots.forEach(shot => {
      shots.push({
        ...shot,
        description: 'Strategic positioning',
        score: shot.successProbability * 60 + 20
      });
    });

    // Priority 4: Defensive shots (block opponent)
    if (opponentPieces.length > 0) {
      const defensiveShots = this.calculateDefensiveShots(striker, opponentPieces, board);
      defensiveShots.forEach(shot => {
        shots.push({
          ...shot,
          description: 'Defensive play',
          score: shot.successProbability * 40 + 10
        });
      });
    }

    // Sort by score and return top options
    return shots.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private calculatePocketingShots(striker: Striker, targetPiece: CarromPiece, board: GameBoard): Array<{
    angle: number;
    power: number;
    successProbability: number;
  }> {
    const shots: Array<{
      angle: number;
      power: number;
      successProbability: number;
    }> = [];

    // For each pocket, calculate the angle needed to hit the piece into that pocket
    board.pockets.forEach(pocket => {
      const pocketAngle = Math.atan2(
        pocket.position.y - targetPiece.position.y,
        pocket.position.x - targetPiece.position.x
      );

      // Calculate the angle to hit the piece toward the pocket
      const dx = targetPiece.position.x - striker.position.x;
      const dy = targetPiece.position.y - striker.position.y;
      const strikerToTarget = Math.atan2(dy, dx);

      // Simple approximation - more complex physics would be better
      const requiredAngle = strikerToTarget;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(Math.max(distance * 0.4, 250), 900);

      // Calculate success probability based on distance, angle difficulty, and obstacles
      const distanceToPocket = Math.sqrt(
        Math.pow(targetPiece.position.x - pocket.position.x, 2) +
        Math.pow(targetPiece.position.y - pocket.position.y, 2)
      );

      let successProbability = Math.max(0.1, 1 - (distance / 500) - (distanceToPocket / 400));
      
      // Adjust based on angle difficulty
      const angleDifference = Math.abs(requiredAngle - pocketAngle);
      successProbability *= Math.max(0.3, 1 - angleDifference / Math.PI);

      shots.push({
        angle: requiredAngle * 180 / Math.PI,
        power,
        successProbability: Math.min(0.95, successProbability)
      });
    });

    return shots.filter(shot => shot.successProbability > 0.2).slice(0, 2);
  }

  private calculatePositioningShots(
    striker: Striker,
    playerPieces: CarromPiece[],
    _opponentPieces: CarromPiece[],
    _board: GameBoard
  ): Array<{
    angle: number;
    power: number;
    successProbability: number;
  }> {
    const shots: Array<{
      angle: number;
      power: number;
      successProbability: number;
    }> = [];

    // Find clusters of own pieces and try to break them
    if (playerPieces.length > 1) {
      const clusterCenter = this.findClusterCenter(playerPieces);
      const angle = Math.atan2(
        clusterCenter.y - striker.position.y,
        clusterCenter.x - striker.position.x
      );

      shots.push({
        angle: angle * 180 / Math.PI,
        power: 400,
        successProbability: 0.7
      });
    }

    // Try to create favorable positions
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    
    angles.forEach(angle => {
      shots.push({
        angle,
        power: 300 + Math.random() * 200,
        successProbability: 0.6 + Math.random() * 0.2
      });
    });

    return shots.slice(0, 3);
  }

  private calculateDefensiveShots(
    striker: Striker,
    opponentPieces: CarromPiece[],
    board: GameBoard
  ): Array<{
    angle: number;
    power: number;
    successProbability: number;
  }> {
    const shots: Array<{
      angle: number;
      power: number;
      successProbability: number;
    }> = [];

    // Find opponent pieces near pockets and try to move them away
    opponentPieces.forEach(piece => {
      board.pockets.forEach(pocket => {
        const distanceToPocket = Math.sqrt(
          Math.pow(piece.position.x - pocket.position.x, 2) +
          Math.pow(piece.position.y - pocket.position.y, 2)
        );

        if (distanceToPocket < 100) { // If opponent piece is close to pocket
          const angle = Math.atan2(
            piece.position.y - striker.position.y,
            piece.position.x - striker.position.x
          );

          shots.push({
            angle: angle * 180 / Math.PI,
            power: 350,
            successProbability: 0.5
          });
        }
      });
    });

    return shots.slice(0, 2);
  }

  private findClusterCenter(pieces: CarromPiece[]): Position {
    const totalX = pieces.reduce((sum, piece) => sum + piece.position.x, 0);
    const totalY = pieces.reduce((sum, piece) => sum + piece.position.y, 0);
    
    return {
      x: totalX / pieces.length,
      y: totalY / pieces.length
    };
  }

  private calculateShotDifficulty(
    shot: { angle: number; power: number; successProbability: number },
    _strikerPos: Position,
    _pieces: CarromPiece[],
    _board: GameBoard
  ): 'easy' | 'medium' | 'hard' | 'expert' {
    const { successProbability } = shot;
    
    // Base difficulty on success probability
    if (successProbability > 0.8) return 'easy';
    if (successProbability > 0.6) return 'medium';
    if (successProbability > 0.4) return 'hard';
    return 'expert';
  }

  private getDefaultAnalysis(): AIAnalysis {
    return {
      recommendedShot: {
        angle: 0,
        power: 400,
      },
      trajectory: [],
      difficulty: 'medium',
      successProbability: 0.5,
      alternativeShots: []
    };
  }

  // Generate auto-play move
  generateAutoPlayMove(gameState: GameState): { angle: number; power: number } {
    const analysis = this.analyzeGameState(gameState);
    
    // Add some randomness based on assistance level
    let angleVariation = 0;
    let powerVariation = 0;

    switch (this.settings.assistanceLevel) {
      case 'beginner':
        angleVariation = 10;
        powerVariation = 50;
        break;
      case 'intermediate':
        angleVariation = 5;
        powerVariation = 25;
        break;
      case 'advanced':
        angleVariation = 2;
        powerVariation = 10;
        break;
      case 'expert':
        angleVariation = 0.5;
        powerVariation = 5;
        break;
    }

    const angle = analysis.recommendedShot.angle + (Math.random() - 0.5) * angleVariation;
    const power = analysis.recommendedShot.power + (Math.random() - 0.5) * powerVariation;

    return {
      angle: Math.max(0, Math.min(360, angle)),
      power: Math.max(100, Math.min(1000, power))
    };
  }

  // Update settings
  updateSettings(newSettings: Partial<AIAssistantSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Get current settings
  getSettings(): AIAssistantSettings {
    return { ...this.settings };
  }
}