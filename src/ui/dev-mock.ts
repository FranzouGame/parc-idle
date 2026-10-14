/** Mock minimal de GameAPI pour tester l'UI sans moteur. Non importé en prod ; usage : mountUI(root, createMockGame()). */
import type { GameAPI, GameState, Derived, BusMap, Category } from '../types';
import { BUILDINGS, ZONES, UPGRADES, PRESTIGE_UPGRADES, BALANCE, BUILDING_BY_ID } from '../data';

export function createMockGame(): GameAPI {
  const now = Date.now();
  const state: GameState = {
    version: 1, createdAt: now, lastSeen: now, coins: 100, stars: 0, starsTotal: 0,
    buildings: {}, zones: { entree: true }, upgrades: {}, prestigeUpgrades: {}, achievements: {},
    stats: { totalEarned: 0, runEarned: 0, taps: 0, playSeconds: 0, prestiges: 0, eventsSeen: 0, eventsResolved: 0, vipServed: 0, repairs: 0, maxVisitors: 0, promos: 0, offlineEarned: 0 },
    events: [], nextEventAt: now + 1e9, promoReadyAt: 0,
    settings: { buyQty: 1, notation: 'short', sound: true },
  };
  const cats: Category[] = ['thrill', 'family', 'water', 'food', 'shop'];
  const listeners: Record<string, ((p: never) => void)[]> = {};
  const emit = <K extends keyof BusMap>(k: K, p: BusMap[K]) => (listeners[k] ?? []).forEach((f) => f(p as never));
  const derived: Derived = {
    incomePerSec: 0, mult: { stars: 1, achievements: 1, upgrades: 1, event: 1, satisfaction: 1 },
    visitors: 0, visitorsTarget: 0, satisfaction: 1,
    needs: Object.fromEntries(cats.map((c) => [c, { available: true, demand: 0, supply: 0, coverage: 1 }])) as Derived['needs'],
    incomeByBuilding: {}, brokenBuildings: [], costMult: 1, offlineEff: 0.5, offlineCapSec: 7200,
    promoCooldownSec: BALANCE.promo.cooldownSec, promoReward: 50, prestigeGain: 0, nextGoal: 'Achète ton premier manège !',
  };
  const cost = (id: string, q: number) => {
    const b = BUILDING_BY_ID[id], n = state.buildings[id] ?? 0;
    let t = 0;
    for (let i = 0; i < q; i++) t += b.baseCost * Math.pow(b.costGrowth, n + i);
    return t;
  };
  const recompute = () => {
    let inc = 0, vis = 0;
    for (const b of BUILDINGS) {
      const n = state.buildings[b.id] ?? 0;
      derived.incomeByBuilding[b.id] = n * b.baseIncome;
      inc += n * b.baseIncome; vis += n * b.appeal;
    }
    derived.incomePerSec = inc; derived.visitorsTarget = vis;
    derived.prestigeGain = Math.floor(Math.pow(state.stats.totalEarned / 1e4, 0.5));
  };
  const maxAff = (id: string) => {
    let q = 0;
    while (q < 1000 && cost(id, q + 1) <= state.coins) q++;
    return q;
  };
  const game: GameAPI = {
    state, derived,
    buildingCost: cost, maxAffordable: maxAff,
    isBuildingUnlocked: (id) => !!state.zones[BUILDING_BY_ID[id].zone],
    isUpgradeVisible: (id) => { const r = UPGRADES.find((u) => u.id === id)?.requires; return !r || !r.zone || !!state.zones[r.zone]; },
    repairCost: () => 100,
    prestigeUpgradeCost: (id) => PRESTIGE_UPGRADES.find((p) => p.id === id)?.baseCost ?? 1,
    buyBuilding(id, qty) {
      const q = qty === 'max' ? maxAff(id) : qty;
      const c = cost(id, q);
      if (q < 1 || c > state.coins) return 0;
      state.coins -= c; state.buildings[id] = (state.buildings[id] ?? 0) + q;
      recompute(); emit('change', undefined as never); return q;
    },
    buyUpgrade(id) {
      const u = UPGRADES.find((x) => x.id === id);
      if (!u || state.coins < u.cost) return false;
      state.coins -= u.cost; state.upgrades[id] = true; emit('change', undefined as never); return true;
    },
    unlockZone(id) {
      const z = ZONES.find((x) => x.id === id);
      if (!z || state.coins < z.unlockCost) return false;
      state.coins -= z.unlockCost; state.zones[id] = true; emit('zoneUnlocked', id); emit('change', undefined as never); return true;
    },
    promo() {
      if (Date.now() < state.promoReadyAt) return false;
      state.promoReadyAt = Date.now() + derived.promoCooldownSec * 1000;
      state.coins += derived.promoReward; emit('burst', { coins: derived.promoReward, label: 'Coup de pub' }); return true;
    },
    tapEvent: () => false, payRepair: () => false, prestige: () => false, buyPrestigeUpgrade: () => false,
    setSettings(p) { Object.assign(state.settings, p); emit('change', undefined as never); },
    save() {}, hardReset() {}, exportSave: () => JSON.stringify(state), importSave: () => false,
    on(ev, cb) {
      (listeners[ev] ??= []).push(cb as never);
      return () => { listeners[ev] = listeners[ev].filter((f) => f !== (cb as never)); };
    },
  };
  recompute();
  setInterval(() => {
    const g = derived.incomePerSec / 10;
    state.coins += g; state.stats.totalEarned += g; state.stats.runEarned += g;
    derived.visitors += (derived.visitorsTarget - derived.visitors) * 0.1;
    emit('tick', derived);
  }, 100);
  return game;
}
