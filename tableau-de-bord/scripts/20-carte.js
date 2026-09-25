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

      /* Le marqueur est un avatar rond avec le nom en dessous (façon Life360).
         L'anneau prend la couleur du statut, l'avatar la couleur stable de
         l'appareil. Nom et initiales sont échappés : un nom piégé s'affiche,
         il ne s'exécute pas. */
      const nomSur = FindFlow.format.echapper(a.nom);
      const icone = L.divIcon({
        className: '',
        html:
          '<div class="marqueur ' + classeStatut(a) + '">' +
            '<div class="marqueur-avatar" style="background:' + FindFlow.format.couleurAvatar(a.id) + '">' +
              FindFlow.format.initiales(a.nom) + '</div>' +
            '<div class="marqueur-nom">' + nomSur + '</div>' +
          '</div>',
        iconSize: [40, 40], iconAnchor: [20, 20]
      });
      const marqueur = L.marker([a.position.lat, a.position.lng], { icon: icone }).addTo(groupe);
      marqueur.on('click', function () { if (surClic) surClic(a.id); });

      groupe.addTo(carte);
      couchesParAppareil.set(a.id, groupe);
    });
  }

  /* La classe de statut décide la couleur de l'anneau autour de l'avatar. */
  function classeStatut(a) {
    if (a.mode === 'vole') return 'vole';
    return FindFlow.format.estEnLigne(a) ? 'en-ligne' : 'hors-ligne';
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

  /* Recentre la carte pour montrer TOUS les appareils d'un coup (« Voir tout »).
     Utile quand ils sont éparpillés dans la ville. */
  function ajusterSurTous(appareils) {
    if (!carte) return;
    const points = (appareils || [])
      .filter(function (a) { return a.position; })
      .map(function (a) { return [a.position.lat, a.position.lng]; });
    if (points.length === 0) return;
    if (points.length === 1) { carte.setView(points[0], 15); return; }
    carte.fitBounds(points, { padding: [40, 40] });
  }

  return {
    initialiser, afficher, centrerSur, montrerSelection, effacerSelection,
    ajusterSurTous, rafraichirFond: installerFond
  };
})();
