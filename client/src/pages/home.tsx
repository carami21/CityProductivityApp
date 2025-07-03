import { useEffect } from "react";
import TimerPanel from "@/components/timer-panel";
import CityGrid3D from "@/components/city-grid-3d-fixed";
import BuildingPalette from "@/components/building-palette";
import SessionHistory from "@/components/session-history";
import { useAppContext } from "@/contexts/app-context";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { state, dispatch } = useAppContext();
  const { showAchievement, achievementMessage } = state;

  // Get city data for resources display
  const { data: city } = useQuery({
    queryKey: ['/api/city'],
  });

  // Get user stats for streak
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const resources = (city as any)?.resources || { bricks: 0, coins: 0 };
  const streak = (stats as any)?.currentStreak || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary-500 rounded-xl flex items-center justify-center">
                <i className="fas fa-city text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CityBuilder Focus</h1>
                <p className="text-sm text-gray-600">Build your productivity empire</p>
              </div>
            </div>
            
            {/* Resource Display */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/60 rounded-lg px-3 py-2">
                <i className="fas fa-cube text-red-500" />
                <span className="font-semibold text-gray-900">{resources.bricks}</span>
                <span className="text-sm text-gray-600">Bricks</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 rounded-lg px-3 py-2">
                <i className="fas fa-coins text-yellow-500" />
                <span className="font-semibold text-gray-900">{resources.coins}</span>
                <span className="text-sm text-gray-600">Coins</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 rounded-lg px-3 py-2">
                <i className="fas fa-fire text-orange-500" />
                <span className="font-semibold text-gray-900">{streak}</span>
                <span className="text-sm text-gray-600">Day Streak</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Timer Panel */}
          <div className="lg:col-span-1">
            <TimerPanel />
          </div>

          {/* City Grid */}
          <div className="lg:col-span-2">
            <CityGrid3D />
          </div>

          {/* Building Palette & Session History */}
          <div className="lg:col-span-1 space-y-6">
            <BuildingPalette />
            <SessionHistory />
          </div>
        </div>
      </div>

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg transform transition-transform duration-500 max-w-sm animate-bounce-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-lg" />
              </div>
              <div>
                <div className="font-semibold">Session Complete! 🎉</div>
                <div className="text-sm opacity-90">{achievementMessage}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
