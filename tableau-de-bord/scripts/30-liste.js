'use strict';

/* La liste des appareils, avec recherche et compteurs.

   La recherche et les compteurs sont là parce que la charte les demande dans
   toutes les listes : on doit retrouver un appareil vite, et voir d'un coup
   d'œil combien sont en ligne et combien sont marqués volés. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.liste = (function creerListe() {
  let tousLesAppareils = [];
  let filtre = '';
  let surSelection = null;

  function initialiser(surSelectionAppareil) {
    surSelection = surSelectionAppareil;
    const champ = document.getElementById('recherche');
    if (champ) {
      champ.addEventListener('input', function () {
        filtre = champ.value.trim().toLowerCase();
        redessiner();
      });
    }
  }

  function mettreAJour(appareils) {
    tousLesAppareils = appareils;
    redessiner();
  }

  function appareilsFiltres() {
    if (!filtre) return tousLesAppareils;
    return tousLesAppareils.filter(function (a) {
      return (a.nom + ' ' + a.proprietaire).toLowerCase().indexOf(filtre) !== -1;
    });
  }

  function redessiner() {
    majCompteurs();
    const conteneur = document.getElementById('liste-appareils');
    if (!conteneur) return;

    const visibles = appareilsFiltres();
    if (visibles.length === 0) {
      conteneur.innerHTML = '<p class="vide">Aucun appareil ne correspond.</p>';
      return;
    }

    /* Tout texte venant d'un appareil est échappé avant d'entrer dans la page. */
    conteneur.innerHTML = visibles.map(function (a) {
      const enLigne = FindFlow.format.estEnLigne(a);
      const classeEtat = a.mode === 'vole' ? 'vole' : (enLigne ? 'en-ligne' : 'hors-ligne');
      const etiquetteEtat = a.mode === 'vole' ? 'VOLÉ'
        : (enLigne ? 'En ligne' : 'Hors ligne');
      return '' +
        '<button class="appareil ' + classeEtat + '" data-id="' + FindFlow.format.echapper(a.id) + '">' +
          '<span class="pastille"></span>' +
          '<span class="appareil-texte">' +
            '<span class="appareil-nom">' + FindFlow.format.echapper(a.nom) + '</span>' +
            '<span class="appareil-info">' +
              FindFlow.format.typeLisible(a.type) + ' · ' +
              FindFlow.format.echapper(a.proprietaire) +
            '</span>' +
            '<span class="appareil-maj">' + etiquetteEtat + ' · ' +
              FindFlow.format.depuis(a.derniereMaj) + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    conteneur.querySelectorAll('.appareil').forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        if (surSelection) surSelection(bouton.getAttribute('data-id'));
      });
    });
  }

  function majCompteurs() {
    const enLigne = tousLesAppareils.filter(FindFlow.format.estEnLigne).length;
    const voles = tousLesAppareils.filter(function (a) { return a.mode === 'vole'; }).length;
    poser('compteur-total', tousLesAppareils.length);
    poser('compteur-en-ligne', enLigne);
    poser('compteur-voles', voles);
  }

  function poser(id, valeur) {
    const el = document.getElementById(id);
    if (el) el.textContent = valeur;
  }

  return { initialiser, mettreAJour };
})();
