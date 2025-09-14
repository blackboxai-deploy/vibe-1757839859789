'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameState, Player } from '@/types/game';

interface GameControlsProps {
  gameState: GameState;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResetGame: () => void;
  className?: string;
}

export default function GameControls({
  gameState,
  onStartGame,
  onPauseGame,
  onResetGame,
  className = ''
}: GameControlsProps) {


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'playing': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'finished': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlayerPieces = (color: 'white' | 'black') => {
    return gameState.pieces.filter(p => p.color === color && !p.isPocketed);
  };

  const getTotalPieces = (color: 'white' | 'black') => {
    return gameState.pieces.filter(p => p.color === color).length;
  };

  const getPlayerProgress = (player: Player) => {
    const remainingPieces = getPlayerPieces(player.color).length;
    const totalPieces = getTotalPieces(player.color);
    return ((totalPieces - remainingPieces) / totalPieces) * 100;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Game Status */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold">Game Status</span>
              <Badge className={getStatusColor(gameState.status)}>
                {gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1)}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              Turn {gameState.turn}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {gameState.status === 'waiting' && (
              <Button onClick={onStartGame} size="sm" className="bg-green-600 hover:bg-green-700">
                Start Game
              </Button>
            )}
            
            {gameState.status === 'playing' && (
              <Button onClick={onPauseGame} size="sm" variant="outline">
                Pause Game
              </Button>
            )}
            
            {gameState.status === 'paused' && (
              <Button onClick={onPauseGame} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Resume Game
              </Button>
            )}
            
            <Button onClick={onResetGame} size="sm" variant="outline">
              Reset Game
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Players & Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gameState.players.map((player) => {
            const isCurrentPlayer = player.id === gameState.currentPlayer;
            const remainingPieces = getPlayerPieces(player.color).length;
            const progress = getPlayerProgress(player);
            
            return (
              <div 
                key={player.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isCurrentPlayer 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-4 h-4 rounded-full border-2 ${
                          player.color === 'white' 
                            ? 'bg-white border-gray-400' 
                            : 'bg-gray-800 border-gray-600'
                        }`}
                      />
                      <span className="font-semibold text-gray-800">{player.name}</span>
                      {player.isAI && (
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                          AI
                        </Badge>
                      )}
                    </div>
                    {isCurrentPlayer && (
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                        Current Turn
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{player.score}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pieces Remaining</span>
                    <span className="font-medium">{remainingPieces}</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={`h-2 ${
                      player.color === 'white' ? 'bg-gray-200' : 'bg-gray-300'
                    }`}
                  />
                </div>

                {/* Player Stats */}
                <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-700">{Math.round(progress)}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700">
                      {gameState.shots.filter(s => s.playerId === player.id).length}
                    </div>
                    <div className="text-xs text-gray-500">Shots</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700">
                      {gameState.shots
                        .filter(s => s.playerId === player.id)
                        .reduce((sum, shot) => sum + shot.outcome.piecesPocketed.length, 0)
                      }
                    </div>
                    <div className="text-xs text-gray-500">Pocketed</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Queen Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
              Q
            </div>
            <span>Queen Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <Badge 
              className={
                gameState.queen.isPocketed 
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              }
            >
              {gameState.queen.isPocketed ? 'Pocketed' : 'On Board'}
            </Badge>
          </div>
          {gameState.queen.isPocketed && gameState.queen.coveredBy && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-600">Covered by:</span>
              <span className="font-medium">
                {gameState.players.find(p => p.id === gameState.queen.coveredBy)?.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Game Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {gameState.pieces.filter(p => !p.isPocketed).length}
              </div>
              <div className="text-xs text-blue-800">Pieces Remaining</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {gameState.pieces.filter(p => p.isPocketed).length}
              </div>
              <div className="text-xs text-green-800">Pieces Pocketed</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{gameState.shots.length}</div>
              <div className="text-xs text-purple-800">Total Shots</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">
                {gameState.shots.filter(s => s.outcome.foul).length}
              </div>
              <div className="text-xs text-orange-800">Fouls</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Winner */}
      {gameState.status === 'finished' && gameState.winner && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="text-center py-6">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Game Complete!</h3>
            <div className="text-lg text-gray-700">
              Winner: <span className="font-bold text-yellow-600">
                {gameState.players.find(p => p.id === gameState.winner)?.name}
              </span>
            </div>
            <div className="mt-4">
              <Button onClick={onResetGame} className="bg-green-600 hover:bg-green-700">
                Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}