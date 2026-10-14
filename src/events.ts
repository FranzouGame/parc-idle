import type { ActiveEvent, EventDef, GameState, Target } from './types';
import { BALANCE } from './data';

export const EVENT_DEFS: EventDef[] = [
  {
    id: 'rain', kind: 'rain', name: 'Pluie', emoji: '🌧️',
    text: "Il pleut ! Les manèges se vident, mais les parapluies de la boutique partent comme des petits pains.",
    positive: false, weight: 10, minBuildings: 3, durationSec: 60,
    incomeMods: [
      { target: 'thrill', mult: 0.6 }, { target: 'water', mult: 0.6 }, { target: 'shop', mult: 1.25 },
    ],
  },
  {
    id: 'vip', kind: 'vip', name: 'Visiteur VIP', emoji: '🤩',
    text: "Un VIP en costume brillant se présente à l'entrée. Allez lui serrer la main avant qu'il change d'avis !",
    positive: true, weight: 8, minBuildings: 3, durationSec: 25,
    action: { label: 'Accueillir', kind: 'tap', clicksNeeded: 1, rewardSec: 120 },
  },
  {
    id: 'breakdown', kind: 'breakdown', name: 'Panne', emoji: '🔧',
    text: "Un manège crachote de la fumée suspecte et s'arrête net. Le mécano est parti déjeuner : à vous de jouer !",
    positive: false, weight: 7, minBuildings: 4, durationSec: 90,
    action: { label: 'Réparer', kind: 'repair', clicksNeeded: 5 },
  },
  {
    id: 'heatwave', kind: 'heatwave', name: 'Canicule', emoji: '☀️',
    text: "Il fait une chaleur de plomb : tout le monde veut des glaces et de l'eau, personne ne veut des sensations fortes.",
    positive: false, weight: 8, minBuildings: 3, durationSec: 50,
    incomeMods: [
      { target: 'water', mult: 1.5 }, { target: 'food', mult: 1.5 }, { target: 'thrill', mult: 0.8 },
    ],
  },
  {
    id: 'crowd', kind: 'crowd', name: 'Grande foule', emoji: '🎉',
    text: "Un car de touristes vient d'arriver, puis un autre, puis une fanfare... Les files débordent !",
    positive: true, weight: 8, minBuildings: 3, durationSec: 45, visitorMult: 1.8,
  },
  {
    id: 'goldenTicket', kind: 'goldenTicket', name: 'Ticket doré', emoji: '🎟️',
    text: "Un ticket doré flotte au vent ! Attrapez-le vite avant qu'il ne finisse dans la barbe à papa.",
    positive: true, weight: 6, minBuildings: 3, durationSec: 15,
    action: { label: 'Attraper', kind: 'tap', clicksNeeded: 1, rewardSec: 300 },
  },
];

export function getEventDef(id: string): EventDef | undefined {
  return EVENT_DEFS.find((d) => d.id === id);
}

export interface EventCtx {
  incomePerSec: number;
  luck: number;
  totalBuildings: number;
  /** ids de manèges possédés (thrill/family/water, count>0) */
  rideIds: string[];
  rng?: () => number;
}

let uidSeq = 0;

function isLive(e: ActiveEvent, now: number): boolean {
  return !e.resolved && e.endsAt > now;
}

export function updateEvents(state: GameState, now: number, ctx: EventCtx): { started: ActiveEvent[]; ended: ActiveEvent[] } {
  const rng = ctx.rng ?? Math.random;
  const started: ActiveEvent[] = [];
  // Expirés et résolus sont retirés et rapportés (l'UI retire le bandeau sur eventEnd).
  const ended = state.events.filter((e) => !isLive(e, now));
  if (ended.length) state.events = state.events.filter((e) => isLive(e, now));

  if (ctx.totalBuildings < 3) return { started, ended };
  const [gmin, gmax] = BALANCE.eventGapSec;
  const schedule = () => { state.nextEventAt = now + (gmin + rng() * (gmax - gmin)) * 1000; };
  // nextEventAt <= 0 : premier passage à ≥ 3 bâtiments, on programme sans tirer.
  if (state.nextEventAt <= 0) { schedule(); return { started, ended }; }
  if (now < state.nextEventAt) return { started, ended };

  const activeKinds = new Set(state.events.map((e) => getEventDef(e.defId)?.kind));
  const brokenIds = new Set(state.events.map((e) => e.buildingId));
  const freeRides = ctx.rideIds.filter((id) => !brokenIds.has(id));
  const cands = EVENT_DEFS.filter((d) =>
    !activeKinds.has(d.kind) && ctx.totalBuildings >= d.minBuildings &&
    (d.kind !== 'breakdown' || freeRides.length > 0));
  const w = (d: EventDef) => d.weight * (d.positive ? Math.max(0, ctx.luck) : 1);
  const total = cands.reduce((s, d) => s + w(d), 0);
  if (total > 0) {
    let r = rng() * total;
    let pick = cands[cands.length - 1];
    for (const d of cands) { r -= w(d); if (r < 0) { pick = d; break; } }
    const ev: ActiveEvent = {
      uid: `${pick.id}-${now}-${uidSeq++}`, defId: pick.id, startedAt: now,
      endsAt: now + pick.durationSec * 1000, progress: 0, resolved: false,
    };
    if (pick.kind === 'breakdown') ev.buildingId = freeRides[Math.floor(rng() * freeRides.length) % freeRides.length];
    state.events.push(ev);
    state.stats.eventsSeen++;
    started.push(ev);
  }
  schedule();
  return { started, ended };
}

export function eventModifiers(state: GameState, now: number):
  { incomeMods: { target: Target; mult: number }[]; visitorMult: number; brokenBuildingIds: string[] } {
  const incomeMods: { target: Target; mult: number }[] = [];
  const brokenBuildingIds: string[] = [];
  let visitorMult = 1;
  for (const e of state.events) {
    if (!isLive(e, now)) continue;
    const d = getEventDef(e.defId);
    if (!d) continue;
    if (d.incomeMods) incomeMods.push(...d.incomeMods);
    if (d.visitorMult) visitorMult *= d.visitorMult;
    if (d.kind === 'breakdown' && e.buildingId) brokenBuildingIds.push(e.buildingId);
  }
  return { incomeMods, visitorMult, brokenBuildingIds };
}

function complete(state: GameState, e: ActiveEvent, kind: EventDef['kind']): void {
  e.resolved = true;
  state.stats.eventsResolved++;
  if (kind === 'vip') state.stats.vipServed++;
  else if (kind === 'breakdown') state.stats.repairs++;
}

export function tapEvent(state: GameState, uid: string, incomePerSec: number):
  { ok: boolean; completed: boolean; rewardCoins: number } {
  const e = state.events.find((x) => x.uid === uid);
  const d = e && getEventDef(e.defId);
  if (!e || !d || !d.action || e.resolved) return { ok: false, completed: false, rewardCoins: 0 };
  e.progress++;
  if (e.progress < d.action.clicksNeeded) return { ok: true, completed: false, rewardCoins: 0 };
  complete(state, e, d.kind);
  return { ok: true, completed: true, rewardCoins: (d.action.rewardSec ?? 0) * incomePerSec };
}

export function resolveRepair(state: GameState, uid: string): boolean {
  const e = state.events.find((x) => x.uid === uid);
  const d = e && getEventDef(e.defId);
  if (!e || !d || d.kind !== 'breakdown' || e.resolved) return false;
  complete(state, e, d.kind);
  return true;
}
