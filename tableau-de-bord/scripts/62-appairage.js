'use strict';

/* Écran « Ajouter un appareil ».

   COMMENT ON AJOUTERA UN APPAREIL, ET POURQUOI UN CODE : on n'ajoute pas un
   appareil en tapant son nom dans le tableau de bord — il faut que l'appareil
   lui-même se déclare. On génère donc un code court ; l'agent installé sur le
   téléphone ou le PC saisira ce code pour se rattacher au bon compte. Tant que
   les agents n'existent pas, cet écran prépare le geste, il ne connecte encore
   rien (c'est dit clairement à l'utilisateur). */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.appairage = (function creerAppairage() {

  function initialiser() {
    lier('appairage-fermer', masquer);
    lier('appairage-fond', masquer);
    lier('btn-appairage-nouveau', function () { poserCode(nouveauCode()); });
  }

  function ouvrir() {
    poserCode(nouveauCode());
    const m = document.getElementById('appairage');
    if (m) m.hidden = false;
  }

  function masquer() {
    const m = document.getElementById('appairage');
    if (m) m.hidden = true;
  }

  /* Un code lisible à dicter à voix haute : chiffres et lettres sans ambiguïté
     (pas de O/0 ni de I/1 qui se confondent quand on recopie sur un téléphone). */
  function nouveauCode() {
    const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += lettres[Math.floor(Math.random() * lettres.length)];
    return code;
  }

  function poserCode(code) {
    const el = document.getElementById('appairage-code');
    if (el) el.textContent = code.split('').join(' ');
  }

  function lier(id, action) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', action);
  }

  return { initialiser, ouvrir };
})();
