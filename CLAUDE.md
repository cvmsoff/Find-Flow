# Charte de développement — CAMS-LAB

> **À quoi sert ce fichier.** Le coller au début d'une nouvelle conversation Claude (ou le déposer
> sous le nom `CLAUDE.md` à la racine d'un nouveau projet) pour que l'assistant connaisse d'emblée
> ma façon de travailler, sans que j'aie à répéter les mêmes consignes à chaque application.
>
> Développeur : **Cams-Lab — Seya Gilles Cames** · cams-lab@proton.me
> Rédigé le 25 septembre 2026, à partir de l'application MK Technologie (gestion d'atelier,
> bureau Electron + Android Capacitor + app web, 2 ans de travail, version 2.4.1).

---

## 0. Le bloc court (si je n'ai le temps d'en coller qu'un)

```
Je suis Cams-Lab (Seya Gilles Cames). Voici mes règles pour toute app que tu construis pour moi :

1. SIGNATURE : chaque app porte « Développé par Cams-Lab (Seya Gilles Cames) », le contact
   cams-lab@proton.me et « © <année> Cams-Lab » dans un écran « À propos », sur l'écran de
   démarrage, et dans les métadonnées du paquet (package.json / manifeste / copyright).
   Tu me le proposes dès la première version, sans que je le demande.
2. TOUT EN FRANÇAIS : interface, noms de fonctions et de fichiers, commentaires, messages de
   commit, documentation. Pas de franglais dans ce que l'utilisateur lit.
3. MES UTILISATEURS NE SONT PAS INFORMATICIENS : pas de jargon, pas de code d'erreur brut,
   gros boutons, une action évidente par écran.
4. HORS LIGNE D'ABORD : l'app doit marcher sans internet ; la synchronisation vient ensuite.
5. SIMPLE ET SANS OUTILLAGE LOURD : pas de framework ni d'étape de compilation si le projet
   peut s'en passer ; peu de dépendances, et je veux savoir pourquoi chacune est là.
6. DES COMMENTAIRES QUI EXPLIQUENT LE POURQUOI, jamais le quoi.
7. DES TESTS MAISON qui se lancent avec une seule commande et qui ne touchent JAMAIS
   la base de production.
8. TU NE PUBLIES RIEN À MA PLACE : pas de release, pas de règles de sécurité, pas de
   déploiement, aucune suppression définitive. Tu prépares, je clique.
9. TU NE REFAIS PAS CE QUE JE N'AI PAS DEMANDÉ : pas de refonte visuelle spontanée, pas de
   passe « pour enlever l'air IA ». Tu corriges le point que je nomme, rien d'autre.
10. À LA FIN D'UNE LIVRAISON : tu me donnes la liste exacte des fichiers à installer et ce
    qu'il me reste à faire moi-même, en français clair.
```

---

## 1. La signature CAMS-LAB (non négociable)

Toute application que je fais construire est signée. Concrètement, à prévoir **dès la première
version**, sans attendre que je le demande :

| Endroit | Contenu |
|---|---|
| Écran « À propos » / « Informations » | Version · **Développé par Cams-Lab (Seya Gilles Cames)** · Contact **cams-lab@proton.me** · Licence **© \<année\> Cams-Lab** · logo Cams-Lab |
| Écran de démarrage (splash) | Le logo Cams-Lab, discret, en bas |
| Métadonnées du paquet | `author`, `description` (« développé par Cams-Lab pour \<client\> »), `copyright: "© <année> Cams-Lab"` |
| Documents imprimés | Le nom du **client** en en-tête, jamais Cams-Lab — la signature reste dans le logiciel |

Le logo est embarqué dans l'application (base64 ou fichier local), jamais appelé depuis internet :
l'app doit s'afficher entière hors ligne.

**Modèle qui marche** (tel qu'il est dans MK Technologie) :

```html
<div class="about-row"><div class="k">Développé par</div><div class="v">Cams-Lab (Seya Gilles Cames)</div></div>
<div class="about-row"><div class="k">Contact</div><div class="v"><a href="mailto:cams-lab@proton.me">cams-lab@proton.me</a></div></div>
<div class="about-row"><div class="k">Licence</div><div class="v">Usage exclusif &lt;Client&gt; — © 2026 Cams-Lab</div></div>
```

---

## 2. La langue

- **Interface** : français, y compris les messages d'erreur et les confirmations.
- **Code** : noms de fonctions et de variables en français (`enregistrerProforma`, `lignesUtiles`,
  `prochainNumeroLocal`). Les fichiers aussi (`06-stockage.js`, `32-proformas.js`).
- **Commentaires** : français.
- **Messages de commit** : français, à l'infinitif ou au présent, et ils disent *pourquoi*
  (« Proforma : le bloc client, une ligne par renseignement »), pas *quoi*.
- **Documentation** : française, écrite pour moi, pas pour un ingénieur.

---

## 3. Pour qui je construis

Mes utilisateurs sont des commerçants, des secrétaires, des techniciens d'atelier. Ils apprennent
le logiciel sur le tas, souvent debout, souvent pressés, parfois sur un téléphone d'entrée de gamme.

Ce qui en découle, et que je ne veux pas avoir à rappeler :

- **Une action évidente par écran.** Le bouton qui sert le plus est le plus gros.
- **Aucun jargon** : pas de « token expiré », mais « ta session a pris fin, reconnecte-toi ».
- **Aucun code d'erreur brut** affiché : toujours traduit en une phrase et une action possible.
- **On ne perd jamais une saisie.** Un champ en cours de frappe ne doit pas être effacé par un
  rafraîchissement d'écran (leçon réelle : une ligne ajoutée doit être *ajoutée au DOM*, pas
  provoquer un redessin complet du formulaire).
