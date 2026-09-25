'use strict';

/* Écran « À propos & Réglages ».

   SIGNATURE CAMS-LAB (non négociable) : version, « Développé par Cams-Lab
   (Seya Gilles Cames) », contact et licence, avec le logo embarqué. Prévu dès
   la première version, sans qu'on le demande.

   RÉGLAGES D'ENTREPRISE : le nom du client, ses coordonnées et ses numéros
   (RCCM, compte contribuable) se saisissent ici, jamais en dur dans le code. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.aPropos = (function creerAPropos() {

  function initialiser() {
    poser('version-app', FindFlow.config.version);
    poser('version-rail', FindFlow.config.version);
    poser('annee-licence', new Date().getFullYear());
    remplirFormulaireReglages();

    /* L'écran s'ouvre depuis la barre latérale (« Infos & réglages »). */
    const ouvrir = document.getElementById('nav-reglages');
    const fermer = document.getElementById('infos-fermer');
    const enregistrer = document.getElementById('reglages-enregistrer');
    if (ouvrir) ouvrir.addEventListener('click', afficher);
    if (fermer) fermer.addEventListener('click', masquer);
    if (enregistrer) enregistrer.addEventListener('click', enregistrerReglages);

    appliquerNomClient();
  }

  function afficher() {
    const p = document.getElementById('infos');
    if (p) p.hidden = false;
  }
  function masquer() {
    const p = document.getElementById('infos');
    if (p) p.hidden = true;
  }

  function remplirFormulaireReglages() {
    const r = FindFlow.reglages.lire();
    valeur('reg-nom', r.nomEntreprise);
    valeur('reg-adresse', r.adresse);
    valeur('reg-telephones', r.telephones);
    valeur('reg-email', r.email);
    valeur('reg-rccm', r.rccm);
    valeur('reg-contribuable', r.compteContribuable);
    valeur('reg-cle-carte', r.cleCarte);
  }

  function enregistrerReglages() {
    const reglages = {
      nomEntreprise: lire('reg-nom') || FindFlow.config.reglagesParDefaut.nomEntreprise,
      adresse: lire('reg-adresse'),
      telephones: lire('reg-telephones'),
      email: lire('reg-email'),
      rccm: lire('reg-rccm'),
      compteContribuable: lire('reg-contribuable'),
      cleCarte: lire('reg-cle-carte')
    };
    const ok = FindFlow.reglages.enregistrer(reglages);
    const info = document.getElementById('reglages-message');
    if (info) {
      /* Message clair, jamais un code d'erreur brut. */
      info.textContent = ok
        ? 'Réglages enregistrés sur ce poste.'
        : 'Impossible d’enregistrer sur ce poste (stockage bloqué). Réessaie ou change de navigateur.';
    }
    appliquerNomClient();
    /* La clé carte a pu changer : on repose le fond de carte tout de suite,
       sans obliger l'utilisateur à recharger la page. */
    if (FindFlow.carte && FindFlow.carte.rafraichirFond) FindFlow.carte.rafraichirFond();
  }

  /* Le nom du client s'affiche dans l'en-tête et dans la ligne de licence
     (« Usage exclusif <Client> »). Cams-Lab reste dans le logiciel, jamais en
     en-tête à la place du client. */
  function appliquerNomClient() {
    const r = FindFlow.reglages.lire();
    poser('nom-client-entete', r.nomEntreprise);
    poser('nom-client-licence', r.nomEntreprise);
  }

  function poser(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function valeur(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
  function lire(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  return { initialiser };
})();
