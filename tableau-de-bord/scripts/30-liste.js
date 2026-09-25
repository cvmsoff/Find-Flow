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
    majStats();
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

      /* Une seule pastille d'alerte, la plus grave : dans une liste on veut le
         signal fort d'un coup d'œil, pas cinq étiquettes empilées. */
      const alertes = FindFlow.alertes.pour(a);
      const badge = alertes.length
        ? '<span class="badge-alerte">' + FindFlow.format.echapper(alertes[0].texte) +
            (alertes.length > 1 ? ' +' + (alertes.length - 1) : '') + '</span>'
        : '';

      /* Avatar rond coloré (le même appareil garde sa couleur) + anneau de statut. */
      const avatar = '<span class="avatar" style="background:' + FindFlow.format.couleurAvatar(a.id) + '">' +
        FindFlow.format.initiales(a.nom) + '</span>';
      const batt = (typeof a.batterie === 'number')
        ? '<span class="appareil-batt">' + Math.round(a.batterie) + ' %</span>' : '';

      return '' +
        '<button class="appareil ' + classeEtat + '" data-id="' + FindFlow.format.echapper(a.id) + '">' +
          avatar +
          '<span class="appareil-texte">' +
            '<span class="appareil-nom">' + FindFlow.format.echapper(a.nom) + '</span>' +
            '<span class="appareil-sous">' + etiquetteEtat + ' · ' +
              FindFlow.format.depuis(a.derniereMaj) + '</span>' +
            badge +
          '</span>' +
          batt +
        '</button>';
    }).join('');

    conteneur.querySelectorAll('.appareil').forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        if (surSelection) surSelection(bouton.getAttribute('data-id'));
      });
    });
  }

  function majStats() {
    const enLigne = tousLesAppareils.filter(FindFlow.format.estEnLigne).length;
    const alertes = FindFlow.alertes.compterAppareils(tousLesAppareils);
    poser('stat-total', tousLesAppareils.length);
    poser('stat-en-ligne', enLigne);
    poser('stat-alertes', alertes);
    poser('stat-batterie', batterieMoyenne());
  }

  /* Batterie moyenne des seuls appareils qui savent la donner (un PC de bureau
     branché n'a pas de batterie : l'inclure fausserait la moyenne). */
  function batterieMoyenne() {
    const avecBatterie = tousLesAppareils.filter(function (a) { return typeof a.batterie === 'number'; });
    if (!avecBatterie.length) return '—';
    const somme = avecBatterie.reduce(function (t, a) { return t + a.batterie; }, 0);
    return Math.round(somme / avecBatterie.length) + ' %';
  }

  function poser(id, valeur) {
    const el = document.getElementById(id);
    if (el) el.textContent = valeur;
  }

  return { initialiser, mettreAJour };
})();
