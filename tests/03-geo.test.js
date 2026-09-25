'use strict';

/* CE QUE CE BANC PROTÈGE ET POURQUOI :
   La clôture géographique décide « dans la zone » ou « sorti de la zone ». Une
   erreur de calcul de distance déclencherait de fausses alertes de vol (ou en
   raterait une vraie). On vérifie donc la mesure de distance et la décision
   d'appartenance à une zone. */

const { chargerModules, creerBanc } = require('./_banc');

module.exports = function lancer() {
  const FF = chargerModules(['01-config.js', '04-geo.js']);
  const banc = creerBanc('Distances et clôture (04-geo.js)');
  const geo = FF.geo;

  const bureau = { lat: 5.3402, lng: -4.0195 };

  banc.verifier('la distance d’un point à lui-même est nulle',
    geo.distanceMetres(bureau, bureau) < 0.001);

  /* ~111 m par 0,001° de latitude à l'équateur : on vérifie l'ordre de grandeur. */
  const cent = geo.distanceMetres(bureau, { lat: bureau.lat + 0.001, lng: bureau.lng });
  banc.verifier('0,001° de latitude ≈ 100–120 m', cent > 100 && cent < 125);

  const zone = { lat: bureau.lat, lng: bureau.lng, rayon_m: 200 };
  banc.verifier('un point sur le bureau est DANS une zone de 200 m',
    geo.estDansZone(bureau, zone) === true);
  banc.verifier('un point à ~700 m est HORS de la zone',
    geo.estDansZone({ lat: 5.3364, lng: -4.0267 }, zone) === false);
  banc.verifier('sans zone définie, on n’est jamais « hors zone »',
    geo.estDansZone(bureau, null) === true);

  return banc.bilan();
};
