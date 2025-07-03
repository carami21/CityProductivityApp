import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/app-context";
import { GridCell, BuildingType } from "@shared/schema";
import { BUILDINGS, canPlaceBuilding, countBuildings, getTotalBuildings } from "@/lib/city";
import { useToast } from "@/hooks/use-toast";
import { useThreeScene } from "@/hooks/use-three-scene";
import * as THREE from "three";
import { Eye, Grid3X3, RotateCcw } from "lucide-react";

interface BuildingMesh {
  mesh: THREE.Mesh;
  row: number;
  col: number;
  buildingType: BuildingType;
  growthProgress: number;
}

interface GridTile {
  mesh: THREE.Mesh;
  row: number;
  col: number;
}

export default function CityGrid3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buildingMeshesRef = useRef<Map<string, BuildingMesh>>(new Map());
  const gridTilesRef = useRef<Map<string, GridTile>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [view3D, setView3D] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  
  const { state, dispatch } = useAppContext();
  const { selectedBuilding } = state;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { scene, camera, isReady } = useThreeScene(containerRef);

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

  // Camera rotation effect
  useEffect(() => {
    if (!camera || !autoRotate) return;

    let angle = 0;
    const rotationSpeed = 0.005;
    const radius = 25;

    const animateCamera = () => {
      if (autoRotate && camera && view3D) {
        angle += rotationSpeed;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.lookAt(0, 0, 0);
      }
      requestAnimationFrame(animateCamera);
    };

    animateCamera();
  }, [camera, autoRotate, view3D]);

  // Create building geometry based on type
  const createBuildingGeometry = (buildingType: BuildingType) => {
    switch (buildingType) {
      case 'house':
        return new THREE.BoxGeometry(0.8, 1.2, 0.8);
      case 'shop':
        return new THREE.BoxGeometry(0.9, 1.0, 0.9);
      case 'office':
        return new THREE.BoxGeometry(0.7, 2.0, 0.7);
      case 'park':
        return new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
      case 'landmark':
        return new THREE.ConeGeometry(0.5, 2.5, 6);
      default:
        return new THREE.BoxGeometry(0.8, 1.2, 0.8);
    }
  };

  // Create building material based on type
  const createBuildingMaterial = (buildingType: BuildingType) => {
    const colorMap: Record<BuildingType, number> = {
      house: 0x4ade80,    // Green
      shop: 0xfb923c,     // Orange
      office: 0x3b82f6,   // Blue
      park: 0x10b981,     // Emerald
      landmark: 0x8b5cf6, // Purple
    };

    return new THREE.MeshLambertMaterial({ 
      color: colorMap[buildingType],
      transparent: true,
    });
  };

  // Create invisible grid tiles for clicking
  const createGridTiles = () => {
    if (!scene) return;

    // Clear existing grid tiles
    gridTilesRef.current.forEach((tile) => {
      scene.remove(tile.mesh);
    });
    gridTilesRef.current.clear();

    // Create clickable grid tiles
    const tileGeometry = new THREE.PlaneGeometry(1.8, 1.8);
    const tileMaterial = new THREE.MeshBasicMaterial({ 
      transparent: true, 
      opacity: 0,
      side: THREE.DoubleSide 
    });

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        const tileSpacing = 2;
        tile.position.x = (col - 3.5) * tileSpacing;
        tile.position.z = (row - 3.5) * tileSpacing;
        tile.position.y = 0.01;
        tile.rotation.x = -Math.PI / 2;
        
        scene.add(tile);
        gridTilesRef.current.set(`${row}-${col}`, { mesh: tile, row, col });
      }
    }
  };

  // Place building in 3D scene with growth animation
  const placeBuildingIn3D = (row: number, col: number, buildingType: BuildingType) => {
    if (!scene) return;

    const geometry = createBuildingGeometry(buildingType);
    const material = createBuildingMaterial(buildingType);
    const mesh = new THREE.Mesh(geometry, material);

    // Position calculation (8x8 grid centered at origin)
    const tileSpacing = 2;
    mesh.position.x = (col - 3.5) * tileSpacing;
    mesh.position.z = (row - 3.5) * tileSpacing;
    
    // Start small and grow
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    // Store building mesh
    const buildingMesh: BuildingMesh = {
      mesh,
      row,
      col,
      buildingType,
      growthProgress: 0,
    };
    
    const key = `${row}-${col}`;
    buildingMeshesRef.current.set(key, buildingMesh);

    // Growth animation (like Forest app trees growing)
    const growBuilding = () => {
      const building = buildingMeshesRef.current.get(key);
      if (!building) return;

      building.growthProgress += 0.02;
      const progress = Math.min(building.growthProgress, 1);
      
      // Eased growth animation
      const easeOutBounce = (t: number): number => {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      };

      const scale = easeOutBounce(progress);
      building.mesh.scale.set(scale, scale, scale);
      
      // Set final position
      const height = building.mesh.geometry.boundingBox?.max.y || 0.6;
      building.mesh.position.y = (height * scale) / 2;

      if (progress < 1) {
        requestAnimationFrame(growBuilding);
      }
    };

    growBuilding();
  };

  // Handle mouse clicks for 3D grid
  const handleCanvasClick = (event: MouseEvent) => {
    if (!camera || !containerRef.current || !selectedBuilding) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    
    const gridTiles = Array.from(gridTilesRef.current.values()).map(tile => tile.mesh);
    const intersects = raycasterRef.current.intersectObjects(gridTiles);

    if (intersects.length > 0) {
      const intersectedTile = intersects[0].object;
      const tileData = Array.from(gridTilesRef.current.values()).find(
        tile => tile.mesh === intersectedTile
      );
      
      if (tileData) {
        handleCellClick(tileData.row, tileData.col);
      }
    }
  };

  // Handle cell clicks for building placement
  const handleCellClick = (row: number, col: number) => {
    if (!selectedBuilding || !city || !stats) return;

    const grid: (GridCell | null)[][] = (city as any).gridData || Array(8).fill(null).map(() => Array(8).fill(null));
    const resources: { bricks: number; coins: number } = (city as any).resources || { bricks: 0, coins: 0 };

    if (grid[row][col] !== null) return;

    const placement = canPlaceBuilding(
      grid,
      row,
      col,
      selectedBuilding,
      resources.bricks,
      (stats as any).totalSessions
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

  // Setup click handler for 3D canvas
  useEffect(() => {
    if (!containerRef.current || !view3D) return;

    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('click', handleCanvasClick);
    return () => canvas.removeEventListener('click', handleCanvasClick);
  }, [view3D, selectedBuilding]);

  // Update 3D scene when city data changes
  useEffect(() => {
    if (!scene || !city || !isReady) return;

    const grid: (GridCell | null)[][] = (city as any).gridData || Array(8).fill(null).map(() => Array(8).fill(null));

    // Clear existing buildings
    buildingMeshesRef.current.forEach((building) => {
      scene.remove(building.mesh);
    });
    buildingMeshesRef.current.clear();

    // Create grid tiles for clicking
    createGridTiles();

    // Add buildings from grid
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell?.buildingType) {
          placeBuildingIn3D(rowIndex, colIndex, cell.buildingType);
        }
      });
    });
  }, [scene, city, isReady]);

  if (cityLoading || !city || !stats) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grid: (GridCell | null)[][] = (city as any).gridData || Array(8).fill(null).map(() => Array(8).fill(null));
  const resources: { bricks: number; coins: number } = (city as any).resources || { bricks: 0, coins: 0 };
  const buildingCounts = countBuildings(grid);
  const totalBuildings = getTotalBuildings(grid);

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your City</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="fas fa-map text-primary" />
              <span>Grid: 8x8</span>
              <span className="mx-2">•</span>
              <span>{totalBuildings}/64 Buildings</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRotate(!autoRotate)}
                className={autoRotate ? "bg-primary text-white" : ""}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView3D(!view3D)}
                className={view3D ? "bg-primary text-white" : ""}
              >
                {view3D ? <Eye className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                {view3D ? "3D" : "2D"}
              </Button>
            </div>
          </div>
        </div>

        {view3D ? (
          // 3D View
          <div className="mb-6">
            <div 
              ref={containerRef} 
              className="w-full h-96 rounded-xl overflow-hidden bg-gradient-to-b from-blue-200 to-green-200"
              style={{ cursor: selectedBuilding ? 'crosshair' : 'default' }}
            />
            {selectedBuilding && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  Click on the grid to place your {BUILDINGS[selectedBuilding].name}
                </p>
              </div>
            )}
          </div>
        ) : (
          // 2D View (Original)
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
                  {cell && (
                    <div className="flex items-center justify-center w-full h-full">
                      <i className={`fas ${BUILDINGS[cell.buildingType!].icon} text-white text-lg`} />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

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
