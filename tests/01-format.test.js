'use strict';

/* CE QUE CE BANC PROTÈGE ET POURQUOI :
   - Qu'un nom d'appareil piégé S'AFFICHE et ne s'exécute JAMAIS (sécurité :
     un nom de client ou d'appareil vient d'un humain, il peut être malveillant).
   - Que le statut « en ligne / hors ligne » se calcule à partir de l'heure de
     la dernière position, pas d'un drapeau : un appareil volé qu'on éteint doit
     basculer hors ligne tout seul.
   Ce sont deux promesses faites à l'écran ; si elles cassent, on le voit ici
   avant le client. */

const { chargerModules, creerBanc } = require('./_banc');

module.exports = function lancer() {
  const FF = chargerModules(['01-config.js', '05-format.js']);
  const banc = creerBanc('Affichage et sécurité (05-format.js)');
  const f = FF.format;

  // --- Échappement HTML : ce que le logiciel ne doit PAS faire ---
  const piege = '<img src=x onerror="volerTout()">';
  const echappe = f.echapper(piege);
  banc.verifier('un nom piégé ne contient plus de < exécutable',
    echappe.indexOf('<img') === -1);
  banc.verifier('le nom piégé reste lisible (échappé en &lt;)',
    echappe.indexOf('&lt;img') === 0);
  banc.verifier('un texte vide ou absent ne fait pas planter',
    f.echapper(null) === '' && f.echapper(undefined) === '');

  // --- Statut en ligne / hors ligne ---
  const maintenant = new Date().toISOString();
  const vieux = new Date(Date.now() - (FF.config.secondesAvantHorsLigne + 60) * 1000).toISOString();
  banc.verifier('un appareil vu à l’instant est « en ligne »',
    f.estEnLigne({ derniereMaj: maintenant }) === true);
  banc.verifier('un appareil silencieux depuis longtemps est « hors ligne »',
    f.estEnLigne({ derniereMaj: vieux }) === false);
  banc.verifier('une date invalide n’est jamais « en ligne »',
    f.estEnLigne({ derniereMaj: 'pas-une-date' }) === false);

  // --- Petits formats ---
  banc.verifier('« à l’instant » pour une date très récente',
    f.depuis(maintenant) === 'à l’instant');
  banc.verifier('une batterie absente s’affiche « — », pas « null »',
    f.batterie(null) === '—');
  banc.verifier('un type inconnu ne montre pas de code brut',
    f.typeLisible('bidule') === 'Appareil');

  return banc.bilan();
};
