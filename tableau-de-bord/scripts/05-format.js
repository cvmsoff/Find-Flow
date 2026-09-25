'use strict';

/* Petites fonctions d'affichage partagées par tous les écrans.
   Un seul endroit pour formater une date, une durée, un statut : deux écrans
   ne doivent pas afficher la même heure de deux façons différentes. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.format = {

  /* ÉCHAPPEMENT HTML, SYSTÉMATIQUE : le nom d'un appareil et le nom de son
     propriétaire sont saisis par un utilisateur. Un nom piégé comme
     « <img onerror=...> » doit S'AFFICHER tel quel, jamais s'exécuter. On passe
     donc par cette fonction avant d'injecter le moindre texte dans la page. */
  echapper(texte) {
    const d = document.createElement('div');
    d.textContent = (texte === null || texte === undefined) ? '' : String(texte);
    return d.innerHTML;
  },

  /* Date ISO stockée -> affichage local. On stocke en ISO (2026-09-25T12:40:00Z),
     on affiche au format que l'utilisateur lit tous les jours. */
  dateHeure(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  /* « il y a 3 min » : c'est ce qu'un patron regarde en premier — l'info
     fraîche ou pas —, pas l'horodatage complet. */
  depuis(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'jamais';
    const secondes = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (secondes < 60) return 'à l’instant';
    const minutes = Math.round(secondes / 60);
    if (minutes < 60) return 'il y a ' + minutes + ' min';
    const heures = Math.round(minutes / 60);
    if (heures < 24) return 'il y a ' + heures + ' h';
    const jours = Math.round(heures / 24);
    return 'il y a ' + jours + ' j';
  },

  /* Un appareil est « en ligne » s'il a donné signe de vie récemment. On ne se
     fie pas à un drapeau enregistré : un appareil volé qu'on éteint doit
     basculer « hors ligne » tout seul, sans que personne ne le déclare. */
  estEnLigne(appareil) {
    const d = new Date(appareil.derniereMaj);
    if (isNaN(d.getTime())) return false;
    const secondes = (Date.now() - d.getTime()) / 1000;
    return secondes <= FindFlow.config.secondesAvantHorsLigne;
  },

  batterie(niveau) {
    if (niveau === null || niveau === undefined) return '—';
    return Math.round(niveau) + ' %';
  },

  typeLisible(type) {
    if (type === 'telephone') return 'Téléphone';
    if (type === 'ordinateur') return 'Ordinateur';
    return 'Appareil';
  },

  /* Les deux premières lettres marquantes du nom, pour l'avatar rond (façon
     Life360, mais des appareils n'ont pas de photo). « Téléphone secrétaire »
     -> « TS ». On échappe : ces initiales viennent d'un nom saisi par un humain. */
  initiales(nom) {
    const mots = String(nom || '?').trim().split(/\s+/).filter(Boolean);
    const deux = (mots[0] || '?').charAt(0) + (mots[1] ? mots[1].charAt(0) : '');
    return FindFlow.format.echapper(deux.toUpperCase() || '?');
  },

  /* Une couleur d'avatar stable pour un appareil : le même appareil garde
     toujours la même pastille, ce qui aide l'œil à le suivre d'un écran à
     l'autre. On tire la couleur de l'identifiant, pas du hasard. */
  couleurAvatar(id) {
    const palette = ['#7c5cff', '#16a34a', '#ff6b6b', '#f59e0b', '#06b6d4', '#ec4899', '#0ea5e9', '#84cc16'];
    let somme = 0;
    const s = String(id || '');
    for (let i = 0; i < s.length; i++) somme += s.charCodeAt(i);
    return palette[somme % palette.length];
  },

  /* Le contenu d'un avatar : la PHOTO de l'appareil si l'utilisateur en a mis
     une, sinon les initiales sur fond coloré. On renvoie de quoi remplir aussi
     bien la pastille de la liste que le marqueur de la carte, pour que les deux
     montrent exactement la même chose. La photo est une image locale (data URL)
     choisie par l'utilisateur — jamais chargée depuis internet. */
  contenuAvatar(appareil) {
    if (appareil && appareil.photo) {
      return { fond: 'transparent', html: '<img class="avatar-img" src="' + appareil.photo + '" alt="">' };
    }
    return {
      fond: FindFlow.format.couleurAvatar(appareil && appareil.id),
      html: FindFlow.format.initiales(appareil && appareil.nom)
    };
  }
};
