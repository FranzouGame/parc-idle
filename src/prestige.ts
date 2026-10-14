import type { GameState } from './types';
import { PRESTIGE_BY_ID } from './data';
import { prestigeGainOf, startCoins } from './economy';

export const prestigeGain = (s: GameState) => prestigeGainOf(s.stats.totalEarned, s.starsTotal);

/** Coût du prochain niveau (Infinity si max). */
export function prestigeUpgradeCostOf(s: GameState, id: string): number {
  const p = PRESTIGE_BY_ID[id];
  if (!p) return Infinity;
  const lvl = s.prestigeUpgrades[id] ?? 0;
  if (lvl >= p.maxLevel) return Infinity;
  return Math.ceil(p.baseCost * Math.pow(p.costGrowth, lvl));
}

/** Réinitialise le run. Retourne les étoiles gagnées (0 = rien fait). */
export function doPrestige(s: GameState): number {
  const gain = prestigeGain(s);
  if (gain < 1) return 0;
  s.stars += gain;
  s.starsTotal += gain;
  s.stats.prestiges++;
  s.stats.runEarned = 0;
  s.buildings = {};
  s.zones = { entree: true };
  s.upgrades = {};
  s.events = [];
  s.nextEventAt = 0;
  s.promoReadyAt = 0;
  s.coins = startCoins(s);
  return gain;
}
