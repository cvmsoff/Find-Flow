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
  /* Réglages communs aux tuiles :
     - maxZoom 22 + maxNativeZoom 20 : on peut zoomer PLUS profond que ce que le
       fournisseur fabrique (Leaflet agrandit les dernières tuiles), pour
       s'approcher comme sur Google au lieu de buter trop tôt ;
     - keepBuffer garde des tuiles autour de l'écran, prêtes à l'affichage ;
     - updateWhenZooming évite de recharger pendant le geste de zoom (mise à jour
       une fois le zoom fini), ce qui supprime le flash. */
  function optionsTuiles() {
    return { maxZoom: 22, maxNativeZoom: 20, keepBuffer: 6, updateWhenZooming: false };
  }

  let coucheFond = null;
  function installerFond() {
    if (!carte) return;
    if (coucheFond) { carte.removeLayer(coucheFond); coucheFond = null; }

    const reglages = FindFlow.reglages.lire();
    const cle = (reglages.cleCarte || '').trim();
    if (cle) {
      /* Deux styles MapTiler selon le réglage :
         - 'satellite' -> style « hybrid » : l'image réelle AVEC les noms de rues ;
         - sinon -> 'streets-v2' : le plan qui affiche le PLUS de points d'intérêt
           (commerces, lieux) parmi les styles MapTiler — plus que le style OSM
           brut, même si ça n'atteint pas la densité de Google.
         La clé voyage dans l'adresse de la tuile ; elle vient des réglages. */
      const style = reglages.styleCarte === 'satellite' ? 'hybrid' : 'streets-v2';
      coucheFond = L.tileLayer(
        'https://api.maptiler.com/maps/' + style + '/{z}/{x}/{y}.jpg?key=' + encodeURIComponent(cle),
        Object.assign({ attribution: '© OpenStreetMap contributors, © MapTiler' }, optionsTuiles()));
    } else {
      /* Fond de secours Esri (sans clé). ATTENTION : Esri attend {z}/{y}/{x}
         (le y AVANT le x) ; inversés, les tuiles seraient au mauvais endroit. */
      coucheFond = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        Object.assign({ attribution: 'Fond de carte © Esri (secours — ajoute ta clé pour OpenStreetMap)' }, optionsTuiles()));
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
      const av = FindFlow.format.contenuAvatar(a);
      const icone = L.divIcon({
        className: '',
        html:
          '<div class="marqueur ' + classeStatut(a) + '">' +
            '<div class="marqueur-avatar" style="background:' + av.fond + '">' + av.html + '</div>' +
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

  /* Trace la route entre MA position et l'appareil, et fixe la carte dessus.
     On demande d'abord le vrai chemin routier (service OSRM) ; s'il ne répond
     pas, on retombe sur une ligne directe « à vol d'oiseau » avec la distance.
     Dans les deux cas l'utilisateur voit où aller. `quandPret` reçoit les infos
     (distance en m, durée en s ou null, et si c'est un vrai trajet routier). */
  let coucheItineraire = null;

  function effacerItineraire() {
    if (carte && coucheItineraire) { carte.removeLayer(coucheItineraire); coucheItineraire = null; }
  }

  function tracerItineraire(origine, dest, quandPret) {
    if (!carte || !origine || !dest) return;
    effacerItineraire();

    const dessiner = function (pointsLatLng, infos) {
      coucheItineraire = L.layerGroup().addTo(carte);
      L.polyline(pointsLatLng, { color: '#7c5cff', weight: 6, opacity: 0.85 }).addTo(coucheItineraire);
      /* Départ (« Moi ») et arrivée (l'appareil), bien visibles, pour ne pas
         perdre le sens de l'itinéraire. */
      L.circleMarker([origine.lat, origine.lng], {
        radius: 8, color: '#fff', weight: 3, fillColor: '#7c5cff', fillOpacity: 1
      }).bindTooltip('Moi (départ)', { direction: 'top', permanent: false }).addTo(coucheItineraire);
      L.circleMarker([dest.lat, dest.lng], {
        radius: 8, color: '#fff', weight: 3, fillColor: '#16a34a', fillOpacity: 1
      }).bindTooltip('Appareil (arrivée)', { direction: 'top', permanent: false }).addTo(coucheItineraire);
      carte.fitBounds(pointsLatLng, { padding: [70, 70] });
      if (quandPret) quandPret(infos);
    };

    const versLigneDroite = function () {
      dessiner([[origine.lat, origine.lng], [dest.lat, dest.lng]],
        { distance: FindFlow.geo.distanceMetres(origine, dest), duree: null, routier: false });
    };

    /* Chemin routier réel, si le service répond. */
    const url = 'https://router.project-osrm.org/route/v1/driving/' +
      origine.lng + ',' + origine.lat + ';' + dest.lng + ',' + dest.lat +
      '?overview=full&geometries=geojson';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.routes && j.routes[0] && j.routes[0].geometry) {
          const pts = j.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
          dessiner(pts, { distance: j.routes[0].distance, duree: j.routes[0].duration, routier: true });
        } else {
          versLigneDroite();
        }
      })
      .catch(versLigneDroite);
  }

  /* Bascule Plan <-> Satellite et repose le fond aussitôt. Renvoie le nouveau
     style pour que le bouton mette à jour son libellé. */
  function basculerStyle() {
    const r = FindFlow.reglages.lire();
    r.styleCarte = r.styleCarte === 'satellite' ? 'plan' : 'satellite';
    FindFlow.reglages.enregistrer(r);
    installerFond();
    return r.styleCarte;
  }
  function styleActuel() { return FindFlow.reglages.lire().styleCarte === 'satellite' ? 'satellite' : 'plan'; }

  return {
    initialiser, afficher, centrerSur, montrerSelection, effacerSelection,
    ajusterSurTous, tracerItineraire, effacerItineraire,
    basculerStyle, styleActuel, rafraichirFond: installerFond
  };
})();
