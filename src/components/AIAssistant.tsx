'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAnalysis, AIAssistantSettings } from '@/types/game';

interface AIAssistantProps {
  analysis?: AIAnalysis | null;
  settings: AIAssistantSettings;
  onSettingsChange: (settings: Partial<AIAssistantSettings>) => void;
  onAutoPlay: () => void;
  isAutoPlaying: boolean;
  className?: string;
}

export default function AIAssistant({
  analysis,
  settings,
  onSettingsChange,
  onAutoPlay,
  isAutoPlaying,
  className = ''
}: AIAssistantProps) {
  const [expandedSection, setExpandedSection] = useState<string>('recommendation');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-green-600';
    if (probability >= 0.6) return 'text-yellow-600';
    if (probability >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI Assistant Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-lg font-bold text-gray-800">AI Assistant</span>
              {settings.enabled && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Active
                </Badge>
              )}
            </div>
            <Button
              onClick={() => onSettingsChange({ enabled: !settings.enabled })}
              variant={settings.enabled ? "default" : "outline"}
              size="sm"
            >
              {settings.enabled ? 'Disable' : 'Enable'} AI
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {settings.enabled && (
        <Tabs value={expandedSection} onValueChange={setExpandedSection}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendation">Shot Analysis</TabsTrigger>
            <TabsTrigger value="settings">AI Settings</TabsTrigger>
            <TabsTrigger value="autoplay">Auto-Play</TabsTrigger>
          </TabsList>

          {/* Shot Recommendation */}
          <TabsContent value="recommendation">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Shot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Angle</label>
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(analysis.recommendedShot.angle)}°
                          </div>
                          <div className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center">
                            <div 
                              className="w-3 h-0.5 bg-blue-600 transform origin-left"
                              style={{ transform: `rotate(${analysis.recommendedShot.angle}deg)` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Power</label>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(analysis.recommendedShot.power)}
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full"
                            style={{ width: `${Math.min(analysis.recommendedShot.power / 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Difficulty:</span>
                        <Badge className={getDifficultyColor(analysis.difficulty)}>
                          {analysis.difficulty.charAt(0).toUpperCase() + analysis.difficulty.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Success Rate:</span>
                        <span className={`font-bold ${getSuccessProbabilityColor(analysis.successProbability)}`}>
                          {Math.round(analysis.successProbability * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Alternative Shots */}
                    {analysis.alternativeShots.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Alternative Shots</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {analysis.alternativeShots.map((alt, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                            >
                              <span className="text-gray-600">{alt.description}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {Math.round(alt.angle)}° / {Math.round(alt.power)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(alt.successProbability * 100)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>AI analysis will appear here when you start playing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Assistant Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Assistance */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b pb-1">Visual Assistance</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Show Trajectory</label>
                      <p className="text-sm text-gray-600">Display predicted ball path</p>
                    </div>
                    <Switch
                      checked={settings.showTrajectory}
                      onCheckedChange={(checked) => onSettingsChange({ showTrajectory: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Aim Guide</label>
                      <p className="text-sm text-gray-600">Show aiming assistance lines</p>
                    </div>
                    <Switch
                      checked={settings.showAimGuide}
                      onCheckedChange={(checked) => onSettingsChange({ showAimGuide: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Shot Suggestions</label>
                      <p className="text-sm text-gray-600">Display shot recommendations</p>
                    </div>
                    <Switch
                      checked={settings.showShotSuggestions}
                      onCheckedChange={(checked) => onSettingsChange({ showShotSuggestions: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Difficulty Rating</label>
                      <p className="text-sm text-gray-600">Show shot difficulty levels</p>
                    </div>
                    <Switch
                      checked={settings.showDifficultyRating}
                      onCheckedChange={(checked) => onSettingsChange({ showDifficultyRating: checked })}
                    />
                  </div>
                </div>

                {/* AI Intelligence Level */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b pb-1">Intelligence Level</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-medium">Assistance Level</label>
                      <Badge variant="outline">
                        {settings.assistanceLevel.charAt(0).toUpperCase() + settings.assistanceLevel.slice(1)}
                      </Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[
                          settings.assistanceLevel === 'beginner' ? 0 :
                          settings.assistanceLevel === 'intermediate' ? 33 :
                          settings.assistanceLevel === 'advanced' ? 66 : 100
                        ]}
                        onValueChange={(value) => {
                          const level = value[0] <= 16 ? 'beginner' :
                                       value[0] <= 49 ? 'intermediate' :
                                       value[0] <= 83 ? 'advanced' : 'expert';
                          onSettingsChange({ assistanceLevel: level });
                        }}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Beginner</span>
                        <span>Intermediate</span>
                        <span>Advanced</span>
                        <span>Expert</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                      {settings.assistanceLevel === 'beginner' && (
                        "High assistance with detailed guidance and forgiving suggestions."
                      )}
                      {settings.assistanceLevel === 'intermediate' && (
                        "Moderate assistance with strategic hints and trajectory display."
                      )}
                      {settings.assistanceLevel === 'advanced' && (
                        "Minimal assistance focusing on optimal plays and analysis."
                      )}
                      {settings.assistanceLevel === 'expert' && (
                        "Precise calculations with professional-level recommendations."
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto-Play */}
          <TabsContent value="autoplay">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Auto-Play Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Auto-Play</h4>
                    <p className="text-sm text-gray-600">Let AI make moves automatically</p>
                  </div>
                  <Switch
                    checked={settings.autoPlay}
                    onCheckedChange={(checked) => onSettingsChange({ autoPlay: checked })}
                  />
                </div>

                {settings.autoPlay && (
                  <div className="space-y-4">
                    <Button
                      onClick={onAutoPlay}
                      disabled={isAutoPlaying}
                      className="w-full"
                      size="lg"
                    >
                      {isAutoPlaying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          AI is Playing...
                        </>
                      ) : (
                        'Start Auto-Play'
                      )}
                    </Button>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-yellow-500 text-lg">⚠️</div>
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">Auto-Play Active</p>
                          <p className="text-yellow-700 mt-1">
                            The AI will automatically make moves based on your selected assistance level. 
                            You can disable this at any time to resume manual control.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!settings.autoPlay && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🤖</div>
                    <p className="text-gray-500">Enable auto-play to let AI take control</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Perfect for learning optimal strategies and techniques
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!settings.enabled && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Assistant Disabled</h3>
            <p className="text-gray-500 mb-4">
              Enable the AI assistant to get shot recommendations, trajectory visualization, and auto-play features.
            </p>
            <Button 
              onClick={() => onSettingsChange({ enabled: true })}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Enable AI Assistant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}