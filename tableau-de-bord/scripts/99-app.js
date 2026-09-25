'use strict';

/* Démarrage de Find-Flow : on assemble les morceaux et on branche l'écoute
   des appareils. Un seul flux de données : le stockage pousse une liste, et la
   carte, la liste et les détails s'y accrochent tous. Il n'y a donc jamais deux
   sources de vérité qui pourraient se contredire à l'écran. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

(function demarrer() {
  document.addEventListener('DOMContentLoaded', function () {
    /* L'écran de démarrage joue son animation (logo app puis logo label) puis
       s'efface en fondu. Deux temps : on lance le fondu, puis on le retire. */
    const splash = document.getElementById('splash');
    if (splash) {
      setTimeout(function () { splash.classList.add('ferme'); }, 2000);
      setTimeout(function () { splash.hidden = true; }, 2450);
    }

    FindFlow.theme.initialiser();
    FindFlow.carte.initialiser('carte');
    FindFlow.liste.initialiser(ouvrirAppareil);
    FindFlow.details.initialiser();
    FindFlow.appairage.initialiser();
    FindFlow.aPropos.initialiser();

    brancherActionsHaut();

    /* On garde le dernier état sous la main pour les boutons « Voir tout » et
       « Actualiser », qui agissent sur ce que l'écran montre à cet instant. */
    let dernierEtat = [];
    FindFlow.stockage.ecouter(function (appareils) {
      dernierEtat = appareils;
      FindFlow.liste.mettreAJour(appareils);
      FindFlow.details.mettreAJour(appareils);
      FindFlow.carte.afficher(appareils, ouvrirAppareil);
    });

    function brancherActionsHaut() {
      lier('btn-actualiser', function () { FindFlow.stockage.rafraichir(); });
      lier('btn-voir-tout', function () { FindFlow.carte.ajusterSurTous(dernierEtat); });
      lier('btn-ajouter-haut', FindFlow.appairage.ouvrir);
      lier('nav-ajouter', FindFlow.appairage.ouvrir);
      /* « Tableau de bord » : on referme les volets pour revenir à la vue carte. */
      lier('nav-tableau', function () {
        FindFlow.details.masquer();
      });
    }
  });

  function ouvrirAppareil(id) {
    FindFlow.details.ouvrir(id);
  }

  function lier(id, action) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', action);
  }
})();
