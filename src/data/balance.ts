import type { Balance } from '../types';

export const BALANCE: Balance = {
  saveVersion: 1,
  saveKey: 'parc-idle-save',
  tickMs: 100,
  autosaveSec: 15,
  startCoins: 15,
  offlineBaseEff: 0.5,
  offlineCapHours: 8,
  satMin: 0.3,
  needs: { thrill: 0.3, family: 0.25, water: 0.15, food: 0.2, shop: 0.1 },
  milestones: [10, 25, 50, 100, 200],
  milestoneMult: 2,
  starBonus: 0.02,
  prestigeDivisor: 1e10,
  prestigeExponent: 0.5,
  achievementBonus: 0.01,
  promo: { cooldownSec: 45, rewardSec: 20, minReward: 25 },
  eventGapSec: [60, 150],
  repairCostSec: 60,
  visitorSmoothing: 0.5,
};
