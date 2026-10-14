import type { PrestigeUpgradeDef } from '../types';

export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  { id: 'p-recettes', name: 'Tarifs premium', emoji: '💎', description: 'Revenus ×1.25 par niveau.', baseCost: 2, costGrowth: 2, maxLevel: 10, effect: { kind: 'income', target: 'all', mult: 1.25 } },
  { id: 'p-couts', name: 'Fournisseurs amis', emoji: '📉', description: 'Coûts ×0.95 par niveau.', baseCost: 3, costGrowth: 2.2, maxLevel: 8, effect: { kind: 'costs', mult: 0.95 } },
  { id: 'p-visiteurs', name: 'Réputation', emoji: '🌟', description: 'Visiteurs ×1.15 par niveau.', baseCost: 2, costGrowth: 2, maxLevel: 8, effect: { kind: 'visitors', mult: 1.15 } },
  { id: 'p-horsligne', name: 'Équipe de nuit', emoji: '🌙', description: 'Hors ligne ×1.2 par niveau.', baseCost: 3, costGrowth: 2.5, maxLevel: 5, effect: { kind: 'offline', mult: 1.2 } },
  { id: 'p-plafond', name: 'Veilleurs', emoji: '⏰', description: '+2 h de plafond hors ligne par niveau.', baseCost: 4, costGrowth: 2.5, maxLevel: 5, effect: { kind: 'offlineCap', hours: 2 } },
  { id: 'p-pub', name: 'Régie publicitaire', emoji: '📣', description: 'Coup de pub ×1.5 par niveau.', baseCost: 3, costGrowth: 2.5, maxLevel: 5, effect: { kind: 'promo', mult: 1.5 } },
  { id: 'p-chance', name: 'Bonne étoile', emoji: '🍀', description: 'Événements positifs ×1.2 par niveau.', baseCost: 3, costGrowth: 2.5, maxLevel: 5, effect: { kind: 'eventLuck', mult: 1.2 } },
  { id: 'p-depart', name: 'Capital de départ', emoji: '💰', description: '+5 000 pièces de départ par niveau.', baseCost: 2, costGrowth: 2.2, maxLevel: 10, effect: { kind: 'startCoins', amount: 5000 } },
];
