import type { ZoneDef } from '../types';

export const ZONES: ZoneDef[] = [
  { id: 'entree', name: 'Entrée', emoji: '🎪', description: 'Les premiers manèges du parc.', unlockCost: 0, order: 0, color: '#f4b942' },
  { id: 'aventure', name: 'Aventure', emoji: '🎢', description: 'Sensations fortes et food-trucks.', unlockCost: 40000, order: 1, color: '#e4572e' },
  { id: 'aqua', name: 'Aqua Park', emoji: '🌊', description: 'Toboggans et rivières pour se rafraîchir.', unlockCost: 5e6, order: 2, color: '#29a3d9' },
  { id: 'fantasy', name: 'Royaume Fantasy', emoji: '🏰', description: 'Châteaux, dragons et banquets.', unlockCost: 1e8, order: 3, color: '#9b5de5' },
  { id: 'espace', name: 'Espace', emoji: '🚀', description: 'Le futur des loisirs, aux confins du ciel.', unlockCost: 4e9, order: 4, color: '#3a4ba0' },
];
