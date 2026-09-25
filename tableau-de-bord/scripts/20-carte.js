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
    installerFond();
    return carte;
  }

  /* Pose (ou repose) le fond de carte selon les réglages :
     - une clé MapTiler est saisie  -> la carte OpenStreetMap (MapTiler) ;
     - sinon                        -> un fond de secours Esri, sans clé, pour
       ne jamais laisser l'utilisateur devant une carte vide.
     On peut la rappeler après que l'utilisateur a collé sa clé, sans recharger
     la page : on retire l'ancien fond et on met le nouveau. */
  let coucheFond = null;
  function installerFond() {
    if (!carte) return;
    if (coucheFond) { carte.removeLayer(coucheFond); coucheFond = null; }

    const cle = (FindFlow.reglages.lire().cleCarte || '').trim();
    if (cle) {
      /* Le style « openstreetmap » de MapTiler = l'aspect OpenStreetMap classique.
         La clé voyage dans l'adresse de la tuile ; elle vient des réglages, pas
         du code. */
      coucheFond = L.tileLayer(
        'https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=' + encodeURIComponent(cle), {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors, © MapTiler'
        });
    } else {
      /* Fond de secours Esri (sans clé). ATTENTION : Esri attend {z}/{y}/{x}
         (le y AVANT le x) ; inversés, les tuiles seraient au mauvais endroit. */
      coucheFond = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Fond de carte © Esri (secours — ajoute ta clé pour OpenStreetMap)'
        });
    }
    /* Nouveau fond = nouvel essai : on cache le bandeau « hors ligne » ; il
       reviendra tout seul si les tuiles échouent encore. */
    const bandeau = document.getElementById('carte-hors-ligne');
    if (bandeau) bandeau.hidden = true;

    coucheFond.on('tileerror', montrerBandeauHorsLigne).addTo(carte);
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

  /* Couche « sélection » : la trace du trajet et la clôture de l'appareil
     ouvert. On la garde à part des points pour pouvoir l'effacer d'un coup
     quand on ferme la fiche, sans redessiner tous les appareils. */
  let coucheSelection = null;

  function effacerSelection() {
    if (carte && coucheSelection) { carte.removeLayer(coucheSelection); coucheSelection = null; }
  }

  function montrerSelection(appareil) {
    if (!carte || !appareil) return;
    effacerSelection();
    coucheSelection = L.layerGroup().addTo(carte);

    /* La trace : le trajet récent, en pointillés, pour voir d'où vient l'appareil. */
    if (appareil.historique && appareil.historique.length > 1) {
      const points = appareil.historique.map(function (p) { return [p.lat, p.lng]; });
      L.polyline(points, { color: '#155c43', weight: 3, opacity: 0.7, dashArray: '6 6' })
        .addTo(coucheSelection);
    }

    /* La clôture géographique, s'il y en a une : le cercle où l'appareil doit
       rester. En rouge s'il en est sorti, pour que l'œil aille droit dessus. */
    if (appareil.zone) {
      const dedans = FindFlow.geo.estDansZone(appareil.position, appareil.zone);
      L.circle([appareil.zone.lat, appareil.zone.lng], {
        radius: appareil.zone.rayon_m,
        color: dedans ? '#1f7a5a' : '#c0392b', weight: 2,
        fillColor: dedans ? '#1f7a5a' : '#c0392b', fillOpacity: 0.06
      }).addTo(coucheSelection);
    }
  }

  return {
    initialiser, afficher, centrerSur, montrerSelection, effacerSelection,
    rafraichirFond: installerFond
  };
})();
