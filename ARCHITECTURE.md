# ARCHITECTURE — Parc Idle

Vite + TypeScript, sans framework UI. Contrat partagé : `src/types.ts` (**non modifiable**).
Tout le code importe les types depuis `./types` / `../types`. Pas de dépendance runtime.

## Fichiers et propriétaires

| Fichier | Propriétaire | Rôle |
|---|---|---|
| `src/types.ts` | Chef de projet | Contrat |
| `src/data/balance.ts` | Économie | `export const BALANCE: Balance` |
| `src/data/zones.ts` | Économie | `export const ZONES: ZoneDef[]` (5, ordre croissant) |
| `src/data/buildings.ts` | Économie | `export const BUILDINGS: BuildingDef[]` (20) |
| `src/data/upgrades.ts` | Économie | `export const UPGRADES: UpgradeDef[]` (~30) |
| `src/data/prestige.ts` | Économie | `export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[]` (~8) |
| `src/data/index.ts` | Économie | Réexporte tout + `BUILDING_BY_ID`, `ZONE_BY_ID`, `UPGRADE_BY_ID`, `PRESTIGE_BY_ID` (Record) |
| `src/bus.ts` | Moteur | Mini émetteur typé `Bus<BusMap>` |
| `src/state.ts` | Moteur | `newState(now): GameState` |
| `src/save.ts` | Moteur | `loadState(now): GameState \| null`, `writeState(s)`, `clearSave()`, `exportState(s)`, `parseState(text): GameState \| null`, migration/validation |
| `src/economy.ts` | Moteur | `computeDerived(state, now): Derived`, `buildingCostTotal`, helpers de formules |
| `src/offline.ts` | Moteur | `applyOffline(state, derived, seconds): OfflineReport` |
| `src/prestige.ts` | Moteur | `prestigeGain(state)`, `doPrestige(state)`, coûts boutique |
| `src/game.ts` | Moteur | `createGame(): GameAPI` : boucle, achats, orchestration |
| `src/events.ts` | Contenu | Événements aléatoires (voir API ci-dessous) |
| `src/achievements.ts` | Contenu | Succès (voir API ci-dessous) |
| `index.html`, `styles/*.css` | Interface | Page + styles |
| `src/ui/*.ts` | Interface | `mountUI(root, game)` et sous-modules |
| `src/main.ts` | Chef de projet | Assemble : `createGame()` puis `mountUI()` |

Aucun agent ne touche aux fichiers d'un autre. Besoin d'un changement ailleurs : le dire dans le rapport.

## Communication entre systèmes

```
 data/*  ──────────────┐
 events.ts ─┐          ▼
 achievements.ts ─► game.ts ──(GameAPI + Bus)──► ui/*
                       ▲  │
        economy/offline/prestige/save/state
```

- Le **moteur** (`game.ts`) possède l'unique `GameState`. L'UI le **lit** et appelle les actions de `GameAPI` ;
  elle ne mute jamais l'état.
- L'UI s'abonne au bus : `tick` (≈10/s, rafraîchir chiffres/boutons), `change` (reconstruire listes),
  `toast`, `eventStart/End`, `achievement`, `offline`, `prestige`, `burst`.
