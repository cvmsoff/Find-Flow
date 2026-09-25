'use strict';

/* PRÉPARE UNE VERSION AUTONOME DE L'APP MOBILE POUR EN FAIRE UN APK.

   En développement, l'app mobile (dossier mobile/) réutilise les fichiers du
   bureau via des chemins « ../tableau-de-bord/… » : une seule source de vérité.
   Mais un APK embarque UN seul dossier ; il ne peut pas remonter d'un cran.
   Ce script recopie donc, dans mobile-dist/, l'app mobile ET les fichiers
   partagés dont elle a besoin, et réécrit les chemins vers un dossier local
   « partage/ ». On garde ainsi la source unique côté tableau-de-bord ; ce dossier
   n'est qu'une copie fabriquée, jamais éditée à la main (comme vendor/). */

const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');
const bureau = path.join(racine, 'tableau-de-bord');
const mobile = path.join(racine, 'mobile');
const dist = path.join(racine, 'mobile-dist');

/* Fichiers partagés du bureau à embarquer (chemin relatif à tableau-de-bord). */
const partages = [
  'styles/01-base.css',
  'logo/logo-camslabs.png',
  'scripts/01-config.js', 'scripts/04-geo.js', 'scripts/05-format.js',
  'scripts/06-donnees-demo.js', 'scripts/07-stockage.js', 'scripts/08-stockage-firebase.js',
  'scripts/09-choix-stockage.js', 'scripts/20-carte.js', 'scripts/50-alertes.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'vendor/leaflet/images/marker-icon.png', 'vendor/leaflet/images/marker-icon-2x.png',
  'vendor/leaflet/images/marker-shadow.png', 'vendor/leaflet/images/layers.png',
  'vendor/leaflet/images/layers-2x.png',
  'vendor/firebase/firebase-app-compat.js', 'vendor/firebase/firebase-firestore-compat.js',
  'vendor/firebase/firebase-auth-compat.js'
];

function copier(de, vers) {
  fs.mkdirSync(path.dirname(vers), { recursive: true });
  fs.copyFileSync(de, vers);
}

function principal() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  /* 1) Les fichiers propres au mobile. */
  copier(path.join(mobile, 'styles/mobile.css'), path.join(dist, 'styles/mobile.css'));
  copier(path.join(mobile, 'scripts/mobile.js'), path.join(dist, 'scripts/mobile.js'));

  /* 2) Les fichiers partagés -> mobile-dist/partage/… */
  for (const rel of partages) {
    copier(path.join(bureau, rel), path.join(dist, 'partage', rel));
  }

  /* 3) La page : on réécrit « ../tableau-de-bord/ » -> « partage/ ». */
  let html = fs.readFileSync(path.join(mobile, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  html = html.split('../tableau-de-bord/').join('partage/');
  fs.writeFileSync(path.join(dist, 'index.html'), html);

  console.log('mobile-dist/ prêt (' + (partages.length + 3) + ' fichiers).');
}

principal();
