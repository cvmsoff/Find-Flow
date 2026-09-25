'use strict';

/* Mobile Find-Flow — navigation reprise de MK Technologie : écrans côte à côte,
   barre du bas en pilule, un tap change d'écran (et on peut aussi glisser).
   Réutilise les mêmes modules que le bureau (carte, alertes, stockage, format). */

var FindFlow = window.FindFlow || (window.FindFlow = {});

(function mobile() {
  let etat = [];
  let filtre = 'tous';
  let idOuvert = null;

  const TITRES = { carte: 'Carte', appareils: 'Appareils', alertes: 'Alertes', plus: 'Plus' };

  document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    if (splash) { setTimeout(function () { splash.classList.add('ferme'); }, 1600); setTimeout(function () { splash.hidden = true; }, 2050); }

    poser('version-app', FindFlow.config.version);
    appliquerClient();

    FindFlow.carte.initialiser('carte');
    brancherBarre();
    brancherEntete();
    brancherFiltres();
    brancherPlus();
    majStyleCarte();

    FindFlow.stockage.ecouter(function (appareils) {
      etat = appareils;
      dessinerListe();
      dessinerAlertes();
      majBadges();
      FindFlow.carte.afficher(appareils, ouvrirDetail);
      if (idOuvert) dessinerDetail();
    });
  });

  /* ═══════ Navigation ═══════ */
  function brancherBarre() {
    document.querySelectorAll('.m-barre button').forEach(function (b) {
      b.addEventListener('click', function () { montrerEcran(b.dataset.ec); });
    });
    const corps = document.getElementById('corps');
    let t = null;
    corps.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        const rang = Math.round(corps.scrollLeft / (corps.clientWidth || 1));
        const ec = ['carte', 'appareils', 'alertes', 'plus'][rang];
        if (ec) marquerEcran(ec);
      }, 90);
    });
  }

  function montrerEcran(ec) {
    marquerEcran(ec);
    const corps = document.getElementById('corps');
    const rang = ['carte', 'appareils', 'alertes', 'plus'].indexOf(ec);
    corps.scrollTo({ left: rang * corps.clientWidth, behavior: 'smooth' });
  }

  function marquerEcran(ec) {
    document.querySelectorAll('.m-barre button').forEach(function (b) { b.classList.toggle('actif', b.dataset.ec === ec); });
    poser('tete-titre', TITRES[ec] || 'Find-Flow');
    majFlottant(ec);
  }

  /* ═══════ Bouton flottant selon l'écran ═══════ */
  function majFlottant(ec) {
    const f = document.getElementById('btn-flottant');
    const ico = document.getElementById('flottant-icone');
    if (!f || !ico) return;
    if (ec === 'carte') {
      f.hidden = false;
      ico.innerHTML = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
      f.onclick = function () { FindFlow.carte.ajusterSurTous(etat); };
    } else if (ec === 'appareils') {
      f.hidden = false;
      ico.innerHTML = '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>';
      f.onclick = ouvrirAppairage;
    } else { f.hidden = true; }
  }

  /* ═══════ Liste des appareils ═══════ */
  function brancherFiltres() {
    const options = [['tous', 'Tous'], ['en-ligne', 'En ligne'], ['hors-ligne', 'Hors ligne'], ['alerte', 'En alerte']];
    const c = document.getElementById('filtres');
    c.innerHTML = options.map(function (o) {
      return '<button class="m-puce' + (o[0] === 'tous' ? ' actif' : '') + '" data-f="' + o[0] + '">' + o[1] + '</button>';
    }).join('');
    c.querySelectorAll('.m-puce').forEach(function (p) {
      p.addEventListener('click', function () {
        filtre = p.dataset.f;
        c.querySelectorAll('.m-puce').forEach(function (x) { x.classList.toggle('actif', x === p); });
        dessinerListe();
      });
    });
    const rech = document.getElementById('recherche');
    if (rech) rech.addEventListener('input', dessinerListe);
  }

  function appareilsVisibles() {
    const q = (document.getElementById('recherche').value || '').trim().toLowerCase();
    return etat.filter(function (a) {
      if (q && (a.nom + ' ' + a.proprietaire).toLowerCase().indexOf(q) === -1) return false;
      if (filtre === 'en-ligne') return FindFlow.format.estEnLigne(a);
      if (filtre === 'hors-ligne') return !FindFlow.format.estEnLigne(a);
      if (filtre === 'alerte') return FindFlow.alertes.pour(a).length > 0;
      return true;
    });
  }

  function dessinerListe() {
    const c = document.getElementById('liste');
    if (!c) return;
    const v = appareilsVisibles();
    if (!v.length) { c.innerHTML = '<p class="m-vide">Aucun appareil.</p>'; return; }
    c.innerHTML = v.map(ficheAppareil).join('');
    c.querySelectorAll('.m-fiche').forEach(function (b) { b.addEventListener('click', function () { ouvrirDetail(b.dataset.id); }); });
  }

  function dessinerAlertes() {
    const c = document.getElementById('liste-alertes');
    if (!c) return;
    const v = etat.filter(function (a) { return FindFlow.alertes.pour(a).length > 0; });
    if (!v.length) { c.innerHTML = '<p class="m-vide">Aucune alerte. Tout va bien.</p>'; return; }
    c.innerHTML = v.map(ficheAppareil).join('');
    c.querySelectorAll('.m-fiche').forEach(function (b) { b.addEventListener('click', function () { ouvrirDetail(b.dataset.id); }); });
  }

  function ficheAppareil(a) {
    const enLigne = FindFlow.format.estEnLigne(a);
    const classe = a.mode === 'vole' ? 'vole' : (enLigne ? 'en-ligne' : 'hors-ligne');
    const etiquette = a.mode === 'vole' ? 'VOLÉ' : (enLigne ? 'En ligne' : 'Hors ligne');
    const av = FindFlow.format.contenuAvatar(a);
    const alertes = FindFlow.alertes.pour(a);
    const badge = alertes.length ? '<span class="badge-alerte">' + FindFlow.format.echapper(alertes[0].texte) +
      (alertes.length > 1 ? ' +' + (alertes.length - 1) : '') + '</span>' : '';
    const batt = (typeof a.batterie === 'number') ? '<span class="m-f-batt">' + Math.round(a.batterie) + ' %</span>' : '';
    return '<button class="m-fiche ' + classe + '" data-id="' + FindFlow.format.echapper(a.id) + '">' +
      '<span class="avatar" style="background:' + av.fond + '">' + av.html + '</span>' +
      '<span class="m-f-texte"><span class="m-f-nom">' + FindFlow.format.echapper(a.nom) + '</span>' +
      '<span class="m-f-sous">' + etiquette + ' · ' + FindFlow.format.depuis(a.derniereMaj) + '</span>' + badge + '</span>' +
      batt + '</button>';
  }

  function majBadges() {
    const enAlerte = FindFlow.alertes.compterAppareils(etat);
    poser('stat-alertes', enAlerte);
    poser('stat-en-ligne', etat.filter(FindFlow.format.estEnLigne).length);
    const pt = document.getElementById('pt-alertes');
    if (pt) { pt.hidden = enAlerte === 0; pt.textContent = enAlerte; }
  }

  /* ═══════ Feuille : détails d'un appareil ═══════ */
  function trouver(id) { return etat.filter(function (a) { return a.id === id; })[0] || null; }

  function ouvrirDetail(id) {
    idOuvert = id;
    const a = trouver(id);
    if (a) { FindFlow.carte.centrerSur(a); FindFlow.carte.montrerSelection(a); }
    dessinerDetail();
    ouvrirVoile();
  }

  function dessinerDetail() {
    const a = trouver(idOuvert);
    const f = document.getElementById('feuille');
    if (!a || !f) { fermerVoile(); return; }
    const enLigne = FindFlow.format.estEnLigne(a);
    const ech = FindFlow.format.echapper;
    const av = FindFlow.format.contenuAvatar(a);
    const alertes = FindFlow.alertes.pour(a);
    const blocAlertes = alertes.length ? '<ul class="alertes-m">' + alertes.map(function (al) { return '<li>' + ech(al.texte) + '</li>'; }).join('') + '</ul>' : '';
    const proprio = a.estAMoi
      ? '<div class="bloc-proprio-m"><label class="ligne-amoi"><input type="checkbox" id="chk-amoi" checked><span>C’est mon appareil</span></label>' +
          (enLigne ? '<button class="pilule pilule-petite" id="btn-camera">Caméra en direct</button>' : '<span class="aide">Hors ligne : caméra dispo une fois connecté.</span>') +
          '<p id="camera-info" class="aide" hidden></p></div>'
      : '<div class="bloc-proprio-m"><label class="ligne-amoi"><input type="checkbox" id="chk-amoi"><span>C’est mon appareil</span></label>' +
          '<p class="aide">Coche pour activer la caméra et les fonctions réservées à tes appareils.</p></div>';

    f.innerHTML = '<div class="m-poignee"></div>' +
      '<div class="m-fe-tete"><span class="avatar ' + (a.mode === 'vole' ? 'vole' : (enLigne ? 'en-ligne' : 'hors-ligne')) + '" style="background:' + av.fond + '">' + av.html + '</span>' +
      '<div><div class="m-fe-nom">' + ech(a.nom) + '</div><div class="m-fe-sous">' + (a.mode === 'vole' ? 'VOLÉ' : (enLigne ? 'En ligne' : 'Hors ligne')) + ' · ' + FindFlow.format.depuis(a.derniereMaj) + '</div></div></div>' +
      blocAlertes + proprio +
      mL('Propriétaire', ech(a.proprietaire)) +
      mL('Batterie', FindFlow.format.batterie(a.batterie)) +
      mL('Position', a.position ? a.position.lat.toFixed(5) + ', ' + a.position.lng.toFixed(5) : '—') +
      mL('Carte SIM', a.sim ? ech(a.sim.numero) + (a.sim.changee ? ' (changée)' : '') : '—') +
      '<div class="actions-m">' +
        '<button class="pilule" id="btn-itineraire">Itinéraire</button>' +
        '<button class="pilule" id="btn-sonner">Faire sonner</button>' +
        '<button class="pilule ' + (a.mode === 'vole' ? '' : 'pilule-alerte') + '" id="btn-vol">' + (a.mode === 'vole' ? 'Annuler « volé »' : 'Signaler volé') + '</button>' +
      '</div><p id="route-m" class="route-m" hidden></p>';

    brancherDetail(a);
  }

  function mL(k, v) { return '<div class="m-l"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  function brancherDetail(a) {
    lier('btn-vol', function () {
      const versVole = a.mode !== 'vole';
      if (window.confirm(versVole ? 'Signaler « ' + a.nom + ' » comme VOLÉ ?' : 'Repasser « ' + a.nom + ' » en normal ?'))
        FindFlow.stockage.definirMode(a.id, versVole ? 'vole' : 'normal');
    });
    lier('btn-sonner', function () { window.alert('« Faire sonner » sera actif avec l’agent installé sur l’appareil.'); });
    lier('btn-itineraire', function () { itineraire(a); });
    const chk = document.getElementById('chk-amoi');
    if (chk) chk.onchange = function () { FindFlow.stockage.definirPropriete(a.id, chk.checked); };
    const cam = document.getElementById('btn-camera');
    if (cam) cam.onclick = function () { const i = document.getElementById('camera-info'); if (i) { i.hidden = false; i.textContent = 'Caméra prête. Le flux s’activera avec l’agent installé. Le voyant reste visible.'; } };
  }

  function itineraire(a) {
    if (!a.position) return;
    const i = document.getElementById('route-m');
    if (i) { i.hidden = false; i.textContent = 'Localisation en cours…'; }
    if (!navigator.geolocation) { if (i) i.textContent = 'Localisation indisponible.'; return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      fermerVoile();
      FindFlow.carte.tracerItineraire({ lat: pos.coords.latitude, lng: pos.coords.longitude }, a.position, function (r) {
        if (!i) return;
        const km = (r.distance / 1000).toFixed(1).replace('.', ',');
        i.innerHTML = (r.routier ? 'Route : ' + km + ' km' + (r.duree ? ' · ~' + Math.round(r.duree / 60) + ' min' : '') : 'À vol d’oiseau : ' + km + ' km') +
          ' — <a href="https://www.google.com/maps/dir/?api=1&destination=' + a.position.lat + ',' + a.position.lng + '" target="_blank" rel="noopener">Maps</a>';
      });
    }, function () { if (i) i.textContent = 'Active la localisation pour tracer la route.'; }, { enableHighAccuracy: true, timeout: 10000 });
  }

  /* ═══════ Voile / feuille ═══════ */
  function ouvrirVoile() { document.getElementById('voile').classList.add('ouvert'); }
  function fermerVoile() { idOuvert = null; FindFlow.carte.effacerSelection(); document.getElementById('voile').classList.remove('ouvert'); }
  document.addEventListener('click', function (e) { if (e.target && e.target.id === 'voile') fermerVoile(); });

  /* ═══════ Ajouter un appareil (feuille) ═══════ */
  function ouvrirAppairage() {
    const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = ''; for (let i = 0; i < 6; i++) code += lettres[Math.floor(Math.random() * lettres.length)];
    document.getElementById('feuille').innerHTML = '<div class="m-poignee"></div>' +
      '<div class="m-fe-nom" style="margin-bottom:8px">Ajouter un appareil</div>' +
      '<p class="aide">Installe l’agent Find-Flow sur l’appareil, ouvre-le et saisis ce code :</p>' +
      '<div class="code-appairage">' + code.split('').join(' ') + '</div>' +
      '<p class="aide">Les agents (Android) arrivent — cet écran est prêt pour eux.</p>';
    ouvrirVoile();
  }

  /* ═══════ En-tête, Plus, thème, style carte ═══════ */
  function brancherEntete() {
    lier('btn-theme', function () {
      const sombre = document.documentElement.getAttribute('data-theme') === 'dark';
      if (sombre) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', 'dark');
      try { window.localStorage.setItem('findflow.theme', sombre ? 'light' : 'dark'); } catch (e) {}
    });
  }

  function brancherPlus() {
    lier('plus-carte', function () { FindFlow.carte.basculerStyle(); majStyleCarte(); });
    lier('plus-avance', ouvrirConfig);
  }
  function majStyleCarte() { poser('plus-carte-val', FindFlow.carte.styleActuel() === 'satellite' ? 'Satellite' : 'Plan'); }

  /* Configuration technique, rangée à part (pas dans le flux principal). */
  function ouvrirConfig() {
    const r = FindFlow.reglages.lire();
    document.getElementById('feuille').innerHTML = '<div class="m-poignee"></div>' +
      '<div class="m-fe-nom" style="margin-bottom:8px">Configuration technique</div>' +
      '<label class="champ">Clé carte (MapTiler)<input id="reg-cle-carte" type="text"></label>' +
      '<label class="champ">Configuration Firebase<textarea id="reg-firebase" rows="6"></textarea></label>' +
      '<button class="pilule pilule-principale pilule-large" id="reg-enregistrer">Enregistrer</button>' +
      '<p class="aide">Ces réglages seront fixés à la fabrication de l’app ; ils sont ici pour la mise en route.</p>';
    document.getElementById('reg-cle-carte').value = r.cleCarte || '';
    document.getElementById('reg-firebase').value = r.configFirebase || '';
    lier('reg-enregistrer', function () {
      const avant = FindFlow.reglages.lire().configFirebase || '';
      const n = FindFlow.reglages.lire();
      n.cleCarte = document.getElementById('reg-cle-carte').value.trim();
      n.configFirebase = document.getElementById('reg-firebase').value.trim();
      FindFlow.reglages.enregistrer(n);
      if (FindFlow.carte.rafraichirFond) FindFlow.carte.rafraichirFond();
      if ((n.configFirebase || '') !== avant) window.location.reload(); else fermerVoile();
    });
    ouvrirVoile();
  }

  function appliquerClient() {
    const nom = FindFlow.reglages.lire().nomEntreprise || '<Client>';
    poser('nom-client', nom); poser('nom-client-2', nom);
  }

  function lier(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); }
  function poser(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
})();
