import type { AchievementDef, GameState, StatKey } from './types';
import { BALANCE } from './data';

const A = (id: string, emoji: string, name: string, description: string, stat: StatKey, atLeast: number): AchievementDef =>
  ({ id, emoji, name, description, cond: { stat, atLeast } });

export const ACHIEVEMENTS: AchievementDef[] = [
  // Richesse totale
  A('earn_1k', '🪙', 'Premières recettes', 'Gagner 1 000 pièces au total.', 'totalEarned', 1e3),
  A('earn_100k', '💰', 'Tiroir-caisse plein', 'Gagner 100 000 pièces au total.', 'totalEarned', 1e5),
  A('earn_10m', '🏦', 'Petit magnat', 'Gagner 10 millions de pièces au total.', 'totalEarned', 1e7),
  A('earn_1b', '💎', 'Milliardaire du frisson', 'Gagner 1 milliard de pièces au total.', 'totalEarned', 1e9),
  A('earn_1t', '👑', 'Roi du parc', 'Gagner 1 000 milliards de pièces au total.', 'totalEarned', 1e12),
  // Revenu/s
  A('inc_100', '📈', 'Ça rentre', 'Atteindre 100 pièces/s.', 'incomePerSec', 100),
  A('inc_10k', '🚀', 'Pluie de pièces', 'Atteindre 10 000 pièces/s.', 'incomePerSec', 1e4),
  A('inc_1m', '🌊', 'Raz-de-marée', 'Atteindre 1 million de pièces/s.', 'incomePerSec', 1e6),
  // Bâtiments possédés
  A('own_5', '🎠', 'Ça prend forme', 'Posséder 5 bâtiments.', 'buildingsOwned', 5),
  A('own_25', '🏗️', 'Chantier permanent', 'Posséder 25 bâtiments.', 'buildingsOwned', 25),
  A('own_100', '🏰', 'Urbaniste fou', 'Posséder 100 bâtiments.', 'buildingsOwned', 100),
  A('own_300', '🌆', 'Mégapole des loisirs', 'Posséder 300 bâtiments.', 'buildingsOwned', 300),
  // Variété
  A('distinct_4', '🎡', 'Un peu de tout', 'Posséder 4 bâtiments différents.', 'distinctBuildings', 4),
  A('distinct_12', '🎪', 'Catalogue complet', 'Posséder 12 bâtiments différents.', 'distinctBuildings', 12),
  A('distinct_20', '🌟', 'Collectionneur', 'Posséder les 20 bâtiments différents.', 'distinctBuildings', 20),
  // Améliorations
  A('upg_5', '🔩', 'Bricoleur', 'Acheter 5 améliorations.', 'upgradesBought', 5),
  A('upg_15', '🛠️', 'Ingénieur', 'Acheter 15 améliorations.', 'upgradesBought', 15),
  A('upg_30', '⚙️', 'Tout optimisé', 'Acheter 30 améliorations.', 'upgradesBought', 30),
  // Zones
  A('zone_2', '🗺️', "L'aventure commence", 'Débloquer 2 zones.', 'zonesUnlocked', 2),
  A('zone_4', '🧭', 'Grand explorateur', 'Débloquer 4 zones.', 'zonesUnlocked', 4),
  A('zone_5', '🚀', 'Conquête spatiale', 'Débloquer les 5 zones.', 'zonesUnlocked', 5),
  // Visiteurs
  A('vis_50', '👥', 'Du monde !', 'Accueillir 50 visiteurs en même temps.', 'maxVisitors', 50),
  A('vis_1k', '🚌', 'Files interminables', 'Accueillir 1 000 visiteurs en même temps.', 'maxVisitors', 1e3),
  A('vis_50k', '🏟️', 'Stade de foule', 'Accueillir 50 000 visiteurs en même temps.', 'maxVisitors', 5e4),
  // Événements
  A('ev_10', '🎲', 'Imprévus', 'Vivre 10 événements.', 'eventsSeen', 10),
  A('vip_5', '🤝', 'Sens de l\'accueil', 'Accueillir 5 VIP.', 'vipServed', 5),
  A('rep_5', '🔧', 'Mécano du dimanche', 'Réparer 5 pannes.', 'repairs', 5),
  A('evr_30', '🛡️', 'Gestionnaire de crise', 'Résoudre 30 événements.', 'eventsResolved', 30),
  // Prestige
  A('star_1', '⭐', 'Première étoile', 'Gagner 1 étoile à vie.', 'starsTotal', 1),
  A('star_25', '🌠', 'Constellation', 'Gagner 25 étoiles à vie.', 'starsTotal', 25),
  A('presti_1', '🎬', 'Réouverture !', 'Rouvrir le parc une fois.', 'prestiges', 1),
  A('presti_5', '♻️', 'Habitué du recommencement', 'Rouvrir le parc 5 fois.', 'prestiges', 5),
  // Temps de jeu
  A('time_10m', '⏱️', 'Premier quart-temps', 'Jouer 10 minutes.', 'playSeconds', 600),
  A('time_2h', '⌛', 'Directeur dévoué', 'Jouer 2 heures.', 'playSeconds', 7200),
  A('time_24h', '🕰️', 'Le parc ne dort jamais', 'Jouer 24 heures.', 'playSeconds', 86400),
  // Clics
  A('tap_100', '👆', 'Doigt agile', 'Cliquer 100 fois.', 'taps', 100),
  A('tap_2k', '🖱️', 'Tendinite', 'Cliquer 500 fois.', 'taps', 500),
  // Coups de pub
  A('promo_1', '📣', 'Première affiche', 'Lancer 1 coup de pub.', 'promos', 1),
  A('promo_25', '📢', 'Roi du marketing', 'Lancer 25 coups de pub.', 'promos', 25),
  // Hors ligne
  A('off_1k', '😴', 'Pendant votre sommeil', 'Gagner 1 000 pièces hors ligne.', 'offlineEarned', 1e3),
  A('off_1m', '🌙', 'Parc de nuit', 'Gagner 1 million de pièces hors ligne.', 'offlineEarned', 1e6),
];

export function getStat(state: GameState, key: StatKey, incomePerSec: number): number {
  const s = state.stats;
  switch (key) {
    case 'buildingsOwned': return Object.values(state.buildings).reduce((a, n) => a + (n > 0 ? n : 0), 0);
    case 'distinctBuildings': return Object.values(state.buildings).filter((n) => n > 0).length;
    case 'zonesUnlocked': return Object.values(state.zones).filter(Boolean).length;
    case 'upgradesBought': return Object.values(state.upgrades).filter(Boolean).length;
    case 'incomePerSec': return incomePerSec;
    case 'starsTotal': return state.starsTotal;
    default: return s[key];
  }
}

export function checkAchievements(state: GameState, now: number, incomePerSec: number): AchievementDef[] {
  const out: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id] === undefined && getStat(state, a.cond.stat, incomePerSec) >= a.cond.atLeast) {
      state.achievements[a.id] = now;
      out.push(a);
    }
  }
  return out;
}

export function achievementMult(state: GameState): number {
  let m = 1;
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id] !== undefined) m += a.bonus ?? BALANCE.achievementBonus;
  }
  return m;
}
