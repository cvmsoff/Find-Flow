'use strict';

/* Lance tous les bancs d'essai avec une seule commande : npm test.
   Affiche un total en français et sort en erreur si un seul test échoue —
   pour qu'un échec ne passe jamais inaperçu. */

const bancs = [
  require('./01-format.test.js'),
  require('./02-stockage.test.js'),
  require('./03-geo.test.js'),
  require('./04-alertes.test.js')
];

async function tout() {
  let reussis = 0;
  let echoues = 0;
  for (const lancer of bancs) {
    const bilan = await lancer();
    reussis += bilan.reussis;
    echoues += bilan.echoues;
  }

  console.log('\n----------------------------------------');
  console.log('TOTAL : ' + reussis + ' réussis, ' + echoues + ' échoués.');
  if (echoues > 0) {
    console.log('RÉSULTAT : ÉCHEC — ne pas livrer en l’état.');
    process.exit(1);
  }
  console.log('RÉSULTAT : OK — tout est vert.');
}

tout().catch(function (e) {
  console.error('Un banc a planté :', e);
  process.exit(1);
});
