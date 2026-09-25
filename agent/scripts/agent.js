'use strict';

/* Agent Find-Flow : sur le téléphone à suivre.
   Il se connecte au compte de l'entreprise (même compte que le PC), puis envoie
   sa position GPS en continu. Il n'AFFICHE rien de la flotte — il ne fait
   qu'émettre sa propre position. Volontairement minimal : une action évidente. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

(function agent() {
  let arreter = null;

  document.addEventListener('DOMContentLoaded', function () {
    /* Sans configuration Firebase, on ne peut relier l'appareil à aucun compte :
       on montre le bloc de configuration (pour le test). */
    const config = (FindFlow.reglages.lire().configFirebase || '').trim();
    document.getElementById('bloc-config').hidden = !!config;

    lier('agent-config-enregistrer', function () {
      const r = FindFlow.reglages.lire();
      r.configFirebase = valeur('agent-firebase');
      FindFlow.reglages.enregistrer(r);
      window.location.reload();
    });

    /* Nom d'appareil : on repropose le dernier saisi. */
    try { valeurMettre('agent-nom', window.localStorage.getItem('findflow.nomAppareil') || ''); } catch (e) {}

    lier('agent-demarrer', demarrer);
    lier('agent-arreter', arreterSuivi);
    lier('agent-deco', function () { FindFlow.stockageFirebase.deconnexion(); });
  });

  function demarrer() {
    const nom = valeur('agent-nom') || 'Mon appareil';
    try { window.localStorage.setItem('findflow.nomAppareil', nom); } catch (e) {}

    etat('Connexion et démarrage du GPS…');
    /* L'écran de connexion (e-mail/mot de passe) apparaît ici si besoin. */
    arreter = FindFlow.stockageFirebase.suivreCetAppareil({ nom: nom, type: 'telephone' }, function (p) {
      if (p && p.erreur) { etat('Position indisponible : ' + p.erreur + ' (autorise la localisation).', 'erreur'); return; }
      const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      etat('Suivi actif. Dernière position envoyée à ' + heure +
        ' — précision ≈ ' + Math.round(p.precision_m) + ' m.', 'actif');
    });

    basculerBoutons(true);
  }

  function arreterSuivi() {
    if (arreter) { arreter(); arreter = null; }
    etat('Suivi arrêté.');
    basculerBoutons(false);
  }

  function basculerBoutons(actif) {
    document.getElementById('agent-demarrer').hidden = actif;
    document.getElementById('agent-arreter').hidden = !actif;
    document.getElementById('agent-deco').hidden = !actif;
  }

  function etat(texte, classe) {
    const el = document.getElementById('agent-etat');
    if (!el) return;
    el.textContent = texte;
    el.className = 'agent-etat' + (classe ? ' ' + classe : '');
  }

  function lier(id, action) { const el = document.getElementById(id); if (el) el.addEventListener('click', action); }
  function valeur(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function valeurMettre(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
})();
