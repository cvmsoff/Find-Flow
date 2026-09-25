'use strict';

/* Le panneau de détails d'un appareil : dernière position, batterie, statut,
   et le bouton qui bascule le mode « volé ».

   ON CONFIRME AVANT UNE ACTION QUI COMPTE : marquer un appareil volé (ou revenir
   à normal) change son comportement. On demande donc confirmation, en une phrase
   claire, jamais un code technique. */

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
    titre.textContent = a.nom; // textContent : pas d'échappement à faire, le navigateur s'en charge

    const ech = FindFlow.format.echapper;
    corps.innerHTML = '' +
      ligne('Propriétaire', ech(a.proprietaire)) +
      ligne('Type', FindFlow.format.typeLisible(a.type)) +
      ligne('État', a.mode === 'vole' ? 'VOLÉ' : (enLigne ? 'En ligne' : 'Hors ligne')) +
      ligne('Dernière position', FindFlow.format.depuis(a.derniereMaj) +
        ' (' + FindFlow.format.dateHeure(a.derniereMaj) + ')') +
      ligne('Batterie', FindFlow.format.batterie(a.batterie)) +
      ligne('Précision', a.position && a.position.precision_m
        ? '≈ ' + a.position.precision_m + ' m' : '—') +
      ligne('Coordonnées', a.position
        ? a.position.lat.toFixed(5) + ', ' + a.position.lng.toFixed(5) : '—');

    const bouton = document.getElementById('bouton-vol');
    if (bouton) {
      if (a.mode === 'vole') {
        bouton.textContent = 'Ne plus considérer comme volé';
        bouton.className = 'bouton bouton-neutre';
      } else {
        bouton.textContent = 'Signaler cet appareil volé';
        bouton.className = 'bouton bouton-alerte';
      }
      bouton.onclick = function () { basculerVol(a); };
    }

    if (FindFlow.carte) FindFlow.carte.centrerSur(a);
  }

  function ligne(cle, valeurDejaSure) {
    return '<div class="detail-ligne"><div class="detail-cle">' + cle +
      '</div><div class="detail-valeur">' + valeurDejaSure + '</div></div>';
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

  return { initialiser, mettreAJour, ouvrir, masquer };
})();
