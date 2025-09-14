import { Position, Velocity, CarromPiece, Striker, GameBoard, Pocket, CollisionResult } from '@/types/game';

export class PhysicsEngine {
  private friction: number = 0.98;
  private restitution: number = 0.8;
  private minVelocity: number = 0.1;

  constructor(friction: number = 0.98, restitution: number = 0.8) {
    this.friction = friction;
    this.restitution = restitution;
  }

  // Update positions and velocities for all moving objects
  updatePhysics(pieces: CarromPiece[], striker: Striker, board: GameBoard, deltaTime: number): void {
    // Update striker
    if (striker.isActive && this.getVelocityMagnitude(striker.velocity) > this.minVelocity) {
      this.updateObject(striker, deltaTime);
      this.checkBoardCollisions(striker, board);
    } else if (striker.isActive) {
      striker.velocity = { x: 0, y: 0 };
      striker.isActive = false;
    }

    // Update pieces
    pieces.forEach(piece => {
      if (piece.isActive && !piece.isPocketed && this.getVelocityMagnitude(piece.velocity) > this.minVelocity) {
        this.updateObject(piece, deltaTime);
        this.checkBoardCollisions(piece, board);
      } else if (piece.isActive) {
        piece.velocity = { x: 0, y: 0 };
        piece.isActive = false;
      }
    });

    // Check collisions between all objects
    this.checkCollisions(pieces, striker);
    
    // Check pocket collisions
    this.checkPocketCollisions(pieces, striker, board.pockets);
  }

  private updateObject(obj: CarromPiece | Striker, deltaTime: number): void {
    // Apply friction
    obj.velocity.x *= this.friction;
    obj.velocity.y *= this.friction;

    // Update position
    obj.position.x += obj.velocity.x * deltaTime;
    obj.position.y += obj.velocity.y * deltaTime;
  }

  private checkBoardCollisions(obj: CarromPiece | Striker, board: GameBoard): void {
    const boardRadius = board.outerBoundary.radius;
    const center = board.outerBoundary.center;
    
    const distFromCenter = Math.sqrt(
      Math.pow(obj.position.x - center.x, 2) + 
      Math.pow(obj.position.y - center.y, 2)
    );

    if (distFromCenter + obj.radius > boardRadius) {
      // Calculate collision normal
      const normalX = (obj.position.x - center.x) / distFromCenter;
      const normalY = (obj.position.y - center.y) / distFromCenter;

      // Move object back inside board
      obj.position.x = center.x + normalX * (boardRadius - obj.radius);
      obj.position.y = center.y + normalY * (boardRadius - obj.radius);

      // Reflect velocity
      const dotProduct = obj.velocity.x * normalX + obj.velocity.y * normalY;
      obj.velocity.x = (obj.velocity.x - 2 * dotProduct * normalX) * this.restitution;
      obj.velocity.y = (obj.velocity.y - 2 * dotProduct * normalY) * this.restitution;
    }
  }

