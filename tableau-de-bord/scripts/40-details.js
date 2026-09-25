'use strict';

/* Le panneau de détails d'un appareil : alertes, dernière position, batterie,
   trajet récent, clôture géographique, et les actions (itinéraire, mode volé).

   ON CONFIRME AVANT UNE ACTION QUI COMPTE : marquer un appareil volé, poser ou
   retirer une clôture change son comportement. On demande donc confirmation, en
   une phrase claire, jamais un code technique. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.details = (function creerDetails() {
  let idAffiche = null;
  let dernierEtat = [];

  function initialiser() {
    const fermer = document.getElementById('details-fermer');
    if (fermer) fermer.addEventListener('click', masquer);
  }

  function mettreAJour(appareils) {
    dernierEtat = appareils;
    if (idAffiche) dessiner(); // garder le panneau à jour en « temps réel »
  }

  function ouvrir(id) {
    idAffiche = id;
    dessiner();
    const panneau = document.getElementById('details');
    if (panneau) panneau.hidden = false;
  }

  function masquer() {
    idAffiche = null;
    if (FindFlow.carte) FindFlow.carte.effacerSelection();
    const panneau = document.getElementById('details');
    if (panneau) panneau.hidden = true;
  }

  function trouver() {
    return dernierEtat.filter(function (a) { return a.id === idAffiche; })[0] || null;
  }

  function dessiner() {
    const a = trouver();
    const corps = document.getElementById('details-corps');
    const titre = document.getElementById('details-titre');
    if (!a || !corps || !titre) { masquer(); return; }

    const enLigne = FindFlow.format.estEnLigne(a);
    titre.textContent = a.nom; // textContent : le navigateur échappe tout seul
    const ech = FindFlow.format.echapper;

    corps.innerHTML =
      blocAlertes(a) +
      blocPhoto(a) +
      ligne('Propriétaire', ech(a.proprietaire)) +
      ligne('Type', FindFlow.format.typeLisible(a.type)) +
      ligne('État', a.mode === 'vole' ? 'VOLÉ' : (enLigne ? 'En ligne' : 'Hors ligne')) +
      ligne('Dernière position', FindFlow.format.depuis(a.derniereMaj) +
        ' (' + FindFlow.format.dateHeure(a.derniereMaj) + ')') +
      ligne('Batterie', FindFlow.format.batterie(a.batterie)) +
      ligne('Précision', a.position && a.position.precision_m
        ? '≈ ' + a.position.precision_m + ' m' : '—') +
      ligne('Carte SIM', a.sim ? ech(a.sim.numero) + (a.sim.changee ? ' (changée)' : '') : '—') +
      ligne('Coordonnées', a.position
        ? a.position.lat.toFixed(5) + ', ' + a.position.lng.toFixed(5) : '—') +
      blocClrure(a) +
      blocHistorique(a);

    brancherActions(a);
    if (FindFlow.carte) {
      FindFlow.carte.centrerSur(a);
      FindFlow.carte.montrerSelection(a); // trace + clôture sur la carte
    }
  }

  /* La photo de l'appareil : un aperçu rond + le bouton pour la changer.
     Une vraie photo (secrétaire, PC, logo) rend la carte bien plus lisible que
     des initiales — c'est l'esprit d'un traceur façon Life360. */
  function blocPhoto(a) {
    const av = FindFlow.format.contenuAvatar(a);
    return '<div class="bloc-photo">' +
      '<span class="avatar avatar-grand" style="background:' + av.fond + '">' + av.html + '</span>' +
      '<div class="actions-photo">' +
        '<button id="btn-photo" class="pilule pilule-petite">' +
          (a.photo ? 'Changer la photo' : 'Ajouter une photo') + '</button>' +
        (a.photo ? '<button id="btn-photo-retirer" class="pilule pilule-petite">Retirer</button>' : '') +
      '</div>' +
    '</div>';
  }

  /* Ouvre le sélecteur de fichier, réduit l'image et l'enregistre. On réduit
     AVANT de stocker : une photo de téléphone fait plusieurs Mo, inutile de
     garder tout ça pour une pastille de 40 px — on la ramène à 160 px. */
  function choisirPhoto(a) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', function () {
      const fichier = input.files && input.files[0];
      if (!fichier) return;
      const lecteur = new FileReader();
      lecteur.onload = function () { reduireImage(lecteur.result, 160, function (petite) {
        FindFlow.stockage.definirPhoto(a.id, petite);
      }); };
      lecteur.readAsDataURL(fichier);
    });
    input.click();
  }

  function reduireImage(dataUrl, cote, quandPret) {
    const img = new Image();
    img.onload = function () {
      /* On recadre au centre en carré, puis on dessine à la taille voulue. */
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      const c = document.createElement('canvas');
      c.width = cote; c.height = cote;
      c.getContext('2d').drawImage(img, sx, sy, min, min, 0, 0, cote, cote);
      quandPret(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = function () { /* fichier illisible : on ne change rien */ };
    img.src = dataUrl;
  }

  /* En haut de la fiche : les alertes, en clair. Rien si tout va bien. */
  function blocAlertes(a) {
    const alertes = FindFlow.alertes.pour(a);
    if (!alertes.length) return '';
    const items = alertes.map(function (al) {
      return '<li>' + FindFlow.format.echapper(al.texte) + '</li>';
    }).join('');
    return '<ul class="alertes-fiche">' + items + '</ul>';
  }

  /* La clôture géographique : son état, et de quoi la poser ou la retirer. */
  function blocClrure(a) {
    let etat;
    if (!a.zone) etat = 'Aucune zone définie';
    else etat = FindFlow.geo.estDansZone(a.position, a.zone)
      ? 'Dans sa zone (rayon ' + a.zone.rayon_m + ' m)'
      : 'HORS de sa zone';
    return '<h3>Clôture géographique</h3>' +
      '<p class="detail-valeur">' + etat + '</p>' +
      '<div class="actions-zone">' +
        '<label class="champ-en-ligne">Rayon (m) ' +
          '<input id="zone-rayon" type="number" min="50" step="50" value="' +
          FindFlow.config.rayonZoneParDefaut + '"></label>' +
        '<button id="bouton-zone-poser" class="pilule pilule-petite">Poser la zone ici</button>' +
        (a.zone ? '<button id="bouton-zone-retirer" class="pilule pilule-petite">Retirer la zone</button>' : '') +
      '</div>';
  }

  /* Le trajet récent : quelques dernières positions, la plus récente en premier.
     C'est ce qui aide à retrouver un appareil, plus que le seul point actuel. */
  function blocHistorique(a) {
    const h = (a.historique || []).slice().reverse().slice(0, 6);
    if (!h.length) return '';
    const items = h.map(function (p) {
      return '<li>' + FindFlow.format.dateHeure(p.at) + ' — ' +
        p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + '</li>';
    }).join('');
    return '<h3>Trajet récent</h3><ol class="historique">' + items + '</ol>';
  }

  function ligne(cle, valeurDejaSure) {
    return '<div class="detail-ligne"><div class="detail-cle">' + cle +
      '</div><div class="detail-valeur">' + valeurDejaSure + '</div></div>';
  }

  function brancherActions(a) {
    const voler = document.getElementById('bouton-vol');
    if (voler) {
      if (a.mode === 'vole') {
        voler.textContent = 'Ne plus considérer comme volé';
        voler.className = 'pilule';
      } else {
        voler.textContent = 'Signaler volé';
        voler.className = 'pilule pilule-alerte';
      }
      voler.onclick = function () { basculerVol(a); };
    }

    const itineraire = document.getElementById('bouton-itineraire');
    if (itineraire) itineraire.onclick = function () { ouvrirItineraire(a); };

    const poser = document.getElementById('bouton-zone-poser');
    if (poser) poser.onclick = function () { poserZone(a); };
    const retirer = document.getElementById('bouton-zone-retirer');
    if (retirer) retirer.onclick = function () { retirerZone(a); };

    const photo = document.getElementById('btn-photo');
    if (photo) photo.onclick = function () { choisirPhoto(a); };
    const photoRetirer = document.getElementById('btn-photo-retirer');
    if (photoRetirer) photoRetirer.onclick = function () { FindFlow.stockage.definirPhoto(a.id, null); };
  }

  function basculerVol(a) {
    const versVole = a.mode !== 'vole';
    const message = versVole
      ? 'Signaler « ' + a.nom + ' » comme VOLÉ ?\n\n' +
        'L’appareil enverra sa position plus souvent. À faire seulement en cas de vol réel.'
      : 'Repasser « ' + a.nom + ' » en état normal ?';
    if (!window.confirm(message)) return;
    FindFlow.stockage.definirMode(a.id, versVole ? 'vole' : 'normal');
  }

  /* Ouvre l'itinéraire vers l'appareil dans l'application de cartes du poste.
     Nécessite internet ; c'est une aide ponctuelle (aller récupérer l'appareil),
     pas une fonction de suivi. */
  function ouvrirItineraire(a) {
    if (!a.position) return;
    const url = 'https://www.google.com/maps/dir/?api=1&destination=' +
      a.position.lat + ',' + a.position.lng;
    window.open(url, '_blank', 'noopener');
  }

  function poserZone(a) {
    if (!a.position) return;
    const champ = document.getElementById('zone-rayon');
    const rayon = Math.max(50, parseInt(champ && champ.value, 10) || FindFlow.config.rayonZoneParDefaut);
    if (!window.confirm('Poser une zone de ' + rayon + ' m autour de la position actuelle de « ' +
        a.nom + ' » ?\nTu seras alerté s’il en sort.')) return;
    FindFlow.stockage.definirZone(a.id, { lat: a.position.lat, lng: a.position.lng, rayon_m: rayon });
  }

  function retirerZone(a) {
    if (!window.confirm('Retirer la clôture de « ' + a.nom + ' » ?')) return;
    FindFlow.stockage.definirZone(a.id, null);
  }

  return { initialiser, mettreAJour, ouvrir, masquer };
})();
