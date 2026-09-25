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
     definirZone(id, zone)  -> Promise ; pose une clôture (ou null pour la retirer).
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
          const p = bougerUnPeu(a.position, 0.0006);
          return Object.assign({}, a, {
            derniereMaj: maintenant, position: p,
            historique: ajouterAuTrajet(a, p, maintenant)
          });
        }
        /* Les autres ne bougent que s'ils étaient déjà récents, pour garder
           un appareil volontairement « hors ligne » dans cet état. */
        if (FindFlow.format.estEnLigne(a)) {
          const p = bougerUnPeu(a.position, 0.0002);
          return Object.assign({}, a, {
            derniereMaj: maintenant, position: p,
            historique: ajouterAuTrajet(a, p, maintenant)
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

  /* On ajoute la nouvelle position au trajet et on coupe le début : on garde le
     trajet récent, pas tout l'historique de l'appareil (choix assumé, voir la
     config). Sans cette coupe, la mémoire et la trace sur la carte grossiraient
     sans fin. */
  function ajouterAuTrajet(a, position, at) {
    const trajet = (a.historique || []).concat([{ lat: position.lat, lng: position.lng, at: at }]);
    const max = FindFlow.config.longueurHistorique;
    return trajet.length > max ? trajet.slice(trajet.length - max) : trajet;
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

    /* Pose ou retire la clôture géographique d'un appareil. Passer null retire
       la zone (l'appareil ne peut alors plus être « hors zone »). */
    definirZone(id, zone) {
      appareils = appareils.map(function (a) {
        return a.id === id ? Object.assign({}, a, { zone: zone || null }) : a;
      });
      notifier();
      return Promise.resolve(true);
    },

    dernierEtat() {
      return appareils.map((a) => JSON.parse(JSON.stringify(a)));
    }
  };
})();
