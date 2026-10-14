// Test de fumée moteur : npx tsx scripts/engine-smoke.ts
import { createGame } from '../src/game';
import { BUILDINGS, ZONES, BALANCE } from '../src/data';

let t = 1_700_000_000_000;
const g = createGame({ now: () => t, storage: null, autoStart: false, rng: mulberry(7) });
function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const seen: string[] = [];
for (const k of ['toast', 'burst', 'achievement', 'zoneUnlocked', 'eventStart', 'prestige', 'offline'] as const) g.on(k, () => seen.push(k));

g.promo(); ok(g.buyBuilding(BUILDINGS[0].id, 1) === 1, 'first building');
ok(g.derived.nextGoal.length > 0, 'nextGoal');
// joue 3 h simulées : achète le moins cher dispo toutes les 5 s, promo, zones, événements
let prestiged = 0;
for (let s = 0; s < 3 * 3600; s += 5) {
  g.stepSimulated(5);
  g.promo();
  for (const z of ZONES) g.unlockZone(z.id);
  for (const e of [...g.state.events]) { for (let i = 0; i < 6; i++) g.tapEvent(e.uid); g.payRepair(e.uid); }
  const unlocked = BUILDINGS.filter(b => g.isBuildingUnlocked(b.id));
  unlocked.sort((a, b) => g.buildingCost(a.id, 1) - g.buildingCost(b.id, 1));
  for (const b of unlocked) if (g.buyBuilding(b.id, 'max') > 0) break;
  g.state.upgrades; 
  if (s % 600 === 0 && g.derived.prestigeGain >= 3 && g.prestige()) prestiged++;
  ok(Number.isFinite(g.state.coins) && g.state.coins >= 0, 'coins finite @' + s);
}
console.log({ coins: g.state.coins, income: g.derived.incomePerSec, vis: g.derived.visitors, sat: g.derived.satisfaction, prestiged, stars: g.state.starsTotal, goal: g.derived.nextGoal, events: [...new Set(seen)] });
// save/load/export/import
const text = g.exportSave();
const g2 = createGame({ now: () => t, storage: null, autoStart: false });
ok(g2.importSave(text) && g2.state.starsTotal === g.state.starsTotal, 'import');
ok(!g2.importSave('garbage'), 'reject garbage');
ok(g2.importSave(JSON.stringify({ coins: 'x', buildings: { __proto__: 1, nope: 5 } })), 'defaults');
// hors ligne
const mem = new Map<string, string>();
const st = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) } as unknown as Storage;
const a = createGame({ now: () => t, storage: st, autoStart: false });
a.promo(); a.buyBuilding(BUILDINGS[0].id, 1); a.stepSimulated(30); a.save();
t += 3600_000;
const b = createGame({ now: () => t, storage: st, autoStart: false });
ok(b.lastOffline && b.lastOffline.coins > 0 && b.state.stats.offlineEarned > 0, 'offline');
console.log('offline', b.lastOffline, 'tick ms', BALANCE.tickMs);
console.log('OK');
