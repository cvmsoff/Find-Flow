'use strict';

/* FAUSSES DONNÉES, POUR VOIR LE RENDU AVANT DE BRANCHER LE VRAI SERVEUR.
   Trois appareils autour d'Abidjan : le téléphone de la secrétaire, son PC
   portable, et l'ordinateur personnel du patron (celui qu'on surveille en cas
   de vol). Ce fichier disparaîtra le jour où 07-stockage.js parlera à Firebase ;
   il ne contient aucune vraie position de personne.

   On y met exprès de quoi montrer CHAQUE alerte à l'écran : un appareil sorti
   de sa zone, un à batterie faible, un dont la SIM a changé. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.donneesDemo = function creerAppareilsDemo() {
  const maintenant = Date.now();
  const ilYa = (minutes) => new Date(maintenant - minutes * 60 * 1000).toISOString();

  /* Fabrique un petit trajet : quelques positions qui mènent, minute après
     minute, jusqu'à la position actuelle. Sert à voir la trace sur la carte. */
  function trajetVers(lat, lng, pas) {
    const points = [];
    for (let i = pas; i >= 0; i--) {
      points.push({
        lat: lat - i * 0.0011,
        lng: lng - i * 0.0009,
        at: ilYa(i * 3)
      });
    }
    return points;
  }

  /* Point de référence : les locaux de l'entreprise. Les clôtures s'y accrochent. */
  const bureau = { lat: 5.3402, lng: -4.0195 };

  return [
    {
      id: 'appareil-001',
      nom: 'Téléphone secrétaire',
      type: 'telephone',
      proprietaire: 'Awa (secrétariat)',
      position: { lat: 5.3364, lng: -4.0267, precision_m: 12 },
      batterie: 74,
      mode: 'normal',
      sim: { numero: '+225 07 00 00 00 01', changee: false },
      /* Une zone centrée sur le bureau : ce téléphone est actuellement à ~700 m,
         donc HORS zone — pour montrer l'alerte de sortie de clôture. */
      zone: { lat: bureau.lat, lng: bureau.lng, rayon_m: 200 },
      historique: trajetVers(5.3364, -4.0267, 8),
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
      /* Batterie volontairement basse pour montrer l'alerte « batterie faible ». */
      batterie: 12,
      mode: 'normal',
      sim: null, // un PC n'a pas forcément de carte SIM
      /* Zone large autour du bureau, où il se trouve : pas d'alerte de sortie. */
      zone: { lat: bureau.lat, lng: bureau.lng, rayon_m: 500 },
      historique: trajetVers(5.3402, -4.0195, 5),
      derniereMaj: ilYa(11)
    },
    {
      id: 'appareil-003',
      nom: 'Ordinateur perso (patron)',
      type: 'ordinateur',
      proprietaire: 'Moi',
      position: { lat: 5.3550, lng: -3.9968, precision_m: 280 },
      batterie: null,
      /* Volontairement silencieux depuis longtemps : montre l'état « hors ligne ».
         Et sa SIM a « changé » pour montrer l'alerte la plus utile en cas de vol. */
      mode: 'normal',
      sim: { numero: '+225 05 11 22 33 44', changee: true },
      zone: null,
      historique: trajetVers(5.3550, -3.9968, 6),
      derniereMaj: ilYa(47)
    }
  ];
};
