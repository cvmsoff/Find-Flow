'use strict';

/* Fabrique la version autonome de l'AGENT (agent-dist/) pour en faire un APK.
   Même principe que preparer-mobile.js : on recopie l'agent + les fichiers
   partagés dont il a besoin, et on réécrit « ../tableau-de-bord/ » -> « partage/ ».
   L'agent n'affiche pas de carte : il n'a donc pas besoin de Leaflet. */

const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');
const bureau = path.join(racine, 'tableau-de-bord');
const agent = path.join(racine, 'agent');
const dist = path.join(racine, 'agent-dist');

const partages = [
  'styles/01-base.css',
  'scripts/01-config.js', 'scripts/06-donnees-demo.js', 'scripts/07-stockage.js',
  'scripts/08-stockage-firebase.js',
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

  copier(path.join(agent, 'styles/agent.css'), path.join(dist, 'styles/agent.css'));
  copier(path.join(agent, 'scripts/agent.js'), path.join(dist, 'scripts/agent.js'));
  for (const rel of partages) copier(path.join(bureau, rel), path.join(dist, 'partage', rel));

  let html = fs.readFileSync(path.join(agent, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  html = html.split('../tableau-de-bord/').join('partage/');
  fs.writeFileSync(path.join(dist, 'index.html'), html);

  console.log('agent-dist/ prêt (' + (partages.length + 3) + ' fichiers).');
}

principal();
