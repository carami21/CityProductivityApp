import { GridCell, BuildingType } from "@shared/schema";

export interface Building {
  type: BuildingType;
  name: string;
  icon: string;
  cost: number;
  description: string;
  unlockRequirement: number;
  color: string;
}

export const BUILDINGS: Record<BuildingType, Building> = {
  house: {
    type: 'house',
    name: 'House',
    icon: 'fa-home',
    cost: 15,
    description: 'Basic residential building. Generates happiness.',
    unlockRequirement: 0,
    color: 'from-green-500 to-green-600',
  },
  shop: {
    type: 'shop',
    name: 'Shop',
    icon: 'fa-store',
    cost: 25,
    description: 'Commercial building. Generates coins over time.',
    unlockRequirement: 5,
    color: 'from-orange-500 to-orange-600',
  },
  office: {
    type: 'office',
    name: 'Office',
    icon: 'fa-building',
    cost: 40,
    description: 'Professional workspace. Boosts productivity.',
    unlockRequirement: 10,
    color: 'from-blue-500 to-blue-600',
  },
  park: {
    type: 'park',
    name: 'Park',
    icon: 'fa-tree',
    cost: 20,
    description: 'Green space. Increases citizen happiness.',
    unlockRequirement: 3,
    color: 'from-emerald-500 to-emerald-600',
  },
  landmark: {
    type: 'landmark',
    name: 'Landmark',
    icon: 'fa-monument',
    cost: 100,
    description: 'Prestigious building. Unlocks at 50 sessions.',
    unlockRequirement: 50,
    color: 'from-purple-500 to-purple-600',
  },
};

export function createEmptyGrid(): (GridCell | null)[][] {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

export function canPlaceBuilding(
  grid: (GridCell | null)[][],
  row: number,
  col: number,
  buildingType: BuildingType,
  bricks: number,
  totalSessions: number
): { canPlace: boolean; reason?: string } {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) {
    return { canPlace: false, reason: 'Invalid position' };
  }

  if (grid[row][col] !== null) {
    return { canPlace: false, reason: 'Slot already occupied' };
  }

  const building = BUILDINGS[buildingType];
  
  if (totalSessions < building.unlockRequirement) {
    return { 
      canPlace: false, 
      reason: `Requires ${building.unlockRequirement} completed sessions` 
    };
  }

  if (bricks < building.cost) {
    return { 
      canPlace: false, 
      reason: `Requires ${building.cost} bricks` 
    };
  }

  return { canPlace: true };
}

export function countBuildings(grid: (GridCell | null)[][]): Record<BuildingType, number> {
  const counts: Record<BuildingType, number> = {
    house: 0,
    shop: 0,
    office: 0,
    park: 0,
    landmark: 0,
  };

  grid.forEach(row => {
    row.forEach(cell => {
      if (cell && cell.buildingType) {
        counts[cell.buildingType]++;
      }
    });
  });

  return counts;
}

export function getTotalBuildings(grid: (GridCell | null)[][]): number {
  return grid.flat().filter(cell => cell !== null).length;
}
