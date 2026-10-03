/**
 * Settlement Types and Schemas
 * P13 - Data-driven settlement generation
 */

export enum SettlementType {
  VILLAGE = 'village',
  TOWN = 'town',
  CITY = 'city',
  CASTLE = 'castle',
}

export enum BuildingType {
  HOUSE = 'house',
  TAVERN = 'tavern',
  SMITHY = 'smithy',
  MARKET = 'market',
  FARM = 'farm',
  CHURCH = 'church',
  CASTLE_KEEP = 'castle_keep',
  CASTLE_WALL = 'castle_wall',
  GATE = 'gate',
  BRIDGE = 'bridge',
}

export interface SettlementConfig {
  type: SettlementType;
  name: string;
  position: { x: number; z: number };
  radius: number;
  buildingCount: {
    min: number;
    max: number;
  };
  hasWalls: boolean;
  hasMarket: boolean;
  hasFarms: boolean;
}

export interface Plot {
  id: string;
  position: { x: number; z: number };
  size: { width: number; depth: number };
  rotation: number;
  buildingType: BuildingType;
  hasInterior: boolean;
}

export interface Road {
  id: string;
  points: Array<{ x: number; z: number }>;
  width: number;
  isMainRoad: boolean;
}

export interface Settlement {
  id: string;
  config: SettlementConfig;
  plots: Plot[];
  roads: Road[];
  landmarks: string[];
  interiors: string[];
}

export const SETTLEMENT_SCHEMAS: Record<string, SettlementConfig> = {
  briarhollow: {
    type: SettlementType.VILLAGE,
    name: 'Briarhollow',
    position: { x: 0, z: 0 },
    radius: 100,
    buildingCount: { min: 8, max: 12 },
    hasWalls: false,
    hasMarket: true,
    hasFarms: true,
  },
  highspire: {
    type: SettlementType.CASTLE,
    name: 'Highspire',
    position: { x: 0, z: 0 },
    radius: 300,
    buildingCount: { min: 30, max: 50 },
    hasWalls: true,
    hasMarket: true,
    hasFarms: false,
  },
};

export const BUILDING_SCHEMAS: Record<BuildingType, {
  size: { width: number; depth: number };
  hasInterior: boolean;
  terrainFlatten: boolean;
}> = {
  [BuildingType.HOUSE]: {
    size: { width: 8, depth: 10 },
    hasInterior: false,
    terrainFlatten: true,
  },
  [BuildingType.TAVERN]: {
    size: { width: 12, depth: 15 },
    hasInterior: true,
    terrainFlatten: true,
  },
  [BuildingType.SMITHY]: {
    size: { width: 10, depth: 12 },
    hasInterior: true,
    terrainFlatten: true,
  },
  [BuildingType.MARKET]: {
    size: { width: 20, depth: 20 },
    hasInterior: false,
    terrainFlatten: true,
  },
  [BuildingType.FARM]: {
    size: { width: 15, depth: 20 },
    hasInterior: false,
    terrainFlatten: true,
  },
  [BuildingType.CHURCH]: {
    size: { width: 15, depth: 25 },
    hasInterior: true,
    terrainFlatten: true,
  },
  [BuildingType.CASTLE_KEEP]: {
    size: { width: 30, depth: 30 },
    hasInterior: true,
    terrainFlatten: true,
  },
  [BuildingType.CASTLE_WALL]: {
    size: { width: 2, depth: 10 },
    hasInterior: false,
    terrainFlatten: false,
  },
  [BuildingType.GATE]: {
    size: { width: 8, depth: 4 },
    hasInterior: false,
    terrainFlatten: true,
  },
  [BuildingType.BRIDGE]: {
    size: { width: 6, depth: 20 },
    hasInterior: false,
    terrainFlatten: false,
  },
};
