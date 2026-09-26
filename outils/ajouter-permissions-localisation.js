'use strict';

/* Ajoute les permissions de LOCALISATION au manifeste Android.
   Sert aux DEUX applications qui envoient une position : l'app mobile
   tout-en-un (qui peut suivre l'appareil sur lequel elle tourne) et l'agent.
   Capacitor ne met pas ces permissions d'office ; sans elles, Android refuse
   le GPS. On les insère juste après la balise <manifest …>, une seule fois.
   (Le suivi écran éteint / en arrière-plan viendra plus tard : il demande une
   permission supplémentaire et un service de premier plan.) */

const fs = require('fs');
const path = require('path');

const manifeste = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

const permissions = [
  '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />'
].join('\n');

function principal() {
  if (!fs.existsSync(manifeste)) {
    console.error('Manifeste introuvable : lance d’abord `npx cap add android`.');
    process.exit(1);
  }
  let xml = fs.readFileSync(manifeste, 'utf8');
  if (xml.indexOf('ACCESS_FINE_LOCATION') !== -1) { console.log('Permissions déjà présentes.'); return; }
  xml = xml.replace(/(<manifest[^>]*>)/, '$1\n' + permissions);
  fs.writeFileSync(manifeste, xml);
  console.log('Permissions de localisation ajoutées au manifeste.');
}

principal();
