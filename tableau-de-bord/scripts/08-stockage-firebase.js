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
  /* On calcule où se trouve la bibliothèque Firebase à partir de l'adresse de CE
     fichier, et non par rapport à la page. Sinon, une page rangée ailleurs (le
     mobile, l'agent) chercherait Firebase au mauvais endroit et tomberait en
     panne. « …/scripts/08-….js » -> « …/vendor/firebase/ ». */
  const urlModule = (document.currentScript && document.currentScript.src) || '';
  const baseFirebase = urlModule.replace(/[^/]*$/, '').replace(/scripts\/$/, 'vendor/firebase/');

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

  /* Connexion au compte : si une session existe déjà, on la garde ; sinon on
     affiche l'écran e-mail/mot de passe. Renvoie l'identifiant du compte (uid). */
  function connecter(auth) {
    return new Promise(function (resoudre, rejeter) {
      const off = auth.onAuthStateChanged(function (u) {
        off();
        if (u) { resoudre(u.uid); return; }
        afficherConnexion(auth).then(resoudre, rejeter);
      });
    });
  }

  /* Écran de connexion, créé à la volée (pas de HTML à ajouter dans chaque page).
     Deux boutons : se connecter, ou créer le compte de l'entreprise. */
  function afficherConnexion(auth) {
    return new Promise(function (resoudre, rejeter) {
      const fond = document.createElement('div');
      fond.className = 'connexion-fond';
      fond.innerHTML =
        '<form class="connexion-boite" autocomplete="on">' +
        '<h2>Connexion Find-Flow</h2>' +
        '<p class="aide">Connecte-toi au compte de ton entreprise. Le PC et les téléphones ' +
        'utilisent le même compte.</p>' +
        '<label class="champ">E-mail<input type="email" id="cx-email" required></label>' +
        '<label class="champ">Mot de passe<input type="password" id="cx-mdp" required></label>' +
        '<button type="submit" class="pilule pilule-principale pilule-large" id="cx-entrer">Se connecter</button>' +
        '<button type="button" class="pilule pilule-large" id="cx-creer">Créer le compte</button>' +
        '<p class="aide" id="cx-msg"></p>' +
        '</form>';
      document.body.appendChild(fond);

      const email = fond.querySelector('#cx-email');
      const mdp = fond.querySelector('#cx-mdp');
      const msg = fond.querySelector('#cx-msg');

      function traduire(e) {
        const c = e && e.code || '';
        if (c.indexOf('wrong-password') !== -1 || c.indexOf('invalid-credential') !== -1) return 'Mot de passe incorrect.';
        if (c.indexOf('user-not-found') !== -1) return 'Ce compte n’existe pas. Crée-le avec « Créer le compte ».';
        if (c.indexOf('email-already-in-use') !== -1) return 'Ce compte existe déjà. Utilise « Se connecter ».';
        if (c.indexOf('weak-password') !== -1) return 'Mot de passe trop court (au moins 6 caractères).';
        if (c.indexOf('invalid-email') !== -1) return 'Adresse e-mail invalide.';
        return 'Impossible pour l’instant. Vérifie ta connexion et réessaie.';
      }
      function terminer(cred) { document.body.removeChild(fond); resoudre(cred.user.uid); }
      function echec(e) { if (msg) msg.textContent = traduire(e); }

      fond.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        auth.signInWithEmailAndPassword(email.value.trim(), mdp.value).then(terminer, echec);
      });
      fond.querySelector('#cx-creer').addEventListener('click', function () {
        auth.createUserWithEmailAndPassword(email.value.trim(), mdp.value).then(terminer, echec);
      });
    });
  }

  /* Prépare Firebase UNE fois : charge les scripts, démarre l'app, connecte au
     compte. Renvoie { db, compte } prêt à l'emploi. Réutilisé par le viewer
     (écoute) ET par l'agent (envoi de position). */
  let preparation = null;
  function preparer() {
    if (preparation) return preparation;
    preparation = (async function () {
      const config = lireConfig();
      if (!config) throw new Error('Configuration absente ou illisible.');
      await chargerScript(baseFirebase + 'firebase-app-compat.js');
      await chargerScript(baseFirebase + 'firebase-auth-compat.js');
      await chargerScript(baseFirebase + 'firebase-firestore-compat.js');
      if (!firebase.apps.length) firebase.initializeApp(config);
      db = firebase.firestore();
      /* CONNEXION AU COMPTE DE L'ENTREPRISE : PC et téléphones sur le MÊME
         compte, c'est ce qui fait qu'un téléphone apparaît sur ton PC. */
      compte = await connecter(firebase.auth());
      return { db: db, compte: compte };
    })();
    return preparation;
  }

  async function initialiser() {
    if (initLancee) return;
    initLancee = true;

    try {
      await preparer();
      const collection = db.collection('appareils').where('compte', '==', compte);

      /* On ne sème PLUS de faux appareils : ce sont les vrais agents installés
         sur les téléphones qui remplissent la base. Au début, la liste peut donc
         être vide tant qu'aucun agent n'a envoyé sa position. */

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
    },

    /* CÔTÉ AGENT (sur le téléphone suivi) : enregistre CET appareil sous le
       compte connecté, puis envoie sa position GPS en continu. C'est ce qui fait
       apparaître le téléphone sur le tableau de bord du PC.
       - `infos` : { nom, type }.
       - `surPosition` : rappel optionnel(position) pour afficher l'état à l'écran.
       Renvoie une fonction pour ARRÊTER le suivi. */
    suivreCetAppareil(infos, surPosition) {
      let veille = null;
      preparer().then(function (p) {
        /* Un identifiant stable pour cet appareil, gardé sur le téléphone : on ne
           crée pas un nouvel appareil à chaque ouverture de l'app. */
        let id;
        try { id = window.localStorage.getItem('findflow.appareilId'); } catch (e) { id = null; }
        if (!id) {
          id = 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
          try { window.localStorage.setItem('findflow.appareilId', id); } catch (e) { /* tant pis */ }
        }
        const ref = p.db.collection('appareils').doc(id);
        /* Fiche de base (fusion : on n'écrase pas ce qui existe déjà). */
        ref.set({
          compte: p.compte,
          nom: (infos && infos.nom) || 'Mon appareil',
          type: (infos && infos.type) || 'telephone',
          estAMoi: true, mode: 'normal'
        }, { merge: true });

        if (!navigator.geolocation) { throw new Error('Ce téléphone ne donne pas sa position.'); }
        veille = navigator.geolocation.watchPosition(function (pos) {
          const position = {
            lat: pos.coords.latitude, lng: pos.coords.longitude,
            precision_m: Math.round(pos.coords.accuracy || 0)
          };
          ref.set({ position: position, derniereMaj: new Date().toISOString() }, { merge: true });
          if (surPosition) surPosition(position);
        }, function (err) {
          if (surPosition) surPosition({ erreur: err && err.message });
        }, { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 });
      });
      return function arreter() { if (veille !== null && navigator.geolocation) navigator.geolocation.clearWatch(veille); };
    },

    /* Se déconnecter du compte (utile pour changer de compte). */
    deconnexion() {
      return preparer().then(function () { return firebase.auth().signOut(); })
        .then(function () { window.location.reload(); });
    }
  };
})();
