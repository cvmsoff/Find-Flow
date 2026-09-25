'use strict';

/* Démarrage de Find-Flow : on assemble les morceaux et on branche l'écoute
   des appareils. Un seul flux de données : le stockage pousse une liste, et la
   carte, la liste et les détails s'y accrochent tous. Il n'y a donc jamais deux
   sources de vérité qui pourraient se contredire à l'écran. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

(function demarrer() {
  document.addEventListener('DOMContentLoaded', function () {
    /* L'écran de démarrage disparaît une fois la page prête. */
    const splash = document.getElementById('splash');
    if (splash) setTimeout(function () { splash.hidden = true; }, 900);

    FindFlow.carte.initialiser('carte');
    FindFlow.liste.initialiser(ouvrirAppareil);
    FindFlow.details.initialiser();
    FindFlow.aPropos.initialiser();

    /* Une seule écoute alimente tout le monde. */
    FindFlow.stockage.ecouter(function (appareils) {
      FindFlow.liste.mettreAJour(appareils);
      FindFlow.details.mettreAJour(appareils);
      FindFlow.carte.afficher(appareils, ouvrirAppareil);
    });
  });

  function ouvrirAppareil(id) {
    FindFlow.details.ouvrir(id);
  }
})();
