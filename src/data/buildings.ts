import type { BuildingDef } from '../types';

export const BUILDINGS: BuildingDef[] = [
  // Entrée
  { id: 'carrousel', name: 'Carrousel', emoji: '🎠', description: 'Le classique des petits.', zone: 'entree', category: 'family', baseCost: 15, costGrowth: 1.24, baseIncome: 0.5, capacity: 10, appeal: 5 },
  { id: 'petit-train', name: 'Petit train', emoji: '🚂', description: 'Un tour du parc tout en douceur.', zone: 'entree', category: 'thrill', baseCost: 100, costGrowth: 1.24, baseIncome: 2, capacity: 12, appeal: 8 },
  { id: 'stand-frites', name: 'Stand de frites', emoji: '🍟', description: 'Chaudes, croustillantes, salées.', zone: 'entree', category: 'food', baseCost: 300, costGrowth: 1.25, baseIncome: 4.3, capacity: 25, appeal: 0 },
  { id: 'boutique-souvenirs', name: 'Boutique souvenirs', emoji: '🧸', description: 'Peluches et magnets.', zone: 'entree', category: 'shop', baseCost: 800, costGrowth: 1.25, baseIncome: 8.9, capacity: 30, appeal: 0 },
  // Aventure
  { id: 'grand-huit', name: 'Grand huit', emoji: '🎢', description: 'Looping et cris garantis.', zone: 'aventure', category: 'thrill', baseCost: 20000, costGrowth: 1.25, baseIncome: 19, capacity: 25, appeal: 14 },
  { id: 'maison-hantee', name: 'Maison hantée', emoji: '👻', description: 'Frissons dans le noir.', zone: 'aventure', category: 'thrill', baseCost: 70000, costGrowth: 1.25, baseIncome: 50, capacity: 30, appeal: 18 },
  { id: 'grande-roue', name: 'Grande roue', emoji: '🎡', description: 'La vue sur tout le parc.', zone: 'aventure', category: 'family', baseCost: 250000, costGrowth: 1.25, baseIncome: 140, capacity: 45, appeal: 25 },
  { id: 'food-truck', name: 'Food-truck', emoji: '🌭', description: 'Burgers et hot-dogs.', zone: 'aventure', category: 'food', baseCost: 860000, costGrowth: 1.26, baseIncome: 410, capacity: 80, appeal: 0 },
  // Aqua Park
  { id: 'toboggans', name: 'Toboggans', emoji: '🛝', description: 'Glissades en eau vive.', zone: 'aqua', category: 'water', baseCost: 2500000, costGrowth: 1.26, baseIncome: 600, capacity: 60, appeal: 35 },
  { id: 'riviere-rapide', name: 'Rivière rapide', emoji: '🛶', description: 'Rapides en bouée.', zone: 'aqua', category: 'water', baseCost: 8800000, costGrowth: 1.26, baseIncome: 1600, capacity: 90, appeal: 50 },
  { id: 'bar-glaces', name: 'Bar à glaces', emoji: '🍦', description: 'Cornets à toutes les saveurs.', zone: 'aqua', category: 'food', baseCost: 31000000, costGrowth: 1.27, baseIncome: 4400, capacity: 160, appeal: 0 },
  { id: 'boutique-maillots', name: 'Boutique maillots', emoji: '🩱', description: 'Maillots et bouées.', zone: 'aqua', category: 'shop', baseCost: 110000000, costGrowth: 1.27, baseIncome: 13000, capacity: 180, appeal: 0 },
  // Royaume Fantasy
  { id: 'chateau-enchante', name: 'Château enchanté', emoji: '🏰', description: 'Contes et magie à chaque salle.', zone: 'fantasy', category: 'family', baseCost: 50000000, costGrowth: 1.27, baseIncome: 3600, capacity: 140, appeal: 80 },
  { id: 'montagnes-dragon', name: 'Montagnes russes dragon', emoji: '🐉', description: 'Le dragon crache des flammes.', zone: 'fantasy', category: 'thrill', baseCost: 180000000, costGrowth: 1.27, baseIncome: 10000, capacity: 180, appeal: 110 },
  { id: 'banquet-medieval', name: 'Banquet médiéval', emoji: '🍖', description: 'Festin à la table du roi.', zone: 'fantasy', category: 'food', baseCost: 610000000, costGrowth: 1.28, baseIncome: 29000, capacity: 320, appeal: 0 },
  { id: 'boutique-magique', name: 'Boutique magique', emoji: '🪄', description: 'Baguettes et potions.', zone: 'fantasy', category: 'shop', baseCost: 2100000000, costGrowth: 1.28, baseIncome: 84000, capacity: 350, appeal: 0 },
  // Espace
  { id: 'fusee', name: 'Fusée', emoji: '🚀', description: 'Décollage immédiat.', zone: 'espace', category: 'thrill', baseCost: 2000000000, costGrowth: 1.28, baseIncome: 57000, capacity: 320, appeal: 200 },
  { id: 'simulateur', name: 'Simulateur', emoji: '🛸', description: 'Gravité zéro simulée.', zone: 'espace', category: 'thrill', baseCost: 7000000000, costGrowth: 1.28, baseIncome: 160000, capacity: 420, appeal: 260 },
  { id: 'food-lab', name: 'Food-lab', emoji: '🧪', description: 'Cuisine moléculaire.', zone: 'espace', category: 'food', baseCost: 25000000000, costGrowth: 1.29, baseIncome: 480000, capacity: 700, appeal: 0 },
  { id: 'planetarium', name: 'Planétarium', emoji: '🔭', description: 'Les étoiles à portée de main.', zone: 'espace', category: 'family', baseCost: 86000000000, costGrowth: 1.28, baseIncome: 1500000, capacity: 800, appeal: 450 },
];
