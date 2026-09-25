'use strict';

/* La carte des appareils (Leaflet, recopié en local dans vendor/).

   CARTE ET HORS LIGNE, LE CHOIX ASSUMÉ : le fond de carte (les « tuiles »)
   vient forcément d'internet — aucune carte du monde ne tient sur un poste.
   Donc quand le réseau est coupé, on n'affiche PAS un écran vide : les points
   des appareils restent placés sur un fond neutre et un bandeau discret prévient
   « Fond de carte indisponible ». La position d'un appareil, elle, ne dépend pas
   d'internet une fois reçue — c'est ça qui compte le jour d'un vol. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.carte = (function creerCarte() {
  let carte = null;
  const couchesParAppareil = new Map();
  let bandeauHorsLigne = null;

  function couleur(appareil) {
    if (appareil.mode === 'vole') return '#c0392b';           // rouge : volé
    if (FindFlow.format.estEnLigne(appareil)) return '#1f7a5a'; // vert : en ligne
    return '#7a8b99';                                          // gris : silencieux
  }

  function initialiser(idElement) {
    const c = FindFlow.config.centreParDefaut;
    carte = L.map(idElement, { zoomControl: true }).setView([c.lat, c.lng], c.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).on('tileerror', montrerBandeauHorsLigne).addTo(carte);

    return carte;
  }

  function montrerBandeauHorsLigne() {
    if (bandeauHorsLigne) return;
    bandeauHorsLigne = document.getElementById('carte-hors-ligne');
    if (bandeauHorsLigne) bandeauHorsLigne.hidden = false;
  }

  /* Redessine les points à chaque nouvelle liste. On remplace les couches d'un
     coup : c'est peu d'appareils, inutile de compliquer avec une mise à jour
     fine tant que ça reste fluide. */
  function afficher(appareils, surClic) {
    if (!carte) return;
    for (const couche of couchesParAppareil.values()) carte.removeLayer(couche);
    couchesParAppareil.clear();

    appareils.forEach(function (a) {
      if (!a.position) return;
      const groupe = L.layerGroup();

      /* Le rond de précision : un PC localisé par Wi-Fi est « quelque part
         dans ce cercle », il ne faut pas faire croire à une position au mètre. */
      if (a.position.precision_m) {
        L.circle([a.position.lat, a.position.lng], {
          radius: a.position.precision_m,
          color: couleur(a), weight: 1, opacity: 0.4,
          fillColor: couleur(a), fillOpacity: 0.08
        }).addTo(groupe);
      }

      const point = L.circleMarker([a.position.lat, a.position.lng], {
        radius: 9, color: '#fff', weight: 2,
        fillColor: couleur(a), fillOpacity: 1
      }).addTo(groupe);

      /* Le contenu de l'infobulle est échappé : un nom d'appareil piégé
         s'affiche, il ne s'exécute pas. */
      point.bindTooltip(FindFlow.format.echapper(a.nom), { direction: 'top' });
      point.on('click', function () { if (surClic) surClic(a.id); });

      groupe.addTo(carte);
      couchesParAppareil.set(a.id, groupe);
    });
  }

  /* Centrer sur un appareil quand on le choisit dans la liste. */
  function centrerSur(appareil) {
    if (carte && appareil && appareil.position) {
      carte.setView([appareil.position.lat, appareil.position.lng], 16);
    }
  }

  return { initialiser, afficher, centrerSur };
})();