- Le moteur appelle `events.ts` et `achievements.ts` (fonctions pures sur l'état, mutent seulement `state`).
- `events.ts` / `achievements.ts` importent `./data` (jamais `game.ts`).

## API Contenu

`src/events.ts` :
```ts
export const EVENT_DEFS: EventDef[];
export function getEventDef(id: string): EventDef | undefined;
export interface EventCtx { incomePerSec: number; luck: number; totalBuildings: number;
  rideIds: string[]; /* ids de manèges possédés (thrill/family/water, count>0) */ rng?: () => number }
/** Appelé à chaque tick. Fait expirer et apparaître des événements (state.events, nextEventAt,
 *  stats.eventsSeen). Max 1 événement par kind. Les `resolved` sont retirés. */
export function updateEvents(state: GameState, now: number, ctx: EventCtx):
  { started: ActiveEvent[]; ended: ActiveEvent[] };
/** Modificateurs actifs (hors événements résolus/expirés). brokenBuildingIds = bâtiments en panne non résolue. */
export function eventModifiers(state: GameState, now: number):
  { incomeMods: { target: Target; mult: number }[]; visitorMult: number; brokenBuildingIds: string[] };
/** Un clic. Incrémente progress ; si clicksNeeded atteint : resolved=true, stats (vipServed / repairs / eventsResolved).
 *  rewardCoins = rewardSec × incomePerSec si completed (le moteur crédite). */
export function tapEvent(state: GameState, uid: string, incomePerSec: number):
  { ok: boolean; completed: boolean; rewardCoins: number };
/** Résolution par paiement (le moteur débite avant). */
export function resolveRepair(state: GameState, uid: string): boolean;
```

`src/achievements.ts` :
```ts
export const ACHIEVEMENTS: AchievementDef[];
export function getStat(state: GameState, key: StatKey, incomePerSec: number): number;
/** Débloque (state.achievements[id]=now) et renvoie les nouveaux. */
export function checkAchievements(state: GameState, now: number, incomePerSec: number): AchievementDef[];
/** 1 + Σ bonus des succès débloqués. */
export function achievementMult(state: GameState): number;
```

## Formules (référence unique — Moteur les implémente, Économie les respecte)

```
coût(n→n+qty)   = costMult × Σ_{i=n}^{n+qty-1} baseCost × costGrowth^i
milestoneMult_b = milestoneMult ^ (nb de paliers BALANCE.milestones ≤ count_b)
upgradeMult(b)  = Π effets income des upgrades achetées dont target ∈ {'all', b.category, b.id}
                  (les 'all' sont comptés une seule fois dans mult.upgrades global, voir ci-dessous)
starsMult       = 1 + starBonus × starsTotal
achMult         = achievementMult(state)
prestigeMult    = Π (effets income 'all' de prestigeUpgrades)^niveau
eventMult(b)    = Π incomeMods des événements dont target ∈ {'all', cat, id}
income_b        = count_b × baseIncome × milestoneMult_b × upgradeMult(b, cat/id)
                  × [upgrades 'all'] × starsMult × achMult × prestigeMult × eventMult(b)
                  × satFactor × (b en panne ? 0 : 1)
satFactor       = satMin + (1 − satMin) × satisfaction
visitorsTarget  = (Σ count_b × appeal_b) × upgrades visitors × prestige visitors × event visitorMult
visitors        = lissé vers visitorsTarget (visitorSmoothing /s) ; stats.maxVisitors mis à jour
demand_c        = visitors × needs[c]   (si catégorie c présente dans une zone débloquée)
supply_c        = Σ count_b × capacity_b (b de catégorie c, hors pannes)
coverage_c      = demand_c == 0 ? 1 : min(1, supply_c / demand_c)
satisfaction    = Σ needs[c]×coverage_c / Σ needs[c]   (c disponibles) ; 1 si aucun visiteur
costMult        = Π effets 'costs' (upgrades × prestige^niveau), plancher 0.25
offlineEff      = min(1, offlineBaseEff × Π 'offline')
offlineCapSec   = (offlineCapHours + Σ offlineCap.hours×niveau) × 3600
promoReward     = max(promo.minReward, promo.rewardSec × incomePerSec × Π 'promo')
promoCooldown   = promo.cooldownSec × Π 'promoCooldown' (plancher 10 s)
repairCost      = repairCostSec × income_b(sans panne) × Π 'repair'
eventLuck       = Π 'eventLuck' (multiplie le poids des événements positifs)
prestigeGain    = max(0, floor((totalEarned/prestigeDivisor)^prestigeExponent) − starsTotal)
```

Prestige : coins = startCoins + Σ startCoins.amount×niveau ; zones : seule `entree` ; bâtiments/upgrades vidés ;
stars += gain ; starsTotal += gain ; stats.runEarned = 0 ; stats.prestiges++ ; événements vidés.

## Persistance

`localStorage[BALANCE.saveKey]` = JSON de `GameState`. Autosave toutes les `autosaveSec`, sur
`visibilitychange → hidden` et `beforeunload`. `lastSeen` mis à jour à chaque sauvegarde. Chargement :
validation + valeurs par défaut des champs manquants (migration par `version`).

## UI

- `index.html` : `<div id="app">`, `<script type="module" src="/src/main.ts">`, viewport mobile.
- Mise en page : en-tête (pièces, revenu/s, visiteurs, satisfaction, étoiles), zone centrale (parc par zones
  avec bâtiments), panneaux/onglets : Parc, Améliorations, Besoins, Succès, Prestige, Réglages.
  Mobile : barre d'onglets en bas ; ordinateur : colonnes. Boutons ≥ 44 px.
- Bandeau d'événements actifs avec boutons d'action ; objectif en cours (`nextGoal`) toujours visible.
- Format de nombres : K, M, B, T, Qa, Qi… (`ui/format.ts`) ; notation 'sci' en option.
- Animations simples CSS : pulse du bouton achetable, pop des gains (`burst`), visiteurs emoji qui flânent,
  toasts. Respecter `prefers-reduced-motion`.
- Chaque `.ts` UI reste côté DOM ; pas d'innerHTML avec données non fiables (import de sauvegarde).

## Déploiement

`.github/workflows/deploy.yml` (GitHub Pages, `actions/deploy-pages`) : `npm ci && npm run build` →
artefact `dist/`. Vite `base: './'`.
