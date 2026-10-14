import type { Settings } from '../types';

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
let notation: Settings['notation'] = 'short';

export function setNotation(n: Settings['notation']): void {
  notation = n;
}

/** Nombre compact : 1.23K, 4.5M… ou notation scientifique. */
export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  if (a < 1000) return Number.isInteger(n) ? String(n) : a < 10 ? n.toFixed(2) : a < 100 ? n.toFixed(1) : n.toFixed(0);
  if (notation === 'sci') return n.toExponential(2).replace('e+', 'e');
  const e = Math.floor(Math.log10(a) / 3);
  if (e >= SUF.length) return n.toExponential(2).replace('e+', 'e');
  const v = n / Math.pow(10, e * 3);
  return v.toFixed(Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0) + SUF[e];
}

export function fmtInt(n: number): string {
  return n < 1000 ? String(Math.floor(n)) : fmt(n);
}

export function fmtPct(x: number): string {
  return Math.round(x * 100) + ' %';
}

export function fmtDuration(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  if (sec < 60) return sec + ' s';
  const p = (x: number) => String(x).padStart(2, '0');
  if (sec < 3600) return Math.floor(sec / 60) + ' min ' + p(sec % 60) + ' s';
  if (sec < 86400) return Math.floor(sec / 3600) + ' h ' + p(Math.floor((sec % 3600) / 60)) + ' min';
  return Math.floor(sec / 86400) + ' j ' + Math.floor((sec % 86400) / 3600) + ' h';
}
