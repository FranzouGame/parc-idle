import type { Derived, GameState, OfflineReport } from './types';

/** Crédite le gain hors ligne (plafond + efficacité) et met à jour les stats. */
export function applyOffline(s: GameState, d: Derived, seconds: number): OfflineReport {
  const cappedSeconds = Math.max(0, Math.min(seconds, d.offlineCapSec));
  const coins = d.incomePerSec * cappedSeconds * d.offlineEff;
  s.coins += coins;
  s.stats.totalEarned += coins;
  s.stats.runEarned += coins;
  s.stats.offlineEarned += coins;
  return { seconds, cappedSeconds, coins };
}
