'use strict';

/* POURQUOI CE SCRIPT EXISTE : la charte Cams-Lab interdit de charger une
   bibliothèque depuis un CDN et interdit que le code livré lise node_modules.
   On installe donc Leaflet avec npm (pour suivre les versions), puis on RECOPIE
   ses fichiers dans tableau-de-bord/vendor/. Ce qui part chez le client est la
   copie figée du dossier vendor/, pas une dépendance vivante. Relancer ce
   script après chaque mise à jour de Leaflet. */

const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');
const sourceLeaflet = path.join(racine, 'node_modules', 'leaflet', 'dist');
const cibleLeaflet = path.join(racine, 'tableau-de-bord', 'vendor', 'leaflet');

/* On ne recopie QUE ce dont le tableau de bord a besoin pour s'afficher.
   Les .map et les sources .esm servent au débogage de Leaflet, pas au client :
   les emporter alourdirait la livraison sans rien apporter à l'utilisateur. */
const fichiersACopier = [
  'leaflet.js',
  'leaflet.css'
];
const imagesACopier = [
  'marker-icon.png',
  'marker-icon-2x.png',
  'marker-shadow.png',
  'layers.png',
  'layers-2x.png'
];

function copier(de, vers) {
  fs.mkdirSync(path.dirname(vers), { recursive: true });
  fs.copyFileSync(de, vers);
  console.log('  recopié : ' + path.relative(racine, vers));
}

function principal() {
  if (!fs.existsSync(sourceLeaflet)) {
    console.error('ÉCHEC : Leaflet introuvable dans node_modules.');
    console.error('Lance d’abord :  npm install');
    process.exit(1);
  }

  console.log('Recopie de Leaflet vers vendor/ :');
  for (const nom of fichiersACopier) {
    copier(path.join(sourceLeaflet, nom), path.join(cibleLeaflet, nom));
  }
  for (const nom of imagesACopier) {
    copier(path.join(sourceLeaflet, 'images', nom), path.join(cibleLeaflet, 'images', nom));
  }

  /* Firebase : on recopie les versions « compat » (UMD), qui s'utilisent avec de
     simples balises <script>, SANS étape de compilation. On ne prend que ce dont
     le tableau de bord a besoin : l'app, la base (Firestore) et l'authentification. */
  const sourceFirebase = path.join(racine, 'node_modules', 'firebase');
  const cibleFirebase = path.join(racine, 'tableau-de-bord', 'vendor', 'firebase');
  const fichiersFirebase = [
    'firebase-app-compat.js',
    'firebase-firestore-compat.js',
    'firebase-auth-compat.js'
  ];
  if (fs.existsSync(sourceFirebase)) {
    console.log('Recopie de Firebase vers vendor/ :');
    for (const nom of fichiersFirebase) {
      copier(path.join(sourceFirebase, nom), path.join(cibleFirebase, nom));
    }
  }

  console.log('Terminé.');
}

principal();
