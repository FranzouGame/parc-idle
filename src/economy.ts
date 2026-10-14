import type { Category, Derived, Effect, GameState, NeedInfo } from './types';
import { BALANCE, BUILDINGS, ZONES, UPGRADES, PRESTIGE_UPGRADES, UPGRADE_BY_ID, PRESTIGE_BY_ID, ZONE_BY_ID } from './data';
import { eventModifiers } from './events';
import { ACHIEVEMENTS, achievementMult, getStat } from './achievements';

const CATS: Category[] = ['thrill', 'family', 'water', 'food', 'shop'];

/** Compact FR-neutre pour les textes d'objectif (l'UI a son propre format). */
export function fmt(n: number): string {
  const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = 0;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (i === 0 ? String(Math.floor(n)) : n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0)) + u[i];
}

/** Effets actifs : upgrades achetées (n=1) et prestige (n=niveau). */
function activeEffects(s: GameState): { e: Effect; n: number }[] {
  const out: { e: Effect; n: number }[] = [];
  for (const u of UPGRADES) if (s.upgrades[u.id]) out.push({ e: u.effect, n: 1 });
  for (const p of PRESTIGE_UPGRADES) {
    const n = s.prestigeUpgrades[p.id] ?? 0;
    if (n > 0) out.push({ e: p.effect, n });
  }
  return out;
}

/** Produit des `mult` d'un kind. */
export function effectProduct(s: GameState, kind: Exclude<Effect['kind'], 'offlineCap' | 'startCoins'>): number {
  let r = 1;
  for (const { e, n } of activeEffects(s)) if (e.kind === kind) r *= Math.pow(e.mult, n);
  return r;
}
export const eventLuck = (s: GameState) => effectProduct(s, 'eventLuck');
export function offlineCapSec(s: GameState): number {
  let h = BALANCE.offlineCapHours;
  for (const { e, n } of activeEffects(s)) if (e.kind === 'offlineCap') h += e.hours * n;
  return h * 3600;
}
export function startCoins(s: GameState): number {
  let c = BALANCE.startCoins;
  for (const { e, n } of activeEffects(s)) if (e.kind === 'startCoins') c += e.amount * n;
  return c;
}
export const costMult = (s: GameState) => Math.max(0.25, effectProduct(s, 'costs'));

/** Coût de qty exemplaires à partir de n possédés. */
export function buildingCostTotal(baseCost: number, growth: number, n: number, qty: number, cMult = 1): number {
  if (qty <= 0) return 0;
  const first = baseCost * Math.pow(growth, n);
  const sum = growth === 1 ? first * qty : first * (Math.pow(growth, qty) - 1) / (growth - 1);
  return cMult * sum;
}

/** Plus grande quantité achetable avec `coins`. */
export function maxAffordableQty(baseCost: number, growth: number, n: number, coins: number, cMult: number): number {
  const first = cMult * baseCost * Math.pow(growth, n);
  if (!(first > 0) || coins < first) return 0;
  let q = growth === 1 ? Math.floor(coins / first)
    : Math.floor(Math.log(coins * (growth - 1) / first + 1) / Math.log(growth));
  if (!Number.isFinite(q)) return 0;
  q = Math.max(0, q);
  while (q > 0 && buildingCostTotal(baseCost, growth, n, q, cMult) > coins) q--;
  while (buildingCostTotal(baseCost, growth, n, q + 1, cMult) <= coins && q < 1e6) q++;
  return q;
}

const milestoneMultOf = (count: number) =>
  Math.pow(BALANCE.milestoneMult, BALANCE.milestones.filter(m => m <= count).length);

export function prestigeGainOf(totalEarned: number, starsTotal: number): number {
  const lifetime = Math.floor(Math.pow(totalEarned / BALANCE.prestigeDivisor, BALANCE.prestigeExponent));
  return Math.max(0, lifetime - starsTotal);
}

interface IncomeCtx {
  perTarget: Record<string, number>; // hors 'all'
  globalAll: number;                 // upgrades 'all' × prestige 'all'
  upgradesAll: number;
  stars: number; ach: number;
  mods: { target: string; mult: number }[];
}