- **On confirme avant de détruire**, et une suppression laisse une trace dans un journal.
- **Ça doit être imprimable** : reçus, étiquettes, factures — au format que le client utilise
  vraiment (A4, ticket 80 mm, étiquette 70 mm).

---

## 4. Les choix techniques que je préfère

- **Pas de framework par défaut.** HTML + CSS + JavaScript ordinaire tant que le projet tient
  debout comme ça. Pas de React/Vue/Tailwind sans que j'aie dit oui.
- **Pas d'étape de compilation** si on peut l'éviter : on doit pouvoir ouvrir un fichier, le lire,
  le corriger.
- **Fichiers numérotés et thématiques** (`01-comptes.js`, `06-stockage.js`, `17-impression.js`,
  `32-proformas.js`) chargés dans l'ordre. Un fichier = un sujet. Un fichier qui dépasse
  ~800 lignes se découpe.
- **Les bibliothèques externes sont recopiées dans `vendor/`**, jamais chargées depuis un CDN, et
  jamais lues depuis `node_modules` par le code livré. Un script (`sync-vendor`) fait la recopie.
- **Peu de dépendances**, et chacune justifiée par un commentaire dans `package.json`.
- **Un seul module partagé** quand deux plateformes (bureau / téléphone / web) font la même chose :
  les calculs, les numéros et la mise en page d'un document vivent **une seule fois**, dans un
  fichier commun. Un total ne doit pas pouvoir dire deux choses selon l'écran.

---

## 5. Les données

- **Hors ligne d'abord.** L'app écrit en local, puis synchronise. Une coupure internet ne doit
  jamais bloquer une vente ou un dépôt.
- **Les documents sont figés à l'édition.** Une facture, un reçu, un devis recopient le client,
  les lignes et le total au moment où ils sont établis. Un prix qui change le lendemain ne
  réécrit pas un papier déjà remis au client.
- **Les numéros de documents** suivent une forme lisible (`PF-2026-001`), donnés par un compteur
  central, avec une **solution de secours locale** si le serveur ne répond pas.
- **L'argent** : entiers, arrondis au franc (FCFA), formatés en `fr-FR`. Attention :
  `fr-FR` sépare les milliers par une espace **insécable** — ne jamais comparer à « 210 000 »
  tapé à la main dans un test.
- **Les dates** : stockées en ISO (`2026-09-25`), affichées au format local.
- **Une sauvegarde/restauration** complète doit exister, et toute nouvelle collection de données
  doit y être ajoutée le jour où elle est créée.

---

## 6. La sécurité

- **Aucun secret dans le dépôt.** Ni clé d'API, ni mot de passe, ni jeton. Les identifiants de
  service (SMS, etc.) restent **sur le poste**, saisis par l'utilisateur dans les réglages, jamais
  poussés dans une base partagée.
- **Ne me demande jamais de coller une clé ou un jeton dans la conversation**, ni dans une capture
  d'écran. Tu m'indiques où je dois le saisir moi-même.
- **Des rôles** : administrateur / responsable / employé, avec des écrans qui disparaissent selon
  le rôle — et surtout des **règles côté serveur** qui refusent l'action, pas seulement une case
  cachée dans l'interface.
- **Les règles de sécurité de la base sont versionnées** dans un dossier du dépôt, avec un fichier
  par étape et un en-tête qui explique ce qui change et ce qui ne casse pas.
- **Un journal d'activité** : qui a fait quoi, quand.
- Les échappements HTML sont systématiques sur tout ce qui vient d'un utilisateur — un nom de
  client piégé doit s'afficher, pas s'exécuter.

---

## 7. Les tests

Je ne veux pas d'usine à gaz de tests, mais je veux des **bancs d'essai** :

- De simples fichiers Node, lancés par `npm test`, qui **comptent leurs vérifications** et
  affichent `OK` / `ÉCHEC` ligne par ligne, en français.
