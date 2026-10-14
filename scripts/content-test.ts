import assert from 'node:assert/strict';
import type { GameState } from '../src/types';
import { EVENT_DEFS, updateEvents, eventModifiers, tapEvent, resolveRepair } from '../src/events';
import { ACHIEVEMENTS, checkAchievements, achievementMult, getStat } from '../src/achievements';

const st = (): GameState => ({
  version: 1, createdAt: 0, lastSeen: 0, coins: 0, stars: 0, starsTotal: 0,
  buildings: {}, zones: { entree: true }, upgrades: {}, prestigeUpgrades: {}, achievements: {},
  stats: { totalEarned: 0, runEarned: 0, taps: 0, playSeconds: 0, prestiges: 0, eventsSeen: 0, eventsResolved: 0,
    vipServed: 0, repairs: 0, maxVisitors: 0, promos: 0, offlineEarned: 0 },
  events: [], nextEventAt: 0, promoReadyAt: 0,
  settings: { buyQty: 1, notation: 'short', sound: true },
} as GameState);

assert.equal(EVENT_DEFS.length, 6);
const ctx = { incomePerSec: 10, luck: 1, totalBuildings: 5, rideIds: ['a'], rng: () => 0.99 };
const s = st();
assert.equal(updateEvents(s, 1000, ctx).started.length, 0); // programme seulement
assert.ok(s.nextEventAt > 1000);
const r = updateEvents(s, s.nextEventAt, ctx);
assert.equal(r.started.length, 1);
assert.equal(s.stats.eventsSeen, 1);
assert.equal(updateEvents(s, s.nextEventAt - 1, ctx).started.length, 0);

// panne + réparation + tap
const b = st();
b.events.push({ uid: 'u1', defId: 'breakdown', startedAt: 0, endsAt: 1e6, progress: 0, resolved: false, buildingId: 'a' });
assert.deepEqual(eventModifiers(b, 10).brokenBuildingIds, ['a']);
for (let i = 0; i < 4; i++) assert.equal(tapEvent(b, 'u1', 10).completed, false);
const t = tapEvent(b, 'u1', 10);
assert.ok(t.completed && b.stats.repairs === 1);
assert.deepEqual(eventModifiers(b, 10).brokenBuildingIds, []);
const c = st();
c.events.push({ uid: 'u2', defId: 'breakdown', startedAt: 0, endsAt: 1e6, progress: 0, resolved: false, buildingId: 'a' });
assert.ok(resolveRepair(c, 'u2'));
const v = st();
v.events.push({ uid: 'v', defId: 'vip', startedAt: 0, endsAt: 1e6, progress: 0, resolved: false });
assert.equal(tapEvent(v, 'v', 10).rewardCoins, 1200);
assert.equal(v.stats.vipServed, 1);
// expiration
const e = st();
e.events.push({ uid: 'x', defId: 'rain', startedAt: 0, endsAt: 100, progress: 0, resolved: false });
assert.equal(eventModifiers(e, 200).incomeMods.length, 0);
assert.equal(updateEvents(e, 200, { ...ctx, totalBuildings: 0 }).ended.length, 1);
assert.equal(e.events.length, 0);

// succès
const a = st();
a.buildings = { x: 3, y: 2 }; a.zones = { entree: true, aqua: true }; a.upgrades = { u: true, w: false };
assert.equal(getStat(a, 'buildingsOwned', 0), 5);
assert.equal(getStat(a, 'distinctBuildings', 0), 2);
assert.equal(getStat(a, 'zonesUnlocked', 0), 2);
assert.equal(getStat(a, 'upgradesBought', 0), 1);
assert.equal(getStat(a, 'incomePerSec', 42), 42);
const got = checkAchievements(a, 5, 0);
assert.ok(got.some((g) => g.id === 'own_5') && got.some((g) => g.id === 'zone_2'));
assert.equal(checkAchievements(a, 6, 0).length, 0);
assert.ok(achievementMult(a) > 1);
assert.equal(new Set(ACHIEVEMENTS.map((x) => x.id)).size, ACHIEVEMENTS.length);
console.log('content-test OK,', ACHIEVEMENTS.length, 'succès');