function incomeCtx(s: GameState, now: number): IncomeCtx {
  const perTarget: Record<string, number> = {};
  let upgradesAll = 1, presAll = 1;
  for (const u of UPGRADES) {
    if (!s.upgrades[u.id] || u.effect.kind !== 'income') continue;
    if (u.effect.target === 'all') upgradesAll *= u.effect.mult;
    else perTarget[u.effect.target] = (perTarget[u.effect.target] ?? 1) * u.effect.mult;
  }
  for (const p of PRESTIGE_UPGRADES) {
    const n = s.prestigeUpgrades[p.id] ?? 0;
    if (n <= 0 || p.effect.kind !== 'income') continue;
    const m = Math.pow(p.effect.mult, n);
    if (p.effect.target === 'all') presAll *= m;
    else perTarget[p.effect.target] = (perTarget[p.effect.target] ?? 1) * m;
  }
  return {
    perTarget, upgradesAll, globalAll: upgradesAll * presAll,
    stars: 1 + BALANCE.starBonus * s.starsTotal,
    ach: achievementMult(s),
    mods: eventModifiers(s, now).incomeMods,
  };
}

function buildingIncome(s: GameState, b: (typeof BUILDINGS)[number], c: IncomeCtx, sat: number): number {
  const n = s.buildings[b.id] ?? 0;
  if (n <= 0) return 0;
  let ev = 1;
  for (const m of c.mods) if (m.target === 'all' || m.target === b.category || m.target === b.id) ev *= m.mult;
  const satFactor = BALANCE.satMin + (1 - BALANCE.satMin) * sat;
  return n * b.baseIncome * milestoneMultOf(n)
    * (c.perTarget[b.category] ?? 1) * (c.perTarget[b.id] ?? 1)
    * c.globalAll * c.stars * c.ach * ev * satFactor;
}

/** Revenu d'un bâtiment sans tenir compte de la panne (pour le coût de réparation). */
export function incomeIgnoringBreak(s: GameState, buildingId: string, now: number, satisfaction: number): number {
  const b = BUILDINGS.find(x => x.id === buildingId);
  return b ? buildingIncome(s, b, incomeCtx(s, now), satisfaction) : 0;
}

export function repairCostOf(s: GameState, buildingId: string, now: number, satisfaction: number): number {
  return BALANCE.repairCostSec * incomeIgnoringBreak(s, buildingId, now, satisfaction) * effectProduct(s, 'repair');
}

/**
 * `prev` (optionnel) : visiteurs courants + dt (s) pour le lissage ; sans lui, visiteurs = cible.
 */
export function computeDerived(s: GameState, now: number, prev?: { visitors: number; dt: number }): Derived {
  const mods = eventModifiers(s, now);
  const broken = new Set(mods.brokenBuildingIds);
  const ctx = incomeCtx(s, now);

  let appeal = 0;
  const availCats = new Set<Category>();
  for (const b of BUILDINGS) {
    if (s.zones[b.zone]) availCats.add(b.category);
    appeal += (s.buildings[b.id] ?? 0) * b.appeal;
  }
  const visitorsTarget = appeal * effectProduct(s, 'visitors') * mods.visitorMult;
  const visitors = prev
    ? Math.max(0, prev.visitors + (visitorsTarget - prev.visitors) * Math.min(1, BALANCE.visitorSmoothing * prev.dt))
    : visitorsTarget;

  const needs = {} as Record<Category, NeedInfo>;
  let wSum = 0, wCov = 0;
  for (const c of CATS) {
    const available = availCats.has(c);
    let supply = 0;
    for (const b of BUILDINGS) {
      if (b.category === c && !broken.has(b.id)) supply += (s.buildings[b.id] ?? 0) * b.capacity;
    }
    const demand = available ? visitors * BALANCE.needs[c] : 0;
    const coverage = demand <= 0 ? 1 : Math.min(1, supply / demand);
    needs[c] = { available, demand, supply, coverage };
    if (available) { wSum += BALANCE.needs[c]; wCov += BALANCE.needs[c] * coverage; }
  }
  const satisfaction = visitors <= 0 || wSum <= 0 ? 1 : wCov / wSum;

  const incomeByBuilding: Record<string, number> = {};
  let income = 0;
  for (const b of BUILDINGS) {
    const v = broken.has(b.id) ? 0 : buildingIncome(s, b, ctx, satisfaction);
    if (v > 0) incomeByBuilding[b.id] = v;
    income += v;
  }

  let eventAll = 1;
  for (const m of mods.incomeMods) if (m.target === 'all') eventAll *= m.mult;

  const promoCooldownSec = Math.max(10, BALANCE.promo.cooldownSec * effectProduct(s, 'promoCooldown'));
  const promoReward = Math.max(BALANCE.promo.minReward, BALANCE.promo.rewardSec * income * effectProduct(s, 'promo'));
  const d: Derived = {
    incomePerSec: income,
    mult: {
      stars: ctx.stars, achievements: ctx.ach, upgrades: ctx.upgradesAll, event: eventAll,
      satisfaction: BALANCE.satMin + (1 - BALANCE.satMin) * satisfaction,
    },
    visitors, visitorsTarget, satisfaction, needs, incomeByBuilding,
    brokenBuildings: [...broken],
    costMult: costMult(s),
    offlineEff: Math.min(1, BALANCE.offlineBaseEff * effectProduct(s, 'offline')),
    offlineCapSec: offlineCapSec(s),
    promoCooldownSec, promoReward,
    prestigeGain: prestigeGainOf(s.stats.totalEarned, s.starsTotal),
    nextGoal: '',
  };
  d.nextGoal = nextGoal(s, d, now);
  return d;
}

