import { BUILDINGS } from './buildings';
import { ZONES } from './zones';
import { UPGRADES } from './upgrades';
import { PRESTIGE_UPGRADES } from './prestige';
import type { BuildingDef, PrestigeUpgradeDef, UpgradeDef, ZoneDef } from '../types';

export { BALANCE } from './balance';
export { ZONES, BUILDINGS, UPGRADES, PRESTIGE_UPGRADES };

const byId = <T extends { id: string }>(l: T[]): Record<string, T> =>
  Object.fromEntries(l.map((x) => [x.id, x]));

export const BUILDING_BY_ID: Record<string, BuildingDef> = byId(BUILDINGS);
export const ZONE_BY_ID: Record<string, ZoneDef> = byId(ZONES);
export const UPGRADE_BY_ID: Record<string, UpgradeDef> = byId(UPGRADES);
export const PRESTIGE_BY_ID: Record<string, PrestigeUpgradeDef> = byId(PRESTIGE_UPGRADES);
