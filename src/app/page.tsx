'use client';

import { useState, useEffect, useCallback } from 'react';
import CarromBoard from '@/components/CarromBoard';
import AIAssistant from '@/components/AIAssistant';
import GameControls from '@/components/GameControls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarromGame } from '@/lib/carrom-game';
import { GameState, GameSettings, AIAssistantSettings, AIAnalysis } from '@/types/game';

export default function CarromGamePage() {
  const [game, setGame] = useState<CarromGame | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameMode: 'single-player',
    aiDifficulty: 'medium',
    aiAssistant: {
      enabled: true,
      showTrajectory: true,
      showAimGuide: true,
      autoPlay: false,
      assistanceLevel: 'intermediate',
      showShotSuggestions: true,
      showDifficultyRating: true,
    },
    physics: {
      friction: 0.98,
      restitution: 0.8,
      gravity: 0.5,
    },
    visuals: {
      theme: 'classic',
      showGrid: false,
      showAngles: true,
      showVelocity: false,
    },
  });

  // Initialize game
  useEffect(() => {
    const newGame = new CarromGame(gameSettings, (state: GameState) => {
      setGameState(state);
      // Update AI analysis when game state changes
      if (state.status === 'playing') {
        try {
          const analysis = newGame.getAIAnalysis();
          setAIAnalysis(analysis);
        } catch (error) {
          console.error('Error getting AI analysis:', error);
        }
      }
    });
    
    setGame(newGame);
    setGameState(newGame.getGameState());

    return () => {
      newGame.destroy();
    };
  }, [gameSettings]);

  // Handle game controls
  const handleStartGame = useCallback(() => {
    if (game) {
      game.startGame();
    }
  }, [game]);

  const handlePauseGame = useCallback(() => {
    if (game) {
      game.pauseGame();
    }
  }, [game]);

  const handleResetGame = useCallback(() => {
    if (game) {
      game.destroy();
      const newGame = new CarromGame(gameSettings, (state: GameState) => {
        setGameState(state);
        if (state.status === 'playing') {
          try {
            const analysis = newGame.getAIAnalysis();
            setAIAnalysis(analysis);
          } catch (error) {
            console.error('Error getting AI analysis:', error);
          }
        }
      });
      setGame(newGame);
      setGameState(newGame.getGameState());
      setAIAnalysis(null);
      setIsAutoPlaying(false);
    }
  }, [game, gameSettings]);

  // Handle shots
  const handleShot = useCallback((angle: number, power: number) => {
    if (game && gameState?.status === 'playing') {
      game.makeShot(angle, power);
    }
  }, [game, gameState]);

  // Handle AI settings changes
  const handleAISettingsChange = useCallback((newSettings: Partial<AIAssistantSettings>) => {
    const updatedSettings = {
      ...gameSettings,
      aiAssistant: { ...gameSettings.aiAssistant, ...newSettings }
    };
    setGameSettings(updatedSettings);
    
    if (game) {
      game.updateAISettings(newSettings);
    }
  }, [game, gameSettings]);

  // Handle auto-play
  const handleAutoPlay = useCallback(() => {
    if (game && gameState) {
      setIsAutoPlaying(true);
      game.makeAIMove();
      
      // Reset auto-playing flag after a delay
      setTimeout(() => {
        setIsAutoPlaying(false);
      }, 3000);
    }
  }, [game, gameState]);

  if (!gameState || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Card className="w-96">
          <CardContent className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Carrom Game</h3>
            <p className="text-gray-500">Initializing AI assistant and game engine...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Carrom Game with AI Assistant
        </h1>
        <p className="text-gray-600 mb-4">
          Experience professional Carrom with advanced AI assistance, auto-aim guidance, and intelligent gameplay analysis.
        </p>
        
        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1">
            🎯 Auto-Aim Assistant
          </Badge>
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1">
            📈 Trajectory Visualization
          </Badge>
          <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-3 py-1">
            🤖 AI Auto-Play
          </Badge>
          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1">
            📊 Performance Analytics
          </Badge>
        </div>

        {/* Quick Stats */}
        {gameState.status === 'playing' && (
          <div className="inline-flex items-center space-x-4 px-6 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
            <div className="text-sm">
              <span className="text-gray-600">Turn:</span>
              <span className="font-semibold ml-1">{gameState.turn}</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-sm">
              <span className="text-gray-600">Active Player:</span>
              <span className="font-semibold ml-1">
                {gameState.players.find(p => p.id === gameState.currentPlayer)?.name}
              </span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-sm">
              <span className="text-gray-600">Shots:</span>
              <span className="font-semibold ml-1">{gameState.shots.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Sidebar - Game Controls */}
        <div className="xl:col-span-3 space-y-4">
          <GameControls
            gameState={gameState}
            onStartGame={handleStartGame}
            onPauseGame={handlePauseGame}
            onResetGame={handleResetGame}
          />
        </div>

        {/* Center - Game Board */}
        <div className="xl:col-span-6">
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-100 shadow-2xl">
            <CarromBoard
              gameState={gameState}
              onShot={handleShot}
              showTrajectory={gameSettings.aiAssistant.showTrajectory && gameSettings.aiAssistant.enabled}
              showAimGuide={gameSettings.aiAssistant.showAimGuide && gameSettings.aiAssistant.enabled}
              aiTrajectory={aiAnalysis?.trajectory || []}
              className="w-full"
            />
          </Card>

          {/* Mobile Controls */}
          <div className="xl:hidden mt-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {gameState.status === 'waiting' && (
                <Button onClick={handleStartGame} className="bg-green-600 hover:bg-green-700">
                  Start Game
                </Button>
              )}
              {gameState.status === 'playing' && (
                <Button onClick={handlePauseGame} variant="outline">
                  Pause
                </Button>
              )}
              {gameState.status === 'paused' && (
                <Button onClick={handlePauseGame} className="bg-blue-600 hover:bg-blue-700">
                  Resume
                </Button>
              )}
              <Button onClick={handleResetGame} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="xl:col-span-3 space-y-4">
          <AIAssistant
            analysis={aiAnalysis}
            settings={gameSettings.aiAssistant}
            onSettingsChange={handleAISettingsChange}
            onAutoPlay={handleAutoPlay}
            isAutoPlaying={isAutoPlaying}
          />
        </div>
      </div>

      {/* Help Section */}
      <Card className="mt-8 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardContent className="py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-semibold text-gray-700 mb-2">Aim & Shoot</h4>
              <p className="text-gray-600">
                Click and drag from the striker to aim. The longer the drag, the more power. 
                Release to shoot and try to pocket your colored pieces.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="font-semibold text-gray-700 mb-2">AI Assistance</h4>
              <p className="text-gray-600">
                Enable AI features for trajectory visualization, shot recommendations, 
                and auto-play mode to learn optimal strategies.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="font-semibold text-gray-700 mb-2">Win Condition</h4>
              <p className="text-gray-600">
                Pocket all your colored pieces before your opponent. The queen (red piece) 
                provides bonus points but must be covered by pocketing another piece.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Carrom AI Pro v1.0 - Advanced AI-powered Carrom gaming experience</p>
        <p className="mt-1">Features: Auto-aim assistance, trajectory visualization, intelligent gameplay analysis</p>
      </div>
    </div>
  );
}