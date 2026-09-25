# Tester le suivi en direct (agent → ton PC)

Objectif : prouver que, une fois l'agent lancé sur un appareil connecté à **ton
compte**, cet appareil apparaît sur **ton tableau de bord** avec sa vraie
position.

## Prérequis (déjà fait normalement)
- Projet Firebase créé, **Firestore** activé, **règles publiées**
  (`serveur/regles-firestore/01-regles-de-base.rules`).
- Dans **Authentication → Méthode de connexion**, active **E-mail/mot de passe**.
  (Le mode « Anonyme » n'est plus utilisé.)

## Test le plus simple : deux onglets sur ton PC

1. **Onglet 1 — le tableau de bord** : ouvre `tableau-de-bord/index.html`.
   - Va dans **Infos & réglages**, colle ta **Configuration Firebase**, enregistre.
   - Un écran **Connexion** apparaît : mets un e-mail + mot de passe et clique
     **Créer le compte** (la première fois). Tu es connecté ; la liste est vide
     (aucun agent n'a encore envoyé de position).
2. **Onglet 2 — l'agent** : ouvre `agent/index.html`.
   - Colle la **même** Configuration Firebase, enregistre.
   - Écran **Connexion** : **connecte-toi avec le MÊME e-mail + mot de passe**.
   - Donne un nom (« Mon PC test »), clique **Démarrer le suivi**, et **autorise
     la localisation** quand le navigateur le demande.
3. Reviens sur l'onglet 1 : **l'appareil apparaît sur la carte**, et sa position
   se met à jour en direct. 🎯

## Sur ton téléphone (vrai GPS)

- Ouvre l'app **agent** sur le téléphone (lien d'aperçu ou APK agent à venir),
  colle la config, connecte-toi au même compte, **Démarrer le suivi**, autorise
  la localisation. Le téléphone apparaît sur ton PC avec sa **vraie** position.

## Bon à savoir
- **Même compte partout** : c'est ce qui relie un appareil à ton tableau de bord.
- L'agent doit **rester ouvert** et la **localisation autorisée**. Le suivi en
  arrière-plan (écran éteint) viendra avec l'app Android native (prochaine étape).
- Rien ne marche ? Ouvre la **console** du navigateur (F12) et copie-moi la ligne
  « Find-Flow : … » s'il y en a une.
