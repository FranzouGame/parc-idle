# GAME_DESIGN — Parc Idle

Jeu de gestion / idle : le joueur construit un parc d'attractions, s'occupe de visiteurs
qui ont des besoins, gère des aléas, puis « rouvre » le parc avec des bonus permanents.

## Boucle de jeu (30 s → 3 h)

1. **Court terme (secondes)** : acheter des bâtiments, utiliser le *Coup de pub* (cooldown 45 s),
   réagir aux événements (VIP à saluer, pannes à réparer).
2. **Moyen terme (minutes)** : équilibrer le parc. Les visiteurs ont des besoins ; un parc
   déséquilibré (trop de manèges, pas de stands) perd en satisfaction donc en revenu.
   Acheter des améliorations, débloquer les zones suivantes.
3. **Long terme (heures)** : atteindre le prestige (« Réouverture »), dépenser les
   étoiles en bonus permanents, recommencer plus vite, débloquer plus loin.

Il y a **toujours un objectif visible** (`Derived.nextGoal`) : prochaine zone, prochain palier
de possession, prochain succès proche, ou prestige disponible.

## Ressources

| Ressource | Rôle |
|---|---|
| Pièces 🪙 | Monnaie principale. Gagnées en continu (aussi hors ligne). Servent à tout acheter. |
| Visiteurs 👥 | Indicateur dérivé (non dépensable). Dépend de l'attrait des bâtiments. Détermine la demande de chaque besoin. |
| Satisfaction 😊 | 0..1, dérivée de la couverture des besoins. Multiplie le revenu (de 0.5× à 1×). |
| Étoiles ⭐ | Monnaie de prestige. +5 % de revenu par étoile gagnée à vie, et dépensables en bonus permanents. |

## Zones (5)

Chaque zone a 4 bâtiments. Débloquer une zone coûte des pièces ; elle donne accès à de
nouveaux bâtiments plus rentables et de nouvelles catégories de besoin.

1. **Entrée** (départ) : carrousel, petit train, stand de frites, boutique souvenirs.
2. **Aventure** : grand huit, maison hantée, grande roue, food-truck.
3. **Aqua Park** : toboggans, rivière rapide, bar à glaces, boutique maillots.
4. **Royaume Fantasy** : château enchanté, montagnes russes dragon, banquet médiéval, boutique magique.
5. **Espace** : fusée, simulateur, food-lab, planétarium.

## Besoins des visiteurs (le « pas redondant »)

Catégories : `thrill`, `family`, `water` (envies de sensations), `food` (faim), `shop` (envie d'achat).
Chaque catégorie présente dans une zone débloquée a une demande = visiteurs × part (`BALANCE.needs`).
L'offre = somme des `capacity` des bâtiments de cette catégorie. Couverture = min(1, offre/demande).
La satisfaction moyenne pondérée module le revenu. Conséquence : le joueur alterne
attractions (attirent des visiteurs) et stands (servent les visiteurs) ; rien n'est « toujours acheter le
dernier bâtiment ».

## Bâtiments

Prix du n-ième exemplaire = baseCost × costGrowth^n. Paliers de possession (10, 25, 50, 100, 200) :
×2 de revenu sur ce bâtiment. Le revenu de chaque bâtiment est multiplié par les améliorations,
les étoiles, les succès, la satisfaction, les événements.

## Améliorations (~30)

Achat unique, visibles selon une condition (zone débloquée, N exemplaires). Effets : revenu d'un
bâtiment / d'une catégorie / global, visiteurs, réduction de coûts, hors-ligne, coup de pub, chance
d'événements, réparations.

## Événements aléatoires

Délai entre événements : 60–150 s (une fois ≥ 3 bâtiments). Un seul événement de chaque type à la fois.

- 🌧️ **Pluie** (négatif, 60 s) : thrill/water −40 %, shop +25 % (parapluies).
- 🤩 **Visiteur VIP** (positif, 25 s) : cliquer pour l'accueillir → récompense = 120 s de revenu.
- 🔧 **Panne** (négatif, 90 s) : un manège s'arrête ; 5 clics pour réparer, ou payer 60 s de son revenu.
- ☀️ **Canicule** (mixte, 50 s) : water/food +50 %, thrill −20 %.
- 🎉 **Grande foule** (positif, 45 s) : visiteurs ×1.8.
- 🎟️ **Ticket doré** (positif, 15 s) : cliquer 1 fois → 300 s de revenu.

Hors ligne : aucun événement ne tombe, aucune panne ne s'accumule.

## Succès (~30)

Conditions déclaratives (`stat >= seuil`). Chaque succès donne +1 % de revenu global (additif).
Familles : richesse totale, bâtiments possédés, zones, visiteurs, événements, prestige, temps de jeu,
coups de pub, hors ligne.

## Hors ligne

Au retour : gain = revenu/s × min(écart, plafond 8 h + bonus) × efficacité (50 % + bonus).
Un écran « Bon retour ! » résume. Pas d'événements simulés.

## Prestige — « Réouverture du parc »

- Étoiles à vie = floor((totalEarned / 1e6)^0.5). Gain = étoiles à vie − déjà gagnées.
- Premier prestige visé : ~2 h de jeu actif (≥ 1 étoile à 1e6 pièces gagnées, mais intéressant
  vers 4e7 pièces → 6 étoiles).
- Réinitialise : pièces, bâtiments, zones, améliorations. Conserve : étoiles, bonus de prestige, succès, stats, réglages.
- Boutique de prestige (~8 bonus à niveaux) : revenu global, coûts réduits, hors-ligne plus long, pièces
  de départ, coup de pub, chance d'événements, visiteurs.

## Rythme cible (à valider par l'Agent Joueur)

| Étape | Temps de jeu actif |
|---|---|
| 1er bâtiment → 4 bâtiments | 0–3 min |
| Zone 2 (Aventure) | 8–12 min |
| Zone 3 (Aqua) | 30–40 min |
| Zone 4 (Fantasy) | 70–90 min |
| Zone 5 (Espace) | 2–3 h |
| 1er prestige conseillé | 2–3 h |
| Runs suivantes : zone 5 en | < 1 h |
