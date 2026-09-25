'use strict';

/* Configuration de Find-Flow.

   RÈGLE CAMS-LAB : les réglages de l'entreprise ne sont JAMAIS écrits en dur
   dans le code. Le même logiciel doit pouvoir être réinstallé chez un autre
   client en changeant seulement ces réglages, pas une ligne de code. Ils sont
   donc conservés sur le poste (localStorage) et modifiables dans l'écran
   Réglages. Ce qui suit ne sert que de valeurs par défaut au premier lancement. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.config = {
  /* La version se retrouve à l'écran « À propos » (règle de livraison). */
  version: '0.1.0',

  /* Réglages d'entreprise par défaut. « <Client> » sera remplacé par le vrai
     nom lors de l'installation chez un client — via l'écran Réglages, pas ici. */
  reglagesParDefaut: {
    nomEntreprise: '<Client>',
    adresse: '',
    telephones: '',
    email: '',
    rccm: '',
    compteContribuable: '',
    /* Clé du fournisseur de carte (MapTiler), saisie par l'utilisateur dans les
       réglages. Elle reste sur le poste — jamais écrite en dur ici, jamais
       poussée dans le dépôt. Vide = on retombe sur un fond de carte de secours. */
    cleCarte: '',
    /* Configuration Firebase (le bloc du projet), collée par l'utilisateur.
       Reste sur le poste, change d'un client à l'autre. Vide = données de démo. */
    configFirebase: '',
    /* Style de carte : 'plan' (rues) ou 'satellite' (image réelle + noms).
       La vue satellite aide à reconnaître un lieu précis. */
    styleCarte: 'plan'
  },

  /* Où se centre la carte au démarrage quand aucun appareil n'a encore de
     position : Abidjan. On développe pour la Côte d'Ivoire. */
  centreParDefaut: { lat: 5.3599, lng: -4.0083, zoom: 12 },

  /* Au-delà de ce délai sans nouvelle position, un appareil est considéré
     « hors ligne » à l'écran. Cinq minutes : assez pour tolérer une coupure
     réseau courte sans faire clignoter le statut à chaque seconde. */
  secondesAvantHorsLigne: 5 * 60,

  /* En dessous de ce niveau, on alerte « batterie faible » : un appareil qui
     va s'éteindre est un appareil qu'on risque de perdre de vue. */
  seuilBatterieFaible: 20,

  /* Rayon proposé par défaut quand on pose une clôture géographique, en mètres.
     200 m : la taille d'une cour d'entreprise ou d'un pâté de maisons. */
  rayonZoneParDefaut: 200,

  /* Nombre de positions gardées dans l'historique d'un appareil. On garde le
     trajet récent, pas toute la vie de l'appareil : c'est ce qui aide à
     retrouver un appareil, pas à ficher les allées et venues d'une personne. */
  longueurHistorique: 20
};

/* Lecture/écriture des réglages d'entreprise sur le poste.
   On tolère un localStorage absent ou en erreur (navigation privée, stockage
   bloqué) : dans ce cas on retombe sur les valeurs par défaut plutôt que de
   planter l'application. */
FindFlow.reglages = {
  lire() {
    try {
      const brut = window.localStorage.getItem('findflow.reglages');
      if (!brut) return Object.assign({}, FindFlow.config.reglagesParDefaut);
      return Object.assign({}, FindFlow.config.reglagesParDefaut, JSON.parse(brut));
    } catch (e) {
      return Object.assign({}, FindFlow.config.reglagesParDefaut);
    }
  },
  enregistrer(reglages) {
    try {
      window.localStorage.setItem('findflow.reglages', JSON.stringify(reglages));
      return true;
    } catch (e) {
      return false;
    }
  }
};
