/**
 * CONTRAT PARTAGÉ — parc-idle
 * Écrit par le chef de projet. Aucun agent ne modifie ce fichier :
 * si un type manque, le signaler dans le rapport final.
 * Toutes les dates sont en millisecondes epoch (Date.now()).
 * Toutes les durées "Sec" sont en secondes.
 */

// ───────────── Données statiques (src/data/*, src/events.ts, src/achievements.ts)

/** Catégorie = besoin satisfait par un bâtiment. food = faim, shop = envie d'achat, le reste = envies de sensations. */
export type Category = 'thrill' | 'family' | 'water' | 'food' | 'shop';

export type ZoneId = 'entree' | 'aventure' | 'aqua' | 'fantasy' | 'espace';

/** Cible d'un bonus : tout, une catégorie, ou l'id d'un bâtiment. */
export type Target = 'all' | Category | string;

export interface ZoneDef {
  id: ZoneId;
  name: string;
  emoji: string;
  description: string;
  /** Coût en pièces (0 pour la zone de départ). */
  unlockCost: number;
  order: number;
  /** Couleur CSS principale de la zone. */
  color: string;
}

export interface BuildingDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  zone: ZoneId;
  category: Category;
  /** Prix du 1er exemplaire. */
  baseCost: number;
  /** Prix(n) = baseCost * costGrowth^n (n = nombre déjà possédé). Typiquement 1.12–1.18. */
  costGrowth: number;
  /** Pièces/seconde par exemplaire, avant multiplicateurs. */
  baseIncome: number;
  /** Visiteurs servis par exemplaire pour sa catégorie. */
  capacity: number;
  /** Visiteurs attirés par exemplaire (0 pour les stands). */
  appeal: number;
}

/** Effet générique. `mult` > 1 = bonus, < 1 = réduction (costs). */
export type Effect =
  | { kind: 'income'; target: Target; mult: number }
  | { kind: 'visitors'; mult: number }
  | { kind: 'costs'; mult: number }
  | { kind: 'offline'; mult: number }      // efficacité hors ligne
  | { kind: 'offlineCap'; hours: number }  // heures de hors ligne ajoutées
  | { kind: 'promo'; mult: number }        // récompense du coup de pub
  | { kind: 'promoCooldown'; mult: number }// cooldown du coup de pub (<1 = plus court)
  | { kind: 'eventLuck'; mult: number }    // poids des événements positifs
  | { kind: 'repair'; mult: number }       // coût de réparation (<1 = moins cher)
  | { kind: 'startCoins'; amount: number };// pièces de départ après prestige

export interface UpgradeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  effect: Effect;
  /** Condition de visibilité. */
  requires?: { zone?: ZoneId; building?: { id: string; count: number } };
}

export interface PrestigeUpgradeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Coût en étoiles du niveau 1 ; niveau n coûte ceil(baseCost * costGrowth^(n-1)). */
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  /** Effet PAR NIVEAU, composé : total = mult^niveau ; hours/amount : multiplié par niveau. */
  effect: Effect;
}

export type EventKind = 'rain' | 'vip' | 'breakdown' | 'heatwave' | 'crowd' | 'goldenTicket';

export interface EventDef {
  id: string;
  kind: EventKind;
  name: string;
  emoji: string;
  /** Texte affiché dans le bandeau d'événement. */
  text: string;
  /** Bon pour le joueur ? (influence eventLuck et la couleur UI). */
  positive: boolean;
  /** Poids de tirage. */
  weight: number;
  /** Nb min. de bâtiments possédés pour que l'événement puisse tomber. */
  minBuildings: number;
  durationSec: number;
  incomeMods?: { target: Target; mult: number }[];
  visitorMult?: number;
  /** Si présent, le joueur peut agir dessus. */
  action?: {
    label: string;
    /** 'tap' : cliquer N fois ; 'repair' : cliquer N fois OU payer. */
    kind: 'tap' | 'repair';
    clicksNeeded: number;
    /** Récompense en secondes de revenu actuel (tap réussi). */
    rewardSec?: number;
  };
}

export interface ActiveEvent {
  uid: string;
  defId: string;
  startedAt: number;
  endsAt: number;
  /** Clics déjà donnés. */
  progress: number;
  /** Pour breakdown : id du bâtiment en panne. */
  buildingId?: string;
  resolved: boolean;
}

export type StatKey =
  | 'totalEarned' | 'runEarned' | 'taps' | 'playSeconds' | 'prestiges'
  | 'eventsSeen' | 'eventsResolved' | 'vipServed' | 'repairs' | 'maxVisitors'
  | 'buildingsOwned' | 'zonesUnlocked' | 'upgradesBought' | 'incomePerSec'
  | 'starsTotal' | 'promos' | 'offlineEarned' | 'distinctBuildings';

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cond: { stat: StatKey; atLeast: number };
  /** Bonus de revenu global additif par succès (ex: 0.01 = +1 %), défini par succès. Défaut : Balance.achievementBonus. */
  bonus?: number;
}

// ───────────── Équilibrage (src/data/balance.ts exporte `BALANCE: Balance`)

