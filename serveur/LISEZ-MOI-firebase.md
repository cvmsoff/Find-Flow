# Brancher Find-Flow sur Firebase — ce que tu fais, ce que je fais

Firebase, c'est le serveur qui recevra les vraies positions des appareils et qui
fera marcher la synchronisation hors ligne. C'est gratuit au démarrage.

## Ce que TU fais (tu cliques, je ne le fais pas à ta place)

1. Va sur **console.firebase.google.com** et connecte-toi avec ton compte Google.
2. **Créer un projet** → nomme-le `find-flow` (ou ce que tu veux). Tu peux
   désactiver Google Analytics, on n'en a pas besoin.
3. Dans le projet, menu **Build → Firestore Database** → **Créer une base** →
   choisis un emplacement proche (ex. `eur3` ou `europe-west`) → démarre en
   **mode production** (on met nos propres règles, voir plus bas).
4. Menu **Build → Authentication** → **Commencer** → active au moins
   **E-mail/mot de passe** (pour ton compte patron). On ajoutera d'autres modes
   plus tard si besoin.
5. **Réglages du projet** (roue dentée en haut) → section **Tes applications** →
   icône **Web** (`</>`) → enregistre une app « Find-Flow ». Firebase te montre
   un petit bloc `firebaseConfig` avec des valeurs (apiKey, projectId, etc.).
   **Ce bloc n'est pas un secret** (il est prévu pour être dans une page web),
   mais tu le colleras toi-même dans le fichier de config — pas dans notre
   conversation.

Quand ces 5 points sont faits, **dis-le-moi**. Je te dirai alors exactement où
coller le bloc `firebaseConfig` (un fichier local que je prépare), et je branche
le tableau de bord dessus.

## Ce que JE prépare pendant ce temps

- Les **règles de sécurité** de la base, versionnées dans
  `serveur/regles-firestore/` (déjà commencé : `01-regles-de-base.rules`).
  Elles font que chaque compte ne voit QUE ses appareils, côté serveur.
- Le remplacement de `07-stockage.js` (les données de démonstration) par un
  module qui parle à Firestore, en gardant EXACTEMENT le même contrat, pour ne
  toucher à rien d'autre dans l'app.

## Comment on publiera les règles (plus tard, toi aussi tu cliques)

Dans la console Firebase → **Firestore Database → Règles**, tu colleras le
contenu de `01-regles-de-base.rules` puis **Publier**. Je ne publie jamais de
règles de sécurité à ta place ; je te donne le fichier, tu colles, tu cliques.

## Ce qui ne change pas

- Ta clé de carte MapTiler reste dans les réglages de l'app, comme aujourd'hui.
- Rien de sensible n'est écrit en dur dans le code ni poussé dans le dépôt.
