import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/contexts/app-context";
import { BUILDINGS } from "@/lib/city";
import { BuildingType } from "@shared/schema";

export default function BuildingPalette() {
  const { state, dispatch } = useAppContext();
  const { selectedBuilding } = state;

  // Get city data for resources
  const { data: city } = useQuery({
    queryKey: ['/api/city'],
  });

  // Get user stats for unlock requirements
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  if (!city || !stats) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const resources: { bricks: number; coins: number } = city.resources || { bricks: 0, coins: 0 };

  const handleBuildingSelect = (buildingType: BuildingType) => {
    const building = BUILDINGS[buildingType];
    
    // Check if unlocked
    if (stats.totalSessions < building.unlockRequirement) {
      return;
    }

    // Check if affordable
    if (resources.bricks < building.cost) {
      return;
    }

    dispatch({
      type: 'SELECT_BUILDING',
      payload: selectedBuilding === buildingType ? null : buildingType,
    });
  };

  const isUnlocked = (buildingType: BuildingType) => {
    return stats.totalSessions >= BUILDINGS[buildingType].unlockRequirement;
  };

  const isAffordable = (buildingType: BuildingType) => {
    return resources.bricks >= BUILDINGS[buildingType].cost;
  };

  const basicBuildings: BuildingType[] = ['house', 'shop', 'office'];
  const specialBuildings: BuildingType[] = ['park', 'landmark'];

  const renderBuilding = (buildingType: BuildingType) => {
    const building = BUILDINGS[buildingType];
    const unlocked = isUnlocked(buildingType);
    const affordable = isAffordable(buildingType);
    const canSelect = unlocked && affordable;
    const isSelected = selectedBuilding === buildingType;

    return (
      <div
        key={buildingType}
        className={`
          p-3 rounded-lg cursor-pointer transition-all duration-200 border
          ${canSelect
            ? isSelected
              ? 'bg-primary/20 border-primary shadow-md'
              : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md border-gray-200'
            : 'bg-gray-100 opacity-60 cursor-not-allowed border-gray-200'
          }
        `}
        onClick={() => canSelect && handleBuildingSelect(buildingType)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 bg-gradient-to-r ${building.color} rounded-lg flex items-center justify-center`}>
              <i className={`fas ${building.icon} text-white text-sm`} />
            </div>
            <span className="font-medium text-gray-900">{building.name}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <i className="fas fa-cube text-red-500" />
            <span className={`font-semibold ${affordable ? 'text-gray-900' : 'text-red-500'}`}>
              {building.cost}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-2">{building.description}</p>
        
        {!unlocked && (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div 
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (stats.totalSessions / building.unlockRequirement) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {stats.totalSessions}/{building.unlockRequirement} sessions completed
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Building Store</h2>
        
        <div className="space-y-4">
          {/* Basic Buildings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Basic Buildings
            </h3>
            {basicBuildings.map(renderBuilding)}
          </div>

          {/* Special Buildings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Special Buildings
            </h3>
            {specialBuildings.map(renderBuilding)}
          </div>
        </div>

        {selectedBuilding && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">
              Click on an empty grid cell to place your {BUILDINGS[selectedBuilding].name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