  private checkCollisions(pieces: CarromPiece[], striker: Striker): void {
    // Check striker vs pieces
    if (striker.isActive) {
      pieces.forEach(piece => {
        if (!piece.isPocketed) {
          const collision = this.detectCollision(striker, piece);
          if (collision.occurred) {
            this.resolveCollision(striker, piece, collision);
          }
        }
      });
    }

    // Check piece vs piece collisions
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const piece1 = pieces[i];
        const piece2 = pieces[j];
        
        if (!piece1.isPocketed && !piece2.isPocketed) {
          const collision = this.detectCollision(piece1, piece2);
          if (collision.occurred) {
            this.resolveCollision(piece1, piece2, collision);
          }
        }
      }
    }
  }

  private detectCollision(obj1: CarromPiece | Striker, obj2: CarromPiece | Striker): CollisionResult {
    const dx = obj2.position.x - obj1.position.x;
    const dy = obj2.position.y - obj1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = obj1.radius + obj2.radius;

    if (distance < minDistance) {
      const normalX = dx / distance;
      const normalY = dy / distance;
      return {
        occurred: true,
        point: {
          x: obj1.position.x + normalX * obj1.radius,
          y: obj1.position.y + normalY * obj1.radius
        },
        normal: { x: normalX, y: normalY },
        penetration: minDistance - distance
      };
    }

    return { occurred: false, point: { x: 0, y: 0 }, normal: { x: 0, y: 0 }, penetration: 0 };
  }

  private resolveCollision(obj1: CarromPiece | Striker, obj2: CarromPiece | Striker, collision: CollisionResult): void {
    // Separate objects
    const separationX = collision.normal.x * collision.penetration * 0.5;
    const separationY = collision.normal.y * collision.penetration * 0.5;
    
    obj1.position.x -= separationX;
    obj1.position.y -= separationY;
    obj2.position.x += separationX;
    obj2.position.y += separationY;

    // Calculate relative velocity
    const relativeVelocityX = obj2.velocity.x - obj1.velocity.x;
    const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
    
    // Calculate relative velocity in collision normal direction
    const velocityAlongNormal = relativeVelocityX * collision.normal.x + relativeVelocityY * collision.normal.y;
    
    // Don't resolve if velocities are separating
    if (velocityAlongNormal > 0) return;
    
    // Calculate impulse scalar (assuming equal mass)
    const impulse = -(1 + this.restitution) * velocityAlongNormal / 2;
    
    // Apply impulse
    const impulseX = impulse * collision.normal.x;
    const impulseY = impulse * collision.normal.y;
    
    obj1.velocity.x -= impulseX;
    obj1.velocity.y -= impulseY;
    obj2.velocity.x += impulseX;
    obj2.velocity.y += impulseY;
    
    // Activate both objects
    obj1.isActive = true;
    obj2.isActive = true;
  }

  private checkPocketCollisions(pieces: CarromPiece[], striker: Striker, pockets: Pocket[]): void {
    pockets.forEach(pocket => {
      // Check striker
      if (striker.isActive && this.isInPocket(striker.position, striker.radius, pocket)) {
        striker.isActive = false;
        striker.velocity = { x: 0, y: 0 };
        // Reset striker position (will be handled by game logic)
      }

      // Check pieces
      pieces.forEach(piece => {
        if (!piece.isPocketed && this.isInPocket(piece.position, piece.radius, pocket)) {
          piece.isPocketed = true;
          piece.isActive = false;
          piece.velocity = { x: 0, y: 0 };
        }
      });
    });
  }

  private isInPocket(position: Position, radius: number, pocket: Pocket): boolean {
    const distance = Math.sqrt(
      Math.pow(position.x - pocket.position.x, 2) + 
      Math.pow(position.y - pocket.position.y, 2)
    );
    return distance <= pocket.radius - radius * 0.3; // Piece must be mostly in pocket
  }

  private getVelocityMagnitude(velocity: Velocity): number {
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  // Calculate trajectory for AI assistance
  calculateTrajectory(
    startPosition: Position, 
    velocity: Velocity, 
    _pieces: CarromPiece[], 
    board: GameBoard,
    steps: number = 100
  ): Position[] {
    const trajectory: Position[] = [];
    const testStriker: Striker = {
      id: 'test',
      position: { ...startPosition },
      velocity: { ...velocity },
      radius: 15,
      isActive: true
    };

    const deltaTime = 16.67; // ~60fps simulation
    
    for (let i = 0; i < steps; i++) {
      trajectory.push({ ...testStriker.position });
      
      if (!testStriker.isActive || this.getVelocityMagnitude(testStriker.velocity) < this.minVelocity) {
        break;
      }
      
      this.updateObject(testStriker, deltaTime);
      this.checkBoardCollisions(testStriker, board);
    }
    
    return trajectory;
  }

  // Get optimal angle and power for hitting a target
  calculateOptimalShot(
    strikerPos: Position,
    targetPos: Position,
    board: GameBoard
  ): { angle: number; power: number; trajectory: Position[] } {
    const dx = targetPos.x - strikerPos.x;
    const dy = targetPos.y - strikerPos.y;
    const angle = Math.atan2(dy, dx);
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(Math.max(distance * 0.3, 200), 800); // Scale power based on distance
    
    const velocity: Velocity = {
      x: Math.cos(angle) * power,
      y: Math.sin(angle) * power
    };
    
    const trajectory = this.calculateTrajectory(strikerPos, velocity, [], board);
    
    return {
      angle: angle * 180 / Math.PI,
      power,
      trajectory
    };
  }
}