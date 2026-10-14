/**
 * Moteur de jeu.
 *
 * createGame(opts?) : GameAPI & extras
 *  - opts.now      : horloge injectable (ms). Défaut Date.now.
 *  - opts.storage  : Storage injectable ; null = aucune persistance. Défaut localStorage.
 *  - opts.autoStart: false = pas de setInterval ni d'écouteurs DOM (tests). Défaut true.
 *  - opts.rng      : RNG injecté dans les événements.
 *  - opts.fresh    : true = ignore la sauvegarde existante.
 * Extras : stepSimulated(seconds) avance le jeu de `seconds` en ticks de tickMs sans attendre
 * (jamais traité comme hors ligne) ; tick() force un tick ; lastOffline ; destroy().
 */
import type {
  ActiveEvent, BusMap, Derived, GameAPI, GameState, OfflineReport, Settings, ZoneId,
} from './types';
import { BALANCE, BUILDING_BY_ID, ZONE_BY_ID, UPGRADE_BY_ID, PRESTIGE_BY_ID } from './data';
import { createBus } from './bus';
import { newState } from './state';
import { loadState, writeState, clearSave, exportState, parseState } from './save';
import {
  computeDerived, buildingCostTotal, maxAffordableQty, costMult, eventLuck, repairCostOf, fmt,
} from './economy';
import { applyOffline } from './offline';
import { doPrestige, prestigeUpgradeCostOf } from './prestige';
import { updateEvents, tapEvent as evTap, resolveRepair, getEventDef } from './events';
import { checkAchievements } from './achievements';

export interface GameOptions {
  now?: () => number;
  storage?: Storage | null;
  autoStart?: boolean;
  rng?: () => number;
  fresh?: boolean;
}

export type Game = GameAPI & {
  stepSimulated(seconds: number): void;
  tick(): void;
  readonly lastOffline: OfflineReport | null;
  destroy(): void;
};

export function createGame(opts: GameOptions = {}): Game {
  const baseNow = opts.now ?? Date.now;
  let skew = 0;
  const now = () => baseNow() + skew;
  const storage = opts.storage;
  const bus = createBus<BusMap>();
  const MAXQ = 1e6;

  const t0 = now();
  const loaded = opts.fresh ? null : loadState(t0, storage);
  const state: GameState = loaded ?? newState(t0);
  let derived: Derived = computeDerived(state, t0);
  let lastTick = t0;
  let lastSave = t0;
  let lastOffline: OfflineReport | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = bus.emit;
  const refresh = (t = now()) => { derived = computeDerived(state, t); };
  const changed = () => { refresh(); bus.emit('change', undefined); };
  const toast = (text: string, kind: 'info' | 'good' | 'bad' = 'info') => bus.emit('toast', { text, kind });

  function earn(c: number): void {
    state.coins += c;
    state.stats.totalEarned += c;
    state.stats.runEarned += c;
  }

  function runAchievements(t: number): void {
    for (const a of checkAchievements(state, t, derived.incomePerSec)) {
      bus.emit('achievement', a);
      toast(`Succès : ${a.emoji} ${a.name}`, 'good');
    }
  }

  function goOffline(t: number, seconds: number): void {
    const rep = applyOffline(state, derived, seconds);
    // Gel des événements : rien ne tombe ni n'expire pendant l'absence.
    const shift = seconds * 1000;
    for (const e of state.events) e.endsAt += shift;
    if (state.nextEventAt > 0) state.nextEventAt += shift;
    refresh(t);
    runAchievements(t);
    if (seconds >= 60) {
      lastOffline = rep;
      emit('offline', rep);
    }
    bus.emit('change', undefined);
  }

  function doTick(t: number): void {
    let dt = (t - lastTick) / 1000;
    if (dt <= 0) { lastTick = t; return; }
    lastTick = t;
    if (dt > 2) {
      goOffline(t, dt);
      dt = BALANCE.tickMs / 1000;
      return finishTick(t);
    }
    state.stats.playSeconds += dt;
    // Événements (utilise le revenu courant).
    const ctx = {
      incomePerSec: derived.incomePerSec,
      luck: eventLuck(state),
      totalBuildings: Object.values(state.buildings).reduce((a, b) => a + b, 0),
      rideIds: Object.keys(state.buildings).filter(id => {
        const c = BUILDING_BY_ID[id]?.category;
        return (state.buildings[id] ?? 0) > 0 && (c === 'thrill' || c === 'family' || c === 'water');
      }),
      rng: opts.rng,
    };
    const ev = updateEvents(state, t, ctx);
    for (const e of ev.started) {
      emit('eventStart', e);
      const def = getEventDef(e.defId);
      if (def) toast(`${def.emoji} ${def.name} : ${def.text}`, def.positive ? 'good' : 'bad');
    }
    for (const e of ev.ended) emit('eventEnd', e);
    derived = computeDerived(state, t, { visitors: derived.visitors, dt });
    earn(derived.incomePerSec * dt);
    if (derived.visitors > state.stats.maxVisitors) state.stats.maxVisitors = derived.visitors;
    runAchievements(t);
    if (ev.started.length || ev.ended.length) bus.emit('change', undefined);
    finishTick(t);
  }

  function finishTick(t: number): void {
    if (t - lastSave >= BALANCE.autosaveSec * 1000) save();
    emit('tick', derived);
  }

  function save(): void {
    const t = now();
    state.lastSeen = t;
    lastSave = t;
    writeState(state, storage);
  }

  // ── Lecture
  const costOf = (id: string, qty: number) => {
    const b = BUILDING_BY_ID[id];
    return b ? buildingCostTotal(b.baseCost, b.costGrowth, state.buildings[id] ?? 0, qty, derived.costMult) : Infinity;
  };
  const maxAff = (id: string) => {
    const b = BUILDING_BY_ID[id];
    if (!b || !state.zones[b.zone]) return 0;
    return Math.min(MAXQ, maxAffordableQty(b.baseCost, b.costGrowth, state.buildings[id] ?? 0, state.coins, derived.costMult));
  };
  const findEvent = (uid: string): ActiveEvent | undefined =>
    state.events.find(e => e.uid === uid && !e.resolved);
  const repairCost = (uid: string) => {
    const e = state.events.find(x => x.uid === uid);
    if (!e || !e.buildingId) return Infinity;
    return repairCostOf(state, e.buildingId, now(), derived.satisfaction);
  };

  // ── Actions
  const api: Game = {
    state,
    get derived() { return derived; },
    get lastOffline() { return lastOffline; },
    buildingCost: costOf,
    maxAffordable: maxAff,
    isBuildingUnlocked: id => { const b = BUILDING_BY_ID[id]; return !!b && !!state.zones[b.zone]; },
    isUpgradeVisible: id => {
      const u = UPGRADE_BY_ID[id];
      if (!u) return false;
      const r = u.requires;
      if (!r) return true;
      if (r.zone && !state.zones[r.zone]) return false;
      if (r.building && (state.buildings[r.building.id] ?? 0) < r.building.count) return false;
      return true;
    },
    repairCost,
    prestigeUpgradeCost: id => prestigeUpgradeCostOf(state, id),

    buyBuilding(id, qty) {
      const b = BUILDING_BY_ID[id];
      if (!b || !state.zones[b.zone]) return 0;
      const q = qty === 'max' ? maxAff(id) : Math.min(MAXQ, Math.floor(qty));
      if (!(q >= 1)) return 0;
      const cost = costOf(id, q);
      if (cost > state.coins) return 0;
      state.coins -= cost;
      state.buildings[id] = (state.buildings[id] ?? 0) + q;
      changed();
      runAchievements(now());
      return q;
    },
    buyUpgrade(id) {
      const u = UPGRADE_BY_ID[id];
      if (!u || state.upgrades[id] || !api.isUpgradeVisible(id) || state.coins < u.cost) return false;
      state.coins -= u.cost;
      state.upgrades[id] = true;
      changed();
      runAchievements(now());
      return true;
    },
    unlockZone(id: ZoneId) {
      const z = ZONE_BY_ID[id];
      if (!z || state.zones[id] || state.coins < z.unlockCost) return false;
      const prev = Object.values(ZONE_BY_ID).find(o => o.order === z.order - 1);
      if (prev && !state.zones[prev.id]) return false;
      state.coins -= z.unlockCost;
      state.zones[id] = true;
      changed();
      emit('zoneUnlocked', id);
      toast(`${z.emoji} Zone débloquée : ${z.name}`, 'good');
      runAchievements(now());
      return true;
    },
    promo() {
      const t = now();
      if (t < state.promoReadyAt) return false;
      const gain = derived.promoReward;
      earn(gain);
      state.stats.promos++;
      state.promoReadyAt = t + derived.promoCooldownSec * 1000;
      emit('burst', { coins: gain, label: 'Coup de pub !' });
      runAchievements(t);
      refresh(t);
      bus.emit('change', undefined);
      return true;
    },
    tapEvent(uid) {
      const e = findEvent(uid);
      if (!e) return false;
      const r = evTap(state, uid, derived.incomePerSec);
      if (!r.ok) return false;
      state.stats.taps++;
      if (r.completed) {
        if (r.rewardCoins > 0) {
          earn(r.rewardCoins);
          const def = getEventDef(e.defId);
          emit('burst', { coins: r.rewardCoins, label: def ? `${def.emoji} ${def.name}` : 'Bonus' });
          toast(`+${fmt(r.rewardCoins)} 🪙`, 'good');
        }
        runAchievements(now());
        changed();
      } else bus.emit('change', undefined);
      return true;
    },
    payRepair(uid) {
      const e = findEvent(uid);
      if (!e) return false;
      const def = getEventDef(e.defId);
      if (!def || def.action?.kind !== 'repair') return false;
      const cost = repairCost(uid);
      if (!(cost <= state.coins)) return false;
      state.coins -= cost;
      if (!resolveRepair(state, uid)) { state.coins += cost; return false; }
      toast('Réparation payée', 'info');
      changed();
      runAchievements(now());
      return true;
    },
    prestige() {
      const gain = doPrestige(state);
      if (gain < 1) return false;
      refresh();
      emit('prestige', { gained: gain });
      toast(`Réouverture ! +${gain} ⭐`, 'good');
      runAchievements(now());
      save();
      bus.emit('change', undefined);
      return true;
    },
    buyPrestigeUpgrade(id) {
      const cost = prestigeUpgradeCostOf(state, id);
      if (!PRESTIGE_BY_ID[id] || !(cost <= state.stars)) return false;
      state.stars -= cost;
      state.prestigeUpgrades[id] = (state.prestigeUpgrades[id] ?? 0) + 1;
      changed();
      return true;
    },
    setSettings(patch: Partial<Settings>) {
      Object.assign(state.settings, patch);
      bus.emit('change', undefined);
    },

    save,
    hardReset() {
      clearSave(storage);
      Object.assign(state, newState(now()));
      lastTick = now();
      lastSave = lastTick;
      derived = computeDerived(state, lastTick);
      bus.emit('change', undefined);
    },
    exportSave() {
      state.lastSeen = now();
      return exportState(state);
    },
    importSave(text) {
      const s = parseState(text, now());
      if (!s) return false;
      Object.assign(state, s);
      lastTick = now();
      refresh(lastTick);
      save();
      bus.emit('change', undefined);
      return true;
    },
    on: bus.on,

    tick: () => doTick(now()),
    stepSimulated(seconds) {
      const step = BALANCE.tickMs;
      let t = lastTick;
      const end = lastTick + seconds * 1000;
      while (t + step <= end) { t += step; doTick(t); }
      if (t < end) { t = end; doTick(t); }
      skew += lastTick - now();
    },
    destroy() {
      if (timer) clearInterval(timer);
      timer = null;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
      if (typeof window !== 'undefined') window.removeEventListener('beforeunload', save);
    },
  };

  function onVis(): void {
    if (document.visibilityState === 'hidden') save();
    else doTick(now());
  }

  // Hors ligne depuis la dernière session.
  if (loaded) {
    const gap = (t0 - loaded.lastSeen) / 1000;
    if (gap > 2) {
      goOffline(t0, gap);
      lastSave = t0;
      // Laisse l'UI s'abonner avant l'émission : on ré-émet en différé.
      if (lastOffline) {
        const rep = lastOffline;
        if (typeof setTimeout !== 'undefined') setTimeout(() => emit('offline', rep), 0);
      }
    }
  }
  refresh(t0);
  runAchievements(t0);

  if (opts.autoStart !== false) {
    timer = setInterval(() => doTick(now()), BALANCE.tickMs);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', save);
  }
  return api;
}