export interface Balance {
  saveVersion: number;
  saveKey: string;
  tickMs: number;
  autosaveSec: number;
  startCoins: number;
  /** Efficacité de base du hors-ligne (0.5 = 50 %). */
  offlineBaseEff: number;
  offlineCapHours: number;
  /** Facteur de satisfaction minimum (satisfaction 0 → ce facteur). */
  satMin: number;
  /** Part de demande par catégorie (somme ≈ 1). */
  needs: Record<Category, number>;
  /** Paliers de possession : chaque palier atteint ×milestoneMult sur ce bâtiment. */
  milestones: number[];
  milestoneMult: number;
  /** Bonus de revenu par étoile (0.05 = +5 %/étoile). */
  starBonus: number;
  /** stars_totales(lifetime) = floor((totalEarned / prestigeDivisor) ^ prestigeExponent). */
  prestigeDivisor: number;
  prestigeExponent: number;
  /** Revenu bonus par succès débloqué (additif), si pas de `bonus` propre. */
  achievementBonus: number;
  promo: { cooldownSec: number; rewardSec: number; minReward: number };
  /** Délai entre événements, tiré dans [min, max] secondes. */
  eventGapSec: [number, number];
  /** Coût de réparation = repairCostSec × revenu/s du bâtiment en panne. */
  repairCostSec: number;
  /** Visiteurs : lissage (fraction de l'écart rattrapée par seconde). */
  visitorSmoothing: number;
}

// ───────────── État de jeu (sauvegardé tel quel dans localStorage)

export interface Stats {
  totalEarned: number;   // à vie
  runEarned: number;     // depuis le dernier prestige
  taps: number;
  playSeconds: number;
  prestiges: number;
  eventsSeen: number;
  eventsResolved: number;
  vipServed: number;
  repairs: number;
  maxVisitors: number;
  promos: number;
  offlineEarned: number;
}

export interface Settings {
  buyQty: 1 | 10 | 100 | 'max';
  notation: 'short' | 'sci';
  sound: boolean;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastSeen: number;
  coins: number;
  /** Étoiles dépensables. */
  stars: number;
  /** Étoiles gagnées à vie (dépensées + non dépensées) : sert au bonus et à la formule de prestige. */
  starsTotal: number;
  buildings: Record<string, number>;
  zones: Record<string, boolean>;
  upgrades: Record<string, boolean>;
  prestigeUpgrades: Record<string, number>;
  /** id → date de déblocage. */
  achievements: Record<string, number>;
  stats: Stats;
  events: ActiveEvent[];
  nextEventAt: number;
  promoReadyAt: number;
  settings: Settings;
}

// ───────────── Valeurs dérivées (recalculées par le moteur, jamais sauvegardées)

export interface NeedInfo {
  /** La catégorie existe-t-elle dans une zone débloquée ? Sinon ignorée. */
  available: boolean;
  demand: number;
  supply: number;
  /** 0..1 */
  coverage: number;
}

export interface Derived {
  incomePerSec: number;
  /** Multiplicateurs globaux, pour affichage. */
  mult: { stars: number; achievements: number; upgrades: number; event: number; satisfaction: number };
  visitors: number;
  visitorsTarget: number;
  /** 0..1 */
  satisfaction: number;
  needs: Record<Category, NeedInfo>;
  incomeByBuilding: Record<string, number>;
  brokenBuildings: string[];
  costMult: number;
  offlineEff: number;
  offlineCapSec: number;
  promoCooldownSec: number;
  promoReward: number;
  /** Étoiles obtenues si on prestige maintenant. */
  prestigeGain: number;
  /** Prochain objectif conseillé (texte) : toujours défini. */
  nextGoal: string;
}

export interface OfflineReport {
  seconds: number;
  cappedSeconds: number;
  coins: number;
}

// ───────────── Bus d'événements & API du moteur (consommée par l'UI)

export interface BusMap {
  /** Émis après chaque tick (≈ 10/s) : l'UI rafraîchit. */
  tick: Derived;
  /** Structure modifiée (achat, zone, prestige, chargement) : l'UI reconstruit les listes. */
  change: void;
  toast: { text: string; kind: 'info' | 'good' | 'bad' };
  eventStart: ActiveEvent;
  eventEnd: ActiveEvent;
  achievement: AchievementDef;
  zoneUnlocked: ZoneId;
  offline: OfflineReport;
  prestige: { gained: number };
  /** Gain visuel : coins gagnés par une action (tap, VIP, promo). */
  burst: { coins: number; label: string };
}

export interface GameAPI {
  readonly state: GameState;
  readonly derived: Derived;

  // Lecture
  buildingCost(id: string, qty: number): number;
  /** Quantité achetable maintenant (≥ 0). */
  maxAffordable(id: string): number;
  isBuildingUnlocked(id: string): boolean;
  isUpgradeVisible(id: string): boolean;
  repairCost(uid: string): number;
  prestigeUpgradeCost(id: string): number;

  // Actions (retour : succès)
  buyBuilding(id: string, qty: number | 'max'): number;
  buyUpgrade(id: string): boolean;
  unlockZone(id: ZoneId): boolean;
  promo(): boolean;
  /** Clic sur un événement actionnable (VIP, panne…). */
  tapEvent(uid: string): boolean;
  /** Payer la réparation d'une panne. */
  payRepair(uid: string): boolean;
  prestige(): boolean;
  buyPrestigeUpgrade(id: string): boolean;
  setSettings(patch: Partial<Settings>): void;

  // Persistance
  save(): void;
  hardReset(): void;
  exportSave(): string;
  importSave(text: string): boolean;

  on<K extends keyof BusMap>(ev: K, cb: (payload: BusMap[K]) => void): () => void;
}
