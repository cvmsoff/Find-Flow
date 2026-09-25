'use strict';

/* Bascule clair / sombre, mémorisée sur le poste.

   POURQUOI ICI ET PAS DANS LE CSS SEUL : le CSS sait afficher les deux thèmes,
   mais c'est le choix de l'utilisateur qui décide lequel, et ce choix doit
   survivre à la fermeture. On pose donc un attribut data-theme sur la page et on
   retient la préférence. La toute première application du thème se fait dans
   l'en-tête de la page (pour éviter le clignotement) ; ici on gère le bouton. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.theme = (function creerTheme() {

  function actuel() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function appliquer(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try { window.localStorage.setItem('findflow.theme', theme); } catch (e) { /* stockage bloqué : tant pis */ }
  }

  function basculer() {
    appliquer(actuel() === 'dark' ? 'light' : 'dark');
  }

  function initialiser() {
    const bouton = document.getElementById('btn-theme');
    if (bouton) bouton.addEventListener('click', basculer);
  }

  return { initialiser, basculer, appliquer };
})();