- Chaque banc dit **en tête ce qu'il protège et pourquoi** : « ce qui est éprouvé ici est ce qui
  part chez un client ».
- On teste aussi **ce que le logiciel ne doit PAS faire** : pas de TVA inventée, pas de ligne vide
  imprimée, pas de nom piégé exécuté.
- Les tests ne touchent **jamais** la base de production, ni aucun service réel.
- Quand le dépôt est en CRLF (Windows), normaliser (`.replace(/\r\n/g,'\n')`) avant de découper
  un fichier source dans un test.

---

## 8. La livraison

- **Une version est un numéro** (`2.4.1`) qu'on incrémente dans le paquet, et qu'on retrouve à
  l'écran « À propos ».
- Avant de me donner un installeur, **vérifier fichier par fichier** que ce qui est emballé
  correspond au code enregistré, et me le dire (« 54 fichiers comparés, 0 différent »).
- Me livrer un **dossier unique** avec exactement ce que je dois publier, et la liste nommée.
- Toujours terminer par : **ce qu'il me reste à faire moi-même**, en une liste courte.

### Ce que tu ne fais jamais à ma place

- Publier une *release* (GitHub ou autre).
- Publier des règles de sécurité en production.
- Déployer sur un hébergement.
- Supprimer définitivement des fichiers, des comptes ou des données.
- Souscrire ou activer un service payant.

Tu prépares tout, tu me donnes la commande ou le chemin, **je clique**.

---

## 9. Comment je veux que tu me parles

- **En français, simplement.** Je code, mais je ne veux pas déchiffrer un rapport d'ingénieur.
- **Va droit au but.** Ce qui est fait, ce qui reste, ce qui bloque.
- **Ne me noie pas d'options.** Donne une recommandation, pas un catalogue.
- **Pose-moi une question quand deux lectures différentes donneraient deux applis différentes** —
  sinon décide et dis-moi ce que tu as décidé.
- **Dis-moi quand ça a échoué.** Un test qui casse, une étape sautée : je veux le savoir tout de
  suite, avec la sortie brute.
- **Ne me refais pas le design.** Si je demande « change la couleur du bouton », tu changes la
  couleur du bouton. Pas de refonte, pas de passe « pour enlever l'air IA », pas de
  « j'en ai profité pour ».

---

## 10. Ce qu'une app Cams-Lab embarque presque toujours

À me proposer d'office quand le projet s'y prête — je n'aurai pas à y penser :

- Écran de démarrage + **À propos signé Cams-Lab**
- **Comptes et rôles**, avec un journal d'activité
- **Marche hors ligne**, synchronisation quand le réseau revient
- **Sauvegarde / restauration** de toutes les données
- **Impression** (A4, ticket, étiquette) + export **PDF** + partage **WhatsApp** (image ou lien)
- **Mise à jour automatique** pour la version bureau
- **Recherche** dans toutes les listes, et des **compteurs** dans le menu
- **Réglages de l'entreprise** (nom, adresse, téléphones, e-mail, registre de commerce, compte
  contribuable, logo) — jamais écrits en dur dans le code : ils changent d'un client à l'autre
- Une **version téléphone** cohérente avec la version bureau, pas une version au rabais

---

## 11. Le style des commentaires (le point sur lequel je suis le plus exigeant)

Un commentaire qui répète le code ne sert à rien. Je veux celui qui explique **la décision**, pour
que dans six mois on ne « corrige » pas ce qui était voulu.

Exemple réel, tiré de mon code :

```js
/* CE QUI EST FIGÉ DANS LE DOCUMENT, ET POURQUOI : le numéro, la date, le
   client, les lignes et le total sont RECOPIÉS dans la fiche enregistrée au
   moment de l'édition. Un prix de stock qui change le lendemain ne doit pas
   réécrire une proforma déjà remise à un client — le papier qu'il a en main
   et ce que l'atelier relit six mois plus tard doivent dire la même chose. */
```

```js
/* Les lignes vides ne partent pas dans la fiche : on tape trois articles
   dans un formulaire qui en propose cinq, et les deux restantes n'ont rien
   à faire sur le papier du client. */
```

C'est le ton que j'attends : une phrase qui dit la contrainte du monde réel derrière la ligne de
code.

---

## 12. Mon contexte

- Je développe depuis la **Côte d'Ivoire**, pour des entreprises ivoiriennes.
- La monnaie est le **franc CFA**, les téléphones sont en `+225`, les documents portent un
  **RCCM** et un **compte contribuable**.
- Le réseau coupe. L'électricité coupe. Les appareils sont modestes. **L'app doit tenir quand même.**
- Mes clients sont de petites structures : le logiciel doit pouvoir être **réinstallé chez un
  autre client** en changeant les réglages, pas le code.

---

*Fin de la charte. Si un point de ce fichier contredit ce que je demande dans la conversation,
c'est la conversation qui gagne — mais dis-le-moi.*
