'use strict';

/* Les alertes d'un appareil, calculées à un seul endroit.

   POURQUOI CENTRALISER : la liste affiche une pastille d'alerte, la fiche
   affiche le détail, l'en-tête affiche un total. Si chacun décidait dans son
   coin « qu'est-ce qu'une alerte », les trois se contrediraient. Ici la règle
   est écrite une fois.

   Ce qu'on considère comme une alerte, et pourquoi :
   - VOLÉ        : l'appareil est marqué volé, c'est le plus grave.
   - HORS ZONE   : sorti de sa clôture — souvent le premier signe d'un vol.
   - SIM CHANGÉE : un voleur a mis sa carte ; le nouveau numéro est une piste.
   - BATTERIE    : va s'éteindre, on risque de le perdre de vue.
   - HORS LIGNE  : plus de signal depuis un moment. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.alertes = {

  /* Renvoie la liste des alertes d'un appareil, de la plus grave à la moins
     grave. Une liste vide = tout va bien. */
  pour(appareil) {
    const liste = [];

    if (appareil.mode === 'vole') {
      liste.push({ gravite: 3, texte: 'Signalé volé' });
    }
    if (appareil.zone && !FindFlow.geo.estDansZone(appareil.position, appareil.zone)) {
      liste.push({ gravite: 3, texte: 'Sorti de sa zone' });
    }
    if (appareil.sim && appareil.sim.changee) {
      liste.push({ gravite: 2, texte: 'Carte SIM changée' });
    }
    if (typeof appareil.batterie === 'number' &&
        appareil.batterie <= FindFlow.config.seuilBatterieFaible) {
      liste.push({ gravite: 1, texte: 'Batterie faible (' + Math.round(appareil.batterie) + ' %)' });
    }
    if (!FindFlow.format.estEnLigne(appareil)) {
      liste.push({ gravite: 1, texte: 'Hors ligne' });
    }

    return liste.sort(function (a, b) { return b.gravite - a.gravite; });
  },

  /* Combien d'appareils ont au moins une alerte : le chiffre de l'en-tête. */
  compterAppareils(appareils) {
    return appareils.filter(function (a) {
      return FindFlow.alertes.pour(a).length > 0;
    }).length;
  }
};
