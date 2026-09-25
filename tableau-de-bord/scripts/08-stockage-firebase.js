'use strict';

/* LE MÊME CONTRAT QUE 07-stockage.js, MAIS BRANCHÉ SUR FIREBASE (Firestore).

   L'app ne sait pas d'où viennent les données : elle appelle ecouter,
   definirMode, definirZone, definirPhoto, definirPropriete, dernierEtat,
   rafraichir. Ce module fournit exactement ces fonctions, mais lit et écrit
   dans Firestore, en temps réel.

   RÈGLE D'OR : si quoi que ce soit échoue (pas de configuration, réseau,
   Firebase mal réglé), on NE casse PAS l'app — on retombe silencieusement sur
   le module de démonstration et on prévient dans la console, en français. */

var FindFlow = window.FindFlow || (window.FindFlow = {});

FindFlow.stockageFirebase = (function creerStockageFirebase() {
  const abonnes = new Set();
  let cache = [];
  let db = null;
  let compte = null;         // l'identifiant du compte connecté (uid)
  let pret = false;          // Firebase est prêt
  let deleguer = null;       // si non nul, on repasse tout au module de démo
  let initLancee = false;

  /* Charge un script vendored (une seule fois) et attend qu'il soit prêt. */
  function chargerScript(src) {
    return new Promise(function (resoudre, rejeter) {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resoudre;
      s.onerror = function () { rejeter(new Error('Chargement impossible : ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* La configuration est collée par l'utilisateur (bloc firebaseConfig). Ce
     n'est pas du JSON strict (guillemets simples, clés sans guillemets…), on la
     lit donc de façon tolérante. C'est la config de l'utilisateur, sur sa
     machine — pas une donnée venue d'un inconnu. */
  function lireConfig() {
    const brut = (FindFlow.reglages.lire().configFirebase || '').trim();
    if (!brut) return null;
    const debut = brut.indexOf('{');
    const fin = brut.lastIndexOf('}');
    if (debut === -1 || fin === -1) return null;
    try {
      return (new Function('return (' + brut.slice(debut, fin + 1) + ')'))();
    } catch (e) {
      return null;
    }
  }

  function notifier() {
    const copie = cache.map(function (a) { return JSON.parse(JSON.stringify(a)); });
    for (const rappel of abonnes) {
      try { rappel(copie); } catch (e) { /* un écran en erreur n'arrête pas les autres */ }
    }
  }

  /* Bascule sur la démonstration en cas de problème, sans casser l'écran. */
  function basculerVersDemo(raison) {
    console.warn('Find-Flow : Firebase indisponible, retour aux données de démonstration. ' + (raison || ''));
    deleguer = FindFlow.stockageDemo;
    for (const rappel of abonnes) deleguer.ecouter(rappel);
  }

  async function initialiser() {
    if (initLancee) return;
    initLancee = true;

    const config = lireConfig();
    if (!config) { basculerVersDemo('Configuration absente ou illisible.'); return; }

    try {
      await chargerScript('vendor/firebase/firebase-app-compat.js');
      await chargerScript('vendor/firebase/firebase-auth-compat.js');
      await chargerScript('vendor/firebase/firebase-firestore-compat.js');

      firebase.initializeApp(config);
      db = firebase.firestore();

      /* Connexion anonyme pour cette première étape : elle donne un identifiant
         de compte stable sur ce poste, suffisant pour prouver que la chaîne
         marche. La vraie connexion (e-mail/mot de passe) viendra ensuite. */
      const identifiant = await firebase.auth().signInAnonymously();
      compte = identifiant.user.uid;

      const collection = db.collection('appareils').where('compte', '==', compte);

      /* Au tout premier lancement, la base est vide : on y sème les appareils de
         démonstration (rattachés à ce compte) pour voir tout de suite quelque
         chose et vérifier que l'écriture marche. Ensuite, ce sont les vrais
         agents qui rempliront la base. */
      const instantane = await collection.get();
      if (instantane.empty) {
        const lot = db.batch();
        FindFlow.donneesDemo().forEach(function (a) {
          const doc = db.collection('appareils').doc(a.id);
          lot.set(doc, Object.assign({}, a, { compte: compte }));
        });
        await lot.commit();
      }

      /* Écoute temps réel : à chaque changement, on reconstruit la liste. */
      collection.onSnapshot(function (snap) {
        cache = snap.docs.map(function (d) {
          return Object.assign({ id: d.id }, d.data());
        });
        pret = true;
        notifier();
      }, function (err) {
        basculerVersDemo('Lecture refusée : ' + (err && err.message));
      });

    } catch (e) {
      basculerVersDemo(e && e.message);
    }
  }

  /* Attend que Firebase soit prêt (ou que la bascule démo ait eu lieu). */
  function quandPret() {
    return new Promise(function (resoudre) {
      const verifier = function () {
        if (pret || deleguer) resoudre();
        else setTimeout(verifier, 120);
      };
      verifier();
    });
  }

  function ecrireChamp(id, champ, valeur) {
    if (deleguer) return deleguer['definir' + champ] ? Promise.resolve() : Promise.resolve();
    return quandPret().then(function () {
      if (deleguer) return; // bascule survenue entre-temps
      const maj = {}; maj[champ] = (valeur === undefined ? null : valeur);
      return db.collection('appareils').doc(id).update(maj);
    });
  }

  return {
    ecouter(rappel) {
      abonnes.add(rappel);
      if (deleguer) { deleguer.ecouter(rappel); return function () { abonnes.delete(rappel); }; }
      initialiser();
      /* Si le cache est déjà chargé, on sert tout de suite. */
      if (pret) Promise.resolve().then(notifier);
      return function seDesabonner() { abonnes.delete(rappel); };
    },
    definirMode(id, mode) {
      if (deleguer) return deleguer.definirMode(id, mode);
      return ecrireChamp(id, 'mode', mode);
    },
    definirZone(id, zone) {
      if (deleguer) return deleguer.definirZone(id, zone);
      return ecrireChamp(id, 'zone', zone || null);
    },
    definirPhoto(id, photo) {
      if (deleguer) return deleguer.definirPhoto(id, photo);
      return ecrireChamp(id, 'photo', photo || null);
    },
    definirPropriete(id, estAMoi) {
      if (deleguer) return deleguer.definirPropriete(id, estAMoi);
      return ecrireChamp(id, 'estAMoi', !!estAMoi);
    },
    dernierEtat() {
      if (deleguer) return deleguer.dernierEtat();
      return cache.map(function (a) { return JSON.parse(JSON.stringify(a)); });
    },
    rafraichir() {
      if (deleguer) return deleguer.rafraichir();
      notifier();
      return Promise.resolve(true);
    }
  };
})();
