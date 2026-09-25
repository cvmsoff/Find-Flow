'use strict';

/* CE QUE CE BANC PROTÈGE ET POURQUOI :
   - Que le module unique d'accès aux données (07-stockage.js) rende des COPIES :
     un écran ne doit pas pouvoir modifier par accident les données que lisent
     les autres écrans. C'est la règle « une seule source de vérité ».
   - Que « signaler volé » change bien l'état, et rien d'autre.
   Ce module est la seule porte vers le serveur : le jour où il parlera à
   Firebase, ce contrat devra tenir à l'identique. */

const { chargerModules, creerBanc } = require('./_banc');

module.exports = function lancer() {
  const FF = chargerModules(['01-config.js', '05-format.js', '06-donnees-demo.js', '07-stockage.js']);
  const banc = creerBanc('Données et mode volé (07-stockage.js)');

  const depart = FF.stockage.dernierEtat();
  banc.verifier('trois appareils de démonstration au départ', depart.length === 3);

  // --- Copies défensives : ce que le logiciel ne doit PAS faire ---
  depart[0].nom = 'NOM MODIFIÉ PAR ACCIDENT';
  const relu = FF.stockage.dernierEtat();
  banc.verifier('modifier la liste rendue ne change pas les données internes',
    relu[0].nom !== 'NOM MODIFIÉ PAR ACCIDENT');

  // --- Mode volé ---
  const id = relu[0].id;
  return FF.stockage.definirMode(id, 'vole').then(function () {
    const apres = FF.stockage.dernierEtat();
    const cible = apres.filter(function (a) { return a.id === id; })[0];
    banc.verifier('l’appareil visé passe bien en « vole »', cible.mode === 'vole');
    banc.verifier('les autres appareils ne sont pas touchés',
      apres.filter(function (a) { return a.mode === 'vole'; }).length === 1);

    return FF.stockage.definirMode(id, 'normal').then(function () {
      const fin = FF.stockage.dernierEtat().filter(function (a) { return a.id === id; })[0];
      banc.verifier('on peut repasser l’appareil en « normal »', fin.mode === 'normal');
      return banc.bilan();
    });
  });
};
