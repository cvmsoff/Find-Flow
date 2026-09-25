'use strict';

/* Calculs de distance sur la carte, au même endroit pour tout le monde.

   POURQUOI UN SEUL ENDROIT : la distance sert à deux choses — savoir si un
   appareil est sorti de sa clôture géographique, et mesurer un déplacement.
   Les deux doivent donner le MÊME résultat, sinon un appareil serait « dans la
   zone » pour un écran et « dehors » pour un autre. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.geo = {

  /* Distance en mètres entre deux points GPS (formule de haversine).
     La Terre est ronde : à Abidjan, un simple calcul plat se tromperait de
     plusieurs mètres, assez pour déclencher une fausse alerte de sortie de zone. */
  distanceMetres(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371000; // rayon de la Terre en mètres
    const rad = (d) => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  },

  /* Un appareil est « dans sa zone » si sa position est dans le rayon.
     Pas de zone définie = on ne peut pas être « dehors » : on renvoie vrai,
     pour ne jamais alerter à tort un appareil qu'on n'a pas voulu clôturer. */
  estDansZone(position, zone) {
    if (!zone || !position) return true;
    return FindFlow.geo.distanceMetres(position, zone) <= zone.rayon_m;
  }
};
