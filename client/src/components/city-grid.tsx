import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/app-context";
import { GridCell, BuildingType } from "@shared/schema";
import { BUILDINGS, canPlaceBuilding, countBuildings, getTotalBuildings } from "@/lib/city";
import { useToast } from "@/hooks/use-toast";

export default function CityGrid() {
  const { state, dispatch } = useAppContext();
  const { selectedBuilding } = state;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get city data
  const { data: city, isLoading: cityLoading } = useQuery({
    queryKey: ['/api/city'],
  });

  // Get user stats for unlock requirements
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  // Update city mutation
  const updateCityMutation = useMutation({
    mutationFn: async (cityData: {
      gridData?: (GridCell | null)[][];
      resources?: { bricks: number; coins: number };
    }) => {
      const response = await apiRequest('PATCH', '/api/city', cityData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/city'] });
      dispatch({ type: 'SELECT_BUILDING', payload: null });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to place building",
        variant: "destructive",
      });
    },
  });

  if (cityLoading || !city || !stats) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-8 gap-2 mb-6">
              {Array(64).fill(0).map((_, i) => (
                <div key={i} className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grid: (GridCell | null)[][] = city.gridData || Array(8).fill(null).map(() => Array(8).fill(null));
  const resources: { bricks: number; coins: number } = city.resources || { bricks: 0, coins: 0 };
  const buildingCounts = countBuildings(grid);
  const totalBuildings = getTotalBuildings(grid);

  const handleCellClick = (row: number, col: number) => {
    if (!selectedBuilding || grid[row][col] !== null) return;

    const placement = canPlaceBuilding(
      grid,
      row,
      col,
      selectedBuilding,
      resources.bricks,
      stats.totalSessions
    );

    if (!placement.canPlace) {
      toast({
        title: "Cannot place building",
        description: placement.reason,
        variant: "destructive",
      });
      return;
    }

    const building = BUILDINGS[selectedBuilding];
    const newGrid = grid.map(rowData => [...rowData]);
    newGrid[row][col] = {
      buildingType: selectedBuilding,
      placedAt: new Date().toISOString(),
    };

    updateCityMutation.mutate({
      gridData: newGrid,
      resources: {
        bricks: resources.bricks - building.cost,
        coins: resources.coins,
      },
    });
  };

  const getBuildingIcon = (buildingType: BuildingType | null) => {
    if (!buildingType) return null;
    const building = BUILDINGS[buildingType];
    return (
      <div className="flex items-center justify-center w-full h-full">
        <i className={`fas ${building.icon} text-white text-lg`} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </div>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your City</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <i className="fas fa-map text-primary" />
            <span>Grid: 8x8</span>
            <span className="mx-2">•</span>
            <span>{totalBuildings}/64 Buildings</span>
          </div>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-8 gap-2 mb-6 p-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl">
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer relative
                  transition-all duration-200 transform hover:scale-105
                  ${cell
                    ? `bg-gradient-to-br ${BUILDINGS[cell.buildingType!].color} border-transparent shadow-md`
                    : selectedBuilding
                    ? 'border-dashed border-primary hover:border-primary-500 bg-white/60 hover:bg-primary/10'
                    : 'border-dashed border-gray-300 hover:border-gray-400 bg-white/40'
                  }
                `}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell ? getBuildingIcon(cell.buildingType) : null}
              </div>
            ))
          )}
        </div>

        {/* City Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{buildingCounts.house}</div>
            <div className="text-sm text-gray-600">Houses</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{buildingCounts.office}</div>
            <div className="text-sm text-gray-600">Offices</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{buildingCounts.shop}</div>
            <div className="text-sm text-gray-600">Shops</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{buildingCounts.landmark}</div>
            <div className="text-sm text-gray-600">Landmarks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
