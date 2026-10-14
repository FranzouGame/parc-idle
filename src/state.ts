import type { GameState } from './types';
import { BALANCE } from './data';

export function newState(now: number): GameState {
  return {
    version: BALANCE.saveVersion,
    createdAt: now,
    lastSeen: now,
    coins: BALANCE.startCoins,
    stars: 0,
    starsTotal: 0,
    buildings: {},
    zones: { entree: true },
    upgrades: {},
    prestigeUpgrades: {},
    achievements: {},
    stats: {
      totalEarned: 0, runEarned: 0, taps: 0, playSeconds: 0, prestiges: 0,
      eventsSeen: 0, eventsResolved: 0, vipServed: 0, repairs: 0, maxVisitors: 0,
      promos: 0, offlineEarned: 0,
    },
    events: [],
    nextEventAt: 0,
    promoReadyAt: 0,
    settings: { buyQty: 1, notation: 'short', sound: true },
  };
}
