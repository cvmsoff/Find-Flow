# Find-Flow

Localisation en temps réel des appareils de l'entreprise (téléphone de la secrétaire,
PC portable) et surveillance de l'ordinateur personnel en cas de vol.

Développé par **Cams-Lab (Seya Gilles Cames)** — cams-lab@proton.me — © 2026 Cams-Lab.

## Où on en est

Première brique : **le tableau de bord** (l'écran qui montre les appareils sur une carte).
Il tourne aujourd'hui sur des **positions de démonstration** pour voir le rendu, avant de
brancher le vrai serveur. Il fonctionne sans aucune étape de compilation.

### Pour l'ouvrir

Ouvrir le fichier `tableau-de-bord/index.html` dans un navigateur.
Le fond de carte a besoin d'internet ; sans réseau, les appareils restent affichés
et un bandeau le signale — la position d'un appareil, elle, ne dépend pas d'internet.

### Ce qui marche déjà

- Carte des appareils, avec un cercle de précision (un PC localisé par Wi-Fi est « quelque part »).
- Liste avec **recherche** et **compteurs** (total / en ligne / volés).
- Fiche d'un appareil : propriétaire, état, dernière position, batterie, coordonnées.
- Bouton **« Signaler volé »** (avec confirmation) : l'appareil rapporte alors plus souvent.
- Écran **« Infos & réglages »** signé Cams-Lab, avec les réglages d'entreprise
  (nom, adresse, téléphones, e-mail, RCCM, compte contribuable) — jamais écrits en dur.
- Écran de démarrage avec le logo Cams-Lab.

## Les dossiers

```
tableau-de-bord/
  index.html            L'écran principal
  styles/               Le style (base + mise en page)
  scripts/              Le code, un fichier = un sujet, chargés dans l'ordre :
    01-config.js          Version + réglages d'entreprise
    05-format.js          Dates, durées, échappement des noms (sécurité)
    06-donnees-demo.js    Fausses positions (disparaîtra avec le vrai serveur)
    07-stockage.js        LA SEULE PORTE VERS LE SERVEUR (à brancher sur Firebase)
    20-carte.js           La carte (Leaflet)
    30-liste.js           La liste + recherche + compteurs
    40-details.js         La fiche d'un appareil + mode volé
    90-a-propos.js        À propos signé Cams-Lab + réglages
    99-app.js             Le démarrage
  vendor/leaflet/       Leaflet recopié en local (jamais depuis un CDN)
  logo/                 Logo Cams-Lab embarqué
outils/sync-vendor.js   Recopie Leaflet de node_modules vers vendor/
tests/                  Bancs d'essai (npm test)
```

## Les commandes

```
npm install          Installe Leaflet (une seule dépendance)
npm run sync-vendor  Recopie Leaflet dans vendor/ (à relancer après une mise à jour)
npm test             Lance les bancs d'essai (affiche OK / ÉCHEC en français)
```

## La suite (pas encore fait)

1. **Le serveur** : choisir le projet Firebase, y brancher `07-stockage.js` à la place
   des données de démonstration. C'est le seul fichier à réécrire.
2. **Les agents** : le petit programme qui envoie la position, sur téléphone Android
   puis sur PC Windows.
3. **Comptes et rôles** (administrateur / responsable / employé) + journal d'activité.
4. **La version téléphone** du tableau de bord.
