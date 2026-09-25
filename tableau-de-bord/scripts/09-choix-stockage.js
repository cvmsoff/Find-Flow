'use strict';

/* Choisit la source de données au démarrage :
   - une configuration Firebase est présente dans les réglages -> on branche
     l'app sur Firebase (le vrai serveur) ;
   - sinon -> on reste sur les données de démonstration.

   C'est le SEUL endroit qui décide. Le reste de l'app ne voit toujours que
   FindFlow.stockage, sans savoir lequel des deux répond. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

(function choisirStockage() {
  const config = (FindFlow.reglages.lire().configFirebase || '').trim();
  if (config) {
    FindFlow.stockage = FindFlow.stockageFirebase;
  } else {
    FindFlow.stockage = FindFlow.stockageDemo;
  }
})();
