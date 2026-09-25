'use strict';

/* CE QUE CE BANC PROTÈGE ET POURQUOI :
   Les alertes sont ce qui fait réagir le patron : batterie qui lâche, appareil
   sorti de sa zone, SIM changée (signe de vol), appareil silencieux. Si la règle
   se trompe, on alerte pour rien (et on n'y croit plus) ou on rate un vrai vol.
   On éprouve donc CHAQUE cause d'alerte, et le cas « tout va bien = aucune ». */

const { chargerModules, creerBanc } = require('./_banc');

module.exports = function lancer() {
  const FF = chargerModules(['01-config.js', '04-geo.js', '05-format.js', '50-alertes.js']);
  const banc = creerBanc('Alertes (50-alertes.js)');
  const maintenant = new Date().toISOString();

  function textes(appareil) {
    return FF.alertes.pour(appareil).map(function (a) { return a.texte; }).join(' | ');
  }

  const sain = {
    position: { lat: 5.34, lng: -4.02 }, batterie: 80, mode: 'normal',
    sim: { numero: '+225 07', changee: false }, zone: null, derniereMaj: maintenant
  };
  banc.verifier('un appareil sain n’a aucune alerte',
    FF.alertes.pour(sain).length === 0);

  const batterieBasse = Object.assign({}, sain, { batterie: 10 });
  banc.verifier('batterie basse déclenche une alerte',
    textes(batterieBasse).indexOf('Batterie faible') !== -1);

  const simChangee = Object.assign({}, sain, { sim: { numero: '+225 05', changee: true } });
  banc.verifier('SIM changée déclenche une alerte',
    textes(simChangee).indexOf('Carte SIM changée') !== -1);

  const horsZone = Object.assign({}, sain, {
    zone: { lat: 5.34, lng: -4.02, rayon_m: 100 },
    position: { lat: 5.36, lng: -4.05 }
  });
  banc.verifier('un appareil sorti de sa zone déclenche une alerte',
    textes(horsZone).indexOf('Sorti de sa zone') !== -1);

  const vieux = new Date(Date.now() - 3600 * 1000).toISOString();
  const horsLigne = Object.assign({}, sain, { derniereMaj: vieux });
  banc.verifier('un appareil silencieux est « hors ligne »',
    textes(horsLigne).indexOf('Hors ligne') !== -1);

  /* Le plus grave d'abord : un appareil volé ET hors ligne doit montrer « volé »
     en tête, pas « hors ligne ». */
  const grave = Object.assign({}, sain, { mode: 'vole', derniereMaj: vieux });
  banc.verifier('l’alerte la plus grave passe en premier',
    FF.alertes.pour(grave)[0].texte === 'Signalé volé');

  banc.verifier('le compteur compte les appareils en alerte, pas les alertes',
    FF.alertes.compterAppareils([sain, batterieBasse, grave]) === 2);

  return banc.bilan();
};