function nextGoal(s: GameState, d: Derived, now: number): string {
  if (d.prestigeGain >= 1 && s.stats.runEarned >= BALANCE.prestigeDivisor)
    return `Réouverture disponible : +${d.prestigeGain} ⭐ (onglet Prestige)`;
  const nextZone = [...ZONES].sort((a, b) => a.order - b.order).find(z => !s.zones[z.id]);
  if (nextZone) {
    const left = nextZone.unlockCost - s.coins;
    if (left <= 0) return `Débloque la zone ${nextZone.emoji} ${nextZone.name} (${fmt(nextZone.unlockCost)} 🪙)`;
    if (d.incomePerSec > 0 && left < nextZone.unlockCost * 0.5 + 1)
      return `Zone ${nextZone.emoji} ${nextZone.name} : encore ${fmt(left)} 🪙 (~${Math.ceil(left / d.incomePerSec)} s)`;
  }
  // succès proche
  let best: { name: string; r: number } | null = null;
  for (const a of ACHIEVEMENTS) {
    if (s.achievements[a.id]) continue;
    const r = getStat(s, a.cond.stat, d.incomePerSec) / a.cond.atLeast;
    if (r >= 0.6 && r < 1 && (!best || r > best.r)) best = { name: `${a.emoji} ${a.name}`, r };
  }
  if (best) return `Succès proche : ${best.name} (${Math.floor(best.r * 100)} %)`;
  // prochain palier de possession
  let ms: { name: string; count: number; target: number } | null = null;
  for (const b of BUILDINGS) {
    const n = s.buildings[b.id] ?? 0;
    if (!s.zones[b.zone] || n <= 0) continue;
    const t = BALANCE.milestones.find(m => m > n);
    if (t !== undefined && (!ms || t - n < ms.target - ms.count)) ms = { name: `${b.emoji} ${b.name}`, count: n, target: t };
  }
  if (ms) return `Palier ×${BALANCE.milestoneMult} : ${ms.name} ${ms.count}/${ms.target}`;
  if (nextZone) return `Prochaine zone : ${nextZone.emoji} ${nextZone.name} (${fmt(nextZone.unlockCost)} 🪙)`;
  const cheap = BUILDINGS.filter(b => s.zones[b.zone]).sort((a, b) => a.baseCost - b.baseCost)[0];
  return d.prestigeGain >= 1 ? `Réouverture disponible : +${d.prestigeGain} ⭐`
    : `Achète ${cheap ? cheap.emoji + ' ' + cheap.name : 'un bâtiment'} pour développer le parc`;
}

export { UPGRADE_BY_ID, PRESTIGE_BY_ID, ZONE_BY_ID };
