'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Position } from '@/types/game';

interface CarromBoardProps {
  gameState: GameState;
  onShot: (angle: number, power: number) => void;
  showTrajectory?: boolean;
  showAimGuide?: boolean;
  aiTrajectory?: Position[];
  className?: string;
}

export default function CarromBoard({
  gameState,
  onShot,
  showTrajectory = false,
  showAimGuide = false,
  aiTrajectory = [],
  className = ''
}: CarromBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<Position>({ x: 0, y: 0 });
  const [aimEnd, setAimEnd] = useState<Position>({ x: 0, y: 0 });
  const [shotPower, setShotPower] = useState(0);

  // Draw the game board
  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const { board } = gameState;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw board background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.7, '#D2691E');
    gradient.addColorStop(1, '#A0522D');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw outer boundary
    ctx.beginPath();
    ctx.arc(
      board.outerBoundary.center.x,
      board.outerBoundary.center.y,
      board.outerBoundary.radius,
      0,
      2 * Math.PI
    );
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(
      board.centerCircle.center.x,
      board.centerCircle.center.y,
      board.centerCircle.radius,
      0,
      2 * Math.PI
    );
    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw center lines for guidance
    ctx.beginPath();
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    
    // Horizontal center line
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    
    // Vertical center line
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw pockets
    board.pockets.forEach((pocket, index) => {
      const gradient = ctx.createRadialGradient(
        pocket.position.x, pocket.position.y, 0,
        pocket.position.x, pocket.position.y, pocket.radius
      );
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.7, '#1a1a1a');
      gradient.addColorStop(1, '#4A4A4A');
      
      ctx.beginPath();
      ctx.arc(pocket.position.x, pocket.position.y, pocket.radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add pocket labels
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`P${index + 1}`, pocket.position.x, pocket.position.y + 4);
    });
  }, [gameState]);

  // Draw game pieces
  const drawPieces = useCallback((ctx: CanvasRenderingContext2D) => {
    gameState.pieces.forEach(piece => {
      if (piece.isPocketed) return;
      
      // Create gradient for 3D effect
      const gradient = ctx.createRadialGradient(
        piece.position.x - piece.radius * 0.3,
        piece.position.y - piece.radius * 0.3,
        0,
        piece.position.x,
        piece.position.y,
        piece.radius
      );
      
      if (piece.color === 'white') {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.7, '#F5F5F5');
        gradient.addColorStop(1, '#D3D3D3');
      } else if (piece.color === 'black') {
        gradient.addColorStop(0, '#4A4A4A');
        gradient.addColorStop(0.7, '#2A2A2A');
        gradient.addColorStop(1, '#0A0A0A');
      } else { // red (queen)
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FF6347');
        gradient.addColorStop(1, '#DC143C');
      }
      
      // Draw piece shadow
      ctx.beginPath();
      ctx.arc(piece.position.x + 2, piece.position.y + 2, piece.radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
      
      // Draw piece
      ctx.beginPath();
      ctx.arc(piece.position.x, piece.position.y, piece.radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw piece border
      ctx.strokeStyle = piece.color === 'white' ? '#999999' : '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw queen symbol
      if (piece.color === 'red') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Q', piece.position.x, piece.position.y + 3);
      }
    });
  }, [gameState.pieces]);

  // Draw striker
  const drawStriker = useCallback((ctx: CanvasRenderingContext2D) => {
    const { striker } = gameState;
    
    // Create gradient for striker
    const gradient = ctx.createRadialGradient(
      striker.position.x - striker.radius * 0.3,
      striker.position.y - striker.radius * 0.3,
      0,
      striker.position.x,
      striker.position.y,
      striker.radius
    );
    gradient.addColorStop(0, '#FFE4B5');
    gradient.addColorStop(0.7, '#DEB887');
    gradient.addColorStop(1, '#CD853F');
    
    // Draw striker shadow
    ctx.beginPath();
    ctx.arc(striker.position.x + 2, striker.position.y + 2, striker.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    // Draw striker
    ctx.beginPath();
    ctx.arc(striker.position.x, striker.position.y, striker.radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw striker border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [gameState.striker]);

  // Draw AI trajectory
  const drawAITrajectory = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showTrajectory || aiTrajectory.length === 0) return;
    
    ctx.beginPath();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    
    aiTrajectory.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw trajectory points
    aiTrajectory.forEach((point, index) => {
      if (index % 5 === 0) { // Every 5th point
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF00';
        ctx.fill();
      }
    });
  }, [showTrajectory, aiTrajectory]);

  // Draw aim guide
  const drawAimGuide = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showAimGuide || !isAiming) return;
    
    const { striker } = gameState;
    const dx = aimEnd.x - aimStart.x;
    const dy = aimEnd.y - aimStart.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 200);
    
    // Draw power indicator
    const powerRadius = (distance / 200) * 50;
    ctx.beginPath();
    ctx.arc(striker.position.x, striker.position.y, powerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + (distance / 200) * 0.7})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw aim line
    const aimLength = 100 + distance;
    const endX = striker.position.x + Math.cos(angle) * aimLength;
    const endY = striker.position.y + Math.sin(angle) * aimLength;
    
    ctx.beginPath();
    ctx.moveTo(striker.position.x, striker.position.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw arrow head
    const arrowSize = 10;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }, [showAimGuide, isAiming, aimStart, aimEnd, gameState.striker]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawBoard(ctx);
    drawPieces(ctx);
    drawStriker(ctx);
    drawAITrajectory(ctx);
    drawAimGuide(ctx);
  }, [drawBoard, drawPieces, drawStriker, drawAITrajectory, drawAimGuide]);

  // Handle mouse/touch events
  const getEventPosition = (e: React.MouseEvent | React.TouchEvent): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.status !== 'playing' || gameState.striker.isActive) return;
    
    const pos = getEventPosition(e);
    setIsAiming(true);
    setAimStart(pos);
    setAimEnd(pos);
    setShotPower(0);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    
    const pos = getEventPosition(e);
    setAimEnd(pos);
    
    const dx = pos.x - aimStart.x;
    const dy = pos.y - aimStart.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) * 4, 1000);
    setShotPower(power);
  };

  const handlePointerUp = () => {
    if (!isAiming) return;
    
    const dx = aimEnd.x - aimStart.x;
    const dy = aimEnd.y - aimStart.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    if (shotPower > 50) { // Minimum power threshold
      onShot(angle, shotPower);
    }
    
    setIsAiming(false);
    setShotPower(0);
  };

  // Animation loop
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      render();
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [render]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full h-auto max-w-2xl mx-auto border-4 border-amber-800 rounded-lg shadow-2xl cursor-crosshair bg-gradient-to-br from-amber-100 to-orange-200"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
      
      {/* Power indicator */}
      {isAiming && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
          <div className="text-center">
            <div className="text-sm font-semibold">Power: {Math.round(shotPower)}</div>
            <div className="w-32 h-2 bg-gray-600 rounded-full mt-1">
              <div
                className="h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all duration-150"
                style={{ width: `${Math.min(shotPower / 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Game status overlay */}
      {gameState.status !== 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <h3 className="text-xl font-bold mb-2">
              {gameState.status === 'waiting' && 'Game Ready'}
              {gameState.status === 'paused' && 'Game Paused'}
              {gameState.status === 'finished' && 'Game Finished'}
            </h3>
            {gameState.status === 'finished' && gameState.winner && (
              <p className="text-gray-600">
                Winner: {gameState.players.find(p => p.id === gameState.winner)?.name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}