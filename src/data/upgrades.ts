import type { UpgradeDef } from '../types';

export const UPGRADES: UpgradeDef[] = [
  // Entrée
  { id: 'carrousel-dore', name: 'Chevaux dorés', emoji: '🐴', description: 'Carrousel ×2.', cost: 100, effect: { kind: 'income', target: 'carrousel', mult: 2 }, requires: { building: { id: 'carrousel', count: 5 } } },
  { id: 'train-express', name: 'Train express', emoji: '🚃', description: 'Petit train ×2.', cost: 800, effect: { kind: 'income', target: 'petit-train', mult: 2 }, requires: { building: { id: 'petit-train', count: 3 } } },
  { id: 'sauce-secrete', name: 'Sauce secrète', emoji: '🥫', description: 'Stand de frites ×2.', cost: 2500, effect: { kind: 'income', target: 'stand-frites', mult: 2 }, requires: { building: { id: 'stand-frites', count: 3 } } },
  { id: 'peluches-geantes', name: 'Peluches géantes', emoji: '🧸', description: 'Boutique souvenirs ×2.', cost: 8000, effect: { kind: 'income', target: 'boutique-souvenirs', mult: 2 }, requires: { building: { id: 'boutique-souvenirs', count: 3 } } },
  { id: 'affiches', name: 'Affiches colorées', emoji: '📣', description: 'Visiteurs +25 %.', cost: 300, effect: { kind: 'visitors', mult: 1.25 }, requires: { building: { id: 'carrousel', count: 3 } } },
  { id: 'megaphone', name: 'Mégaphone', emoji: '📢', description: 'Coup de pub +50 %.', cost: 1500, effect: { kind: 'promo', mult: 1.5 }, requires: { building: { id: 'petit-train', count: 2 } } },
  { id: 'comptable', name: 'Comptable', emoji: '🧾', description: 'Bâtiments −10 % de coût.', cost: 5000, effect: { kind: 'costs', mult: 0.9 }, requires: { building: { id: 'stand-frites', count: 2 } } },
  { id: 'ticket-combo', name: 'Billet combiné', emoji: '🎫', description: 'Tous les revenus +25 %.', cost: 12000, effect: { kind: 'income', target: 'all', mult: 1.25 }, requires: { building: { id: 'boutique-souvenirs', count: 1 } } },
  // Aventure
  { id: 'looping-double', name: 'Double looping', emoji: '🔄', description: 'Grand huit ×2.', cost: 32000, effect: { kind: 'income', target: 'grand-huit', mult: 2 }, requires: { building: { id: 'grand-huit', count: 5 } } },
  { id: 'fantomes-pro', name: 'Fantômes pros', emoji: '🕯️', description: 'Maison hantée ×2.', cost: 110000, effect: { kind: 'income', target: 'maison-hantee', mult: 2 }, requires: { building: { id: 'maison-hantee', count: 5 } } },
  { id: 'cabines-vip', name: 'Cabines panoramiques', emoji: '🪟', description: 'Grande roue ×2.', cost: 400000, effect: { kind: 'income', target: 'grande-roue', mult: 2 }, requires: { building: { id: 'grande-roue', count: 5 } } },
  { id: 'recette-maison', name: 'Recette maison', emoji: '👨‍🍳', description: 'Food-truck ×2.', cost: 1300000, effect: { kind: 'income', target: 'food-truck', mult: 2 }, requires: { building: { id: 'food-truck', count: 5 } } },
  { id: 'pass-frisson', name: 'Pass frisson', emoji: '⚡', description: 'Sensations fortes ×1.5.', cost: 160000, effect: { kind: 'income', target: 'thrill', mult: 1.5 }, requires: { zone: 'aventure' } },
  { id: 'pass-famille', name: 'Pass famille', emoji: '👨‍👩‍👧', description: 'Famille ×1.5.', cost: 240000, effect: { kind: 'income', target: 'family', mult: 1.5 }, requires: { building: { id: 'grande-roue', count: 2 } } },
  { id: 'menu-enfant', name: 'Menu enfant', emoji: '🍔', description: 'Restauration ×1.5.', cost: 530000, effect: { kind: 'income', target: 'food', mult: 1.5 }, requires: { building: { id: 'food-truck', count: 2 } } },
  { id: 'bonnes-affaires', name: 'Bonnes affaires', emoji: '🛍️', description: 'Boutiques ×1.5.', cost: 800000, effect: { kind: 'income', target: 'shop', mult: 1.5 }, requires: { building: { id: 'boutique-souvenirs', count: 8 } } },
  { id: 'bouche-a-oreille', name: 'Bouche-à-oreille', emoji: '🗣️', description: 'Visiteurs +40 %.', cost: 270000, effect: { kind: 'visitors', mult: 1.4 }, requires: { zone: 'aventure' } },
  { id: 'negociation', name: 'Négociation', emoji: '🤝', description: 'Bâtiments −10 % de coût.', cost: 1100000, effect: { kind: 'costs', mult: 0.9 }, requires: { zone: 'aventure' } },
  { id: 'dormir-tranquille', name: 'Gardien de nuit', emoji: '🌙', description: 'Hors ligne +25 %.', cost: 530000, effect: { kind: 'offline', mult: 1.25 }, requires: { zone: 'aventure' } },
  { id: 'mecano', name: 'Mécano de service', emoji: '🔧', description: 'Réparations −40 %.', cost: 400000, effect: { kind: 'repair', mult: 0.6 }, requires: { zone: 'aventure' } },
  { id: 'trefle', name: 'Trèfle à quatre feuilles', emoji: '🍀', description: 'Événements positifs +30 %.', cost: 670000, effect: { kind: 'eventLuck', mult: 1.3 }, requires: { zone: 'aventure' } },
  // Aqua
  { id: 'vagues', name: 'Piscine à vagues', emoji: '🌊', description: 'Aquatique ×1.5.', cost: 3200000, effect: { kind: 'income', target: 'water', mult: 1.5 }, requires: { zone: 'aqua' } },
  { id: 'toboggan-geant', name: 'Toboggan géant', emoji: '🛝', description: 'Toboggans ×2.', cost: 10000000, effect: { kind: 'income', target: 'toboggans', mult: 2 }, requires: { building: { id: 'toboggans', count: 5 } } },
  { id: 'glaces-artisanales', name: 'Glaces artisanales', emoji: '🍨', description: 'Bar à glaces ×2.', cost: 48000000, effect: { kind: 'income', target: 'bar-glaces', mult: 2 }, requires: { building: { id: 'bar-glaces', count: 5 } } },
  { id: 'repos-prolonge', name: 'Hôtel du parc', emoji: '🏨', description: 'Plafond hors ligne +4 h.', cost: 12000000, effect: { kind: 'offlineCap', hours: 4 }, requires: { zone: 'aqua' } },
  { id: 'flash-mob', name: 'Flash mob', emoji: '💃', description: 'Coup de pub 40 % plus rapide.', cost: 8000000, effect: { kind: 'promoCooldown', mult: 0.6 }, requires: { zone: 'aqua' } },
  { id: 'abonnement', name: 'Abonnement annuel', emoji: '📆', description: 'Tous les revenus ×1.5.', cost: 40000000, effect: { kind: 'income', target: 'all', mult: 1.5 }, requires: { zone: 'aqua' } },
  // Fantasy / Espace
  { id: 'sortilege', name: 'Sortilège de foule', emoji: '🔮', description: 'Visiteurs ×1.5.', cost: 8e7, effect: { kind: 'visitors', mult: 1.5 }, requires: { zone: 'fantasy' } },
  { id: 'cargaison', name: 'Cargaison spatiale', emoji: '📦', description: 'Bâtiments −15 % de coût.', cost: 4e8, effect: { kind: 'costs', mult: 0.85 }, requires: { zone: 'fantasy' } },
  { id: 'licence-royale', name: 'Licence royale', emoji: '👑', description: 'Tous les revenus ×2.', cost: 8e8, effect: { kind: 'income', target: 'all', mult: 2 }, requires: { zone: 'fantasy' } },
  { id: 'hyperespace', name: 'Hyperespace', emoji: '🌌', description: 'Tous les revenus ×3.', cost: 8e9, effect: { kind: 'income', target: 'all', mult: 3 }, requires: { zone: 'espace' } },
];
