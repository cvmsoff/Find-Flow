'use strict';

/* LE MODULE UNIQUE D'ACCÈS AUX DONNÉES — LA SEULE PORTE VERS LE SERVEUR.

   Toute l'application passe par ici pour lire les appareils et changer leur
   mode. Aujourd'hui ce module sert des positions de démonstration ; demain il
   parlera à Firebase. Le jour venu, on ne réécrit QUE ce fichier : la carte, la
   liste et les détails ne savent pas d'où viennent les données, ils ne
   connaissent que ces fonctions. C'est pourquoi tout est déjà « asynchrone »
   (Promise) et « à l'écoute » (abonnement) — exactement la forme qu'aura
   Firebase — pour ne pas avoir à retoucher les écrans ensuite.

   Contrat de ce module :
     ecouter(rappel)        -> s'abonne aux appareils ; appelle rappel(liste) à
                               chaque changement ; renvoie une fonction pour se
                               désabonner.
     definirMode(id, mode)  -> Promise ; met un appareil en « normal » ou « vole ».
     dernierEtat()          -> la dernière liste connue (utile hors ligne). */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.stockage = (function creerStockage() {
  let appareils = FindFlow.donneesDemo();
  const abonnes = new Set();

  function notifier() {
    /* On recopie la liste avant de la donner : un écran ne doit pas pouvoir
       modifier par accident les données que lisent les autres écrans. */
    const copie = appareils.map((a) => JSON.parse(JSON.stringify(a)));
    for (const rappel of abonnes) {
      try { rappel(copie); } catch (e) { /* un écran en erreur n'arrête pas les autres */ }
    }
  }

  /* SIMULATION « TEMPS RÉEL » (DÉMO UNIQUEMENT) : on bouge très légèrement les
     appareils en ligne et on rafraîchit leur heure, pour qu'on VOIE les points
     vivre sur la carte. Rien de tout ceci ne survivra au branchement de
     Firebase, qui poussera les vraies positions. */
  let minuteur = null;
  function demarrerSimulation() {
    if (minuteur) return;
    minuteur = setInterval(function () {
      const maintenant = new Date().toISOString();
      appareils = appareils.map(function (a) {
        if (a.mode === 'vole') {
          /* Un appareil volé « rapporte » plus vite et se rafraîchit toujours :
             c'est le comportement qu'on veut le jour du vol. */
          return Object.assign({}, a, {
            derniereMaj: maintenant,
            position: bougerUnPeu(a.position, 0.0006)
          });
        }
        /* Les autres ne bougent que s'ils étaient déjà récents, pour garder
           un appareil volontairement « hors ligne » dans cet état. */
        if (FindFlow.format.estEnLigne(a)) {
          return Object.assign({}, a, {
            derniereMaj: maintenant,
            position: bougerUnPeu(a.position, 0.0002)
          });
        }
        return a;
      });
      notifier();
    }, 4000);
  }

  function bougerUnPeu(position, ampleur) {
    return Object.assign({}, position, {
      lat: position.lat + (Math.random() - 0.5) * ampleur,
      lng: position.lng + (Math.random() - 0.5) * ampleur
    });
  }

  return {
    ecouter(rappel) {
      abonnes.add(rappel);
      demarrerSimulation();
      /* On envoie l'état tout de suite : l'écran ne doit pas attendre le premier
         rafraîchissement pour afficher quelque chose. */
      Promise.resolve().then(notifier);
      return function seDesabonner() { abonnes.delete(rappel); };
    },

    definirMode(id, mode) {
      appareils = appareils.map(function (a) {
        return a.id === id ? Object.assign({}, a, { mode: mode }) : a;
      });
      notifier();
      return Promise.resolve(true);
    },

    dernierEtat() {
      return appareils.map((a) => JSON.parse(JSON.stringify(a)));
    }
  };
})();
