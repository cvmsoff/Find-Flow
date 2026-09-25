'use strict';

/* FAUSSES DONNÉES, POUR VOIR LE RENDU AVANT DE BRANCHER LE VRAI SERVEUR.
   Trois appareils autour d'Abidjan : le téléphone de la secrétaire, son PC
   portable, et l'ordinateur personnel du patron (celui qu'on surveille en cas
   de vol). Ce fichier disparaîtra le jour où 06-stockage.js parlera à Firebase ;
   il ne contient aucune vraie position de personne. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.donneesDemo = function creerAppareilsDemo() {
  const maintenant = Date.now();
  const ilYa = (minutes) => new Date(maintenant - minutes * 60 * 1000).toISOString();

  return [
    {
      id: 'appareil-001',
      nom: 'Téléphone secrétaire',
      type: 'telephone',
      proprietaire: 'Awa (secrétariat)',
      position: { lat: 5.3364, lng: -4.0267, precision_m: 12 },
      batterie: 74,
      mode: 'normal',
      derniereMaj: ilYa(2)
    },
    {
      id: 'appareil-002',
      nom: 'PC portable secrétariat',
      type: 'ordinateur',
      proprietaire: 'Awa (secrétariat)',
      /* Un PC n'a pas de GPS : sa position vient du Wi-Fi/IP, donc moins précise.
         On le montre honnêtement avec une grande précision (rayon large). */
      position: { lat: 5.3402, lng: -4.0195, precision_m: 320 },
      batterie: 41,
      mode: 'normal',
      derniereMaj: ilYa(11)
    },
    {
      id: 'appareil-003',
      nom: 'Ordinateur perso (patron)',
      type: 'ordinateur',
      proprietaire: 'Moi',
      position: { lat: 5.3550, lng: -3.9968, precision_m: 280 },
      batterie: null,
      /* Volontairement laissé silencieux depuis longtemps pour montrer l'état
         « hors ligne » à l'écran. */
      mode: 'normal',
      derniereMaj: ilYa(47)
    }
  ];
};
