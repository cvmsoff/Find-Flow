'use strict';

/* Application MOBILE de Find-Flow.

   PRINCIPE : cet écran ne réimplémente RIEN de la logique. Il réutilise les
   mêmes modules que le bureau (données, carte, alertes, stockage/Firebase) et
   ne fait que les présenter en version téléphone : carte plein écran + feuille
   qui remonte du bas + barre d'onglets. Un total, une alerte, une position ne
   peuvent donc pas dire deux choses selon l'écran. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

(function appMobile() {
  let etat = [];        // dernière liste connue
  let idOuvert = null;  // appareil affiché en détail (ou null)

  document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    if (splash) { setTimeout(function () { splash.classList.add('ferme'); }, 1800); setTimeout(function () { splash.hidden = true; }, 2250); }

    FindFlow.carte.initialiser('carte');
    brancherFeuille();
    brancherOnglets();
    brancherReglages();
    lier('btn-voir-tout', function () { FindFlow.carte.ajusterSurTous(etat); });

    FindFlow.stockage.ecouter(function (appareils) {
      etat = appareils;
      majCompteurs();
      dessinerListe();
      FindFlow.carte.afficher(appareils, ouvrirDetail);
      if (idOuvert) dessinerDetail(); // garder le détail à jour en temps réel
    });
  });

  /* ---- Compteurs et liste ---- */
  function majCompteurs() {
    poser('compte', etat.length);
    poser('stat-en-ligne', etat.filter(FindFlow.format.estEnLigne).length);
    poser('stat-alertes', FindFlow.alertes.compterAppareils(etat));
  }

  function dessinerListe() {
    const c = document.getElementById('liste');
    if (!c) return;
    if (!etat.length) { c.innerHTML = '<p class="aide">Aucun appareil.</p>'; return; }
    c.innerHTML = etat.map(carteAppareil).join('');
    c.querySelectorAll('.carte-m').forEach(function (b) {
      b.addEventListener('click', function () { ouvrirDetail(b.getAttribute('data-id')); });
    });
  }

  function carteAppareil(a) {
    const enLigne = FindFlow.format.estEnLigne(a);
    const classe = a.mode === 'vole' ? 'vole' : (enLigne ? 'en-ligne' : 'hors-ligne');
    const etiquette = a.mode === 'vole' ? 'VOLÉ' : (enLigne ? 'En ligne' : 'Hors ligne');
    const av = FindFlow.format.contenuAvatar(a);
    const alertes = FindFlow.alertes.pour(a);
    const badge = alertes.length ? '<span class="badge-alerte">' + FindFlow.format.echapper(alertes[0].texte) +
      (alertes.length > 1 ? ' +' + (alertes.length - 1) : '') + '</span>' : '';
    const batt = (typeof a.batterie === 'number') ? '<span class="carte-m-batt">' + Math.round(a.batterie) + ' %</span>' : '';
    return '<button class="carte-m ' + classe + '" data-id="' + FindFlow.format.echapper(a.id) + '">' +
      '<span class="avatar" style="background:' + av.fond + '">' + av.html + '</span>' +
      '<span class="carte-m-texte">' +
        '<span class="carte-m-nom">' + FindFlow.format.echapper(a.nom) + '</span>' +
        '<span class="carte-m-sous">' + etiquette + ' · ' + FindFlow.format.depuis(a.derniereMaj) + '</span>' +
        badge +
      '</span>' + batt + '</button>';
  }

  /* ---- Détail ---- */
  function trouver(id) { return etat.filter(function (a) { return a.id === id; })[0] || null; }

  function ouvrirDetail(id) {
    idOuvert = id;
    basculerVue(true);
    reglerFeuille('mi');
    dessinerDetail();
    const a = trouver(id);
    if (a) { FindFlow.carte.centrerSur(a); FindFlow.carte.montrerSelection(a); }
  }

  function fermerDetail() {
    idOuvert = null;
    FindFlow.carte.effacerSelection();
    basculerVue(false);
  }

  function basculerVue(detail) {
    document.getElementById('vue-detail').hidden = !detail;
    document.getElementById('vue-liste').hidden = detail;
  }

  function dessinerDetail() {
    const a = trouver(idOuvert);
    const corps = document.getElementById('detail-corps');
    if (!a || !corps) { fermerDetail(); return; }
    const enLigne = FindFlow.format.estEnLigne(a);
    const ech = FindFlow.format.echapper;
    const av = FindFlow.format.contenuAvatar(a);

    const alertes = FindFlow.alertes.pour(a);
    const blocAlertes = alertes.length ? '<ul class="alertes-m">' +
      alertes.map(function (al) { return '<li>' + ech(al.texte) + '</li>'; }).join('') + '</ul>' : '';

    /* Caméra en direct : seulement si « c'est mon appareil » (le garde-fou). */
    const proprio = a.estAMoi
      ? '<div class="bloc-proprio-m"><label class="ligne-amoi"><input type="checkbox" id="chk-amoi" checked>' +
          '<span>C’est mon appareil</span></label>' +
          (enLigne ? '<button class="pilule pilule-petite" id="btn-camera">Caméra en direct</button>'
                   : '<span class="aide">Hors ligne : caméra dispo une fois connecté.</span>') +
          '<p id="camera-info" class="aide" hidden></p></div>'
      : '<div class="bloc-proprio-m"><label class="ligne-amoi"><input type="checkbox" id="chk-amoi">' +
          '<span>C’est mon appareil</span></label>' +
          '<p class="aide">Coche pour activer la caméra et les fonctions réservées à tes appareils.</p></div>';

    corps.innerHTML =
      '<div class="detail-entete">' +
        '<span class="avatar ' + (a.mode === 'vole' ? 'vole' : (enLigne ? 'en-ligne' : 'hors-ligne')) + '" style="background:' + av.fond + '">' + av.html + '</span>' +
        '<div><div class="detail-nom">' + ech(a.nom) + '</div>' +
        '<div class="detail-sous">' + (a.mode === 'vole' ? 'VOLÉ' : (enLigne ? 'En ligne' : 'Hors ligne')) +
          ' · ' + FindFlow.format.depuis(a.derniereMaj) + '</div></div>' +
      '</div>' +
      blocAlertes + proprio +
      dl('Propriétaire', ech(a.proprietaire)) +
      dl('Batterie', FindFlow.format.batterie(a.batterie)) +
      dl('Position', a.position ? a.position.lat.toFixed(5) + ', ' + a.position.lng.toFixed(5) : '—') +
      dl('Carte SIM', a.sim ? ech(a.sim.numero) + (a.sim.changee ? ' (changée)' : '') : '—') +
      '<div class="actions-m">' +
        '<button class="pilule" id="btn-itineraire">Itinéraire</button>' +
        '<button class="pilule" id="btn-sonner">Faire sonner</button>' +
        '<button class="pilule ' + (a.mode === 'vole' ? '' : 'pilule-alerte') + '" id="btn-vol">' +
          (a.mode === 'vole' ? 'Annuler « volé »' : 'Signaler volé') + '</button>' +
      '</div>' +
      '<p id="route-m" class="route-m" hidden></p>';

    brancherActionsDetail(a);
  }

  function dl(k, v) { return '<div class="dl"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  function brancherActionsDetail(a) {
    lier('btn-retour', fermerDetail);
    lier('btn-vol', function () {
      const versVole = a.mode !== 'vole';
      const msg = versVole ? 'Signaler « ' + a.nom + ' » comme VOLÉ ?' : 'Repasser « ' + a.nom + ' » en normal ?';
      if (window.confirm(msg)) FindFlow.stockage.definirMode(a.id, versVole ? 'vole' : 'normal');
    });
    lier('btn-itineraire', function () { itineraire(a); });
    lier('btn-sonner', function () {
      window.alert('« Faire sonner » sera actif quand l’agent Find-Flow sera installé sur l’appareil (à venir). ' +
        'L’appareil sonnera même en silencieux.');
    });
    const chk = document.getElementById('chk-amoi');
    if (chk) chk.onchange = function () { FindFlow.stockage.definirPropriete(a.id, chk.checked); };
    const cam = document.getElementById('btn-camera');
    if (cam) cam.onclick = function () {
      const i = document.getElementById('camera-info');
      if (i) { i.hidden = false; i.textContent = 'Caméra prête. Le flux s’activera avec l’agent installé sur l’appareil. Le voyant caméra reste visible.'; }
    };
  }

  function itineraire(a) {
    if (!a.position) return;
    const i = document.getElementById('route-m');
    if (i) { i.hidden = false; i.textContent = 'Localisation en cours…'; }
    if (!navigator.geolocation) { if (i) i.textContent = 'Localisation indisponible.'; return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      const origine = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      reglerFeuille('peek'); // on baisse la feuille pour voir la route
      FindFlow.carte.tracerItineraire(origine, a.position, function (r) {
        if (!i) return;
        const km = (r.distance / 1000).toFixed(1).replace('.', ',');
        i.innerHTML = (r.routier ? 'Route : ' + km + ' km' + (r.duree ? ' · ~' + Math.round(r.duree / 60) + ' min' : '')
          : 'À vol d’oiseau : ' + km + ' km') +
          ' — <a href="https://www.google.com/maps/dir/?api=1&destination=' + a.position.lat + ',' + a.position.lng +
          '" target="_blank" rel="noopener">Maps</a>';
      });
    }, function () { if (i) i.textContent = 'Active la localisation pour tracer la route.'; },
      { enableHighAccuracy: true, timeout: 10000 });
  }

  /* ---- Feuille (bottom sheet) : glisser la poignée pour agrandir/réduire ---- */
  function reglerFeuille(niveau) {
    const f = document.getElementById('feuille');
    if (!f) return;
    if (niveau === 'pleine') f.classList.add('pleine');
    else if (niveau === 'peek') f.classList.remove('pleine');
    else if (niveau === 'mi') f.classList.remove('pleine'); // mi = état par défaut
  }

  function brancherFeuille() {
    const p = document.getElementById('poignee');
    const f = document.getElementById('feuille');
    if (!p || !f) return;
    let depart = 0, hauteurDepart = 0, glisse = false;

    p.addEventListener('pointerdown', function (e) {
      glisse = true; depart = e.clientY; hauteurDepart = f.getBoundingClientRect().height;
      f.style.transition = 'none'; p.setPointerCapture(e.pointerId);
    });
    p.addEventListener('pointermove', function (e) {
      if (!glisse) return;
      const h = hauteurDepart + (depart - e.clientY);
      f.style.height = Math.max(120, Math.min(window.innerHeight * 0.86, h)) + 'px';
    });
    p.addEventListener('pointerup', function () {
      if (!glisse) return; glisse = false;
      const h = f.getBoundingClientRect().height;
      f.style.transition = ''; f.style.height = '';
      /* On accroche au niveau le plus proche : réduit ou plein. */
      if (h > window.innerHeight * 0.55) f.classList.add('pleine'); else f.classList.remove('pleine');
    });
  }

  /* ---- Onglets ---- */
  function brancherOnglets() {
    lier('ong-carte', function () { activerOnglet('ong-carte'); fermerDetail(); reglerFeuille('peek'); });
    lier('ong-liste', function () { activerOnglet('ong-liste'); fermerDetail(); reglerFeuille('pleine'); });
    lier('ong-reglages', function () { ouvrirReglages(); });
  }
  function activerOnglet(id) {
    document.querySelectorAll('.onglet').forEach(function (o) { o.classList.remove('actif'); });
    const el = document.getElementById(id); if (el) el.classList.add('actif');
  }

  /* ---- Réglages ---- */
  function brancherReglages() {
    lier('btn-reglages', ouvrirReglages);
    lier('reglages-fermer', fermerReglages);
    lier('reglages-fond', fermerReglages);
    lier('reglages-enregistrer', enregistrerReglages);
  }
  function ouvrirReglages() {
    const r = FindFlow.reglages.lire();
    valeur('reg-cle-carte', r.cleCarte); valeur('reg-firebase', r.configFirebase);
    document.getElementById('modale-reglages').hidden = false;
  }
  function fermerReglages() { document.getElementById('modale-reglages').hidden = true; }
  function enregistrerReglages() {
    const actuel = FindFlow.reglages.lire();
    const avant = actuel.configFirebase || '';
    actuel.cleCarte = lire('reg-cle-carte');
    actuel.configFirebase = lire('reg-firebase');
    FindFlow.reglages.enregistrer(actuel);
    poser('reglages-message', 'Réglages enregistrés.');
    if (FindFlow.carte.rafraichirFond) FindFlow.carte.rafraichirFond();
    if ((actuel.configFirebase || '') !== avant) { setTimeout(function () { window.location.reload(); }, 700); }
    else setTimeout(fermerReglages, 500);
  }

  /* ---- Petits utilitaires ---- */
  function lier(id, action) { const el = document.getElementById(id); if (el) el.addEventListener('click', action); }
  function poser(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function valeur(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
  function lire(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
})();
