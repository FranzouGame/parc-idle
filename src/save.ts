import type { GameState } from './types';
import { BALANCE, BUILDING_BY_ID, ZONE_BY_ID, UPGRADE_BY_ID, PRESTIGE_BY_ID } from './data';
import { newState } from './state';

function store(s?: Storage | null): Storage | null {
  if (s !== undefined) return s;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

const num = (v: unknown, d: number, min = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : d;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function pick<T>(src: unknown, known: Record<string, unknown>, f: (v: unknown) => T | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(src)) return out;
  for (const k of Object.keys(src)) {
    if (!Object.prototype.hasOwnProperty.call(known, k)) continue;
    const r = f(src[k]);
    if (r !== undefined) out[k] = r;
  }
  return out;
}

function pickAch(src: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(src)) return out;
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (k !== '__proto__' && typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** Valide/complète un objet arbitraire en GameState. null si inutilisable. */
export function sanitizeState(raw: unknown, now: number): GameState | null {
  if (!isObj(raw)) return null;
  const d = newState(now);
  const st = isObj(raw.stats) ? raw.stats : {};
  const stats = { ...d.stats };
  for (const k of Object.keys(stats) as (keyof typeof stats)[]) stats[k] = num(st[k], d.stats[k]);
  const se = isObj(raw.settings) ? raw.settings : {};
  const qty = se.buyQty;
  const s: GameState = {
    version: BALANCE.saveVersion, // migration : champs manquants complétés par défaut
    createdAt: num(raw.createdAt, now),
    lastSeen: Math.min(num(raw.lastSeen, now), now),
    coins: num(raw.coins, d.coins),
    stars: Math.floor(num(raw.stars, 0)),
    starsTotal: Math.floor(num(raw.starsTotal, 0)),
    buildings: pick(raw.buildings, BUILDING_BY_ID, v => (typeof v === 'number' && v > 0 ? Math.floor(v) : undefined)),
    zones: { entree: true, ...pick(raw.zones, ZONE_BY_ID, v => (v === true ? true : undefined)) },
    upgrades: pick(raw.upgrades, UPGRADE_BY_ID, v => (v === true ? true : undefined)),
    prestigeUpgrades: pick(raw.prestigeUpgrades, PRESTIGE_BY_ID, v => (typeof v === 'number' && v > 0 ? Math.floor(v) : undefined)),
    achievements: pickAch(raw.achievements),
    stats,
    events: [],
    nextEventAt: 0,
    promoReadyAt: num(raw.promoReadyAt, 0),
    settings: {
      buyQty: qty === 1 || qty === 10 || qty === 100 || qty === 'max' ? qty : d.settings.buyQty,
      notation: se.notation === 'sci' ? 'sci' : 'short',
      sound: se.sound === false ? false : true,
    },
  };
  // Événements non conservés (hors ligne : aucun événement ne tombe).
  return s;
}

export function loadState(now: number, storage?: Storage | null): GameState | null {
  const ls = store(storage);
  if (!ls) return null;
  try {
    const t = ls.getItem(BALANCE.saveKey);
    return t ? parseState(t, now) : null;
  } catch { return null; }
}

export function writeState(s: GameState, storage?: Storage | null): void {
  const ls = store(storage);
  if (!ls) return;
  try { ls.setItem(BALANCE.saveKey, JSON.stringify(s)); } catch { /* quota / privé */ }
}

export function clearSave(storage?: Storage | null): void {
  try { store(storage)?.removeItem(BALANCE.saveKey); } catch { /* ignore */ }
}

export function exportState(s: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

/** Accepte JSON brut ou base64 (export). */
export function parseState(text: string, now: number = Date.now()): GameState | null {
  const t = text.trim();
  if (!t) return null;
  try {
    return sanitizeState(JSON.parse(t), now);
  } catch { /* essaie base64 */ }
  try {
    return sanitizeState(JSON.parse(decodeURIComponent(escape(atob(t)))), now);
  } catch { return null; }
}
