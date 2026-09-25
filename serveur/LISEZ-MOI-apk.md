# Obtenir l'APK de Find-Flow (app Android)

Je **ne peux pas** compiler l'APK dans l'atelier Claude : ça demande le SDK
Android, et les serveurs de Google y sont bloqués. On le fait donc compiler
**par GitHub**, dont les serveurs ont tout ce qu'il faut. Tu ne installes rien.

## La méthode simple (recommandée) : compilation sur GitHub

1. Va sur le dépôt **cvmsoff/Find-Flow** sur GitHub.
2. Onglet **Actions**. Si GitHub demande d'activer les workflows, clique pour
   les autoriser.
3. Dans la liste à gauche, choisis **« Construire l'APK Find-Flow »**.
4. Bouton **« Run workflow »** (à droite) → choisis la branche
   `claude/new-session-2hv28w` → **Run workflow**.
5. Attends ~5–10 minutes (barre verte). Ouvre l'exécution terminée.
6. En bas, section **Artifacts**, télécharge **`find-flow-apk`**. Dézippe-le :
   tu obtiens **`app-debug.apk`**.

## Installer l'APK sur ton téléphone

1. Envoie `app-debug.apk` sur le téléphone (WhatsApp, câble, Google Drive…).
2. Ouvre-le. Android demandera d'autoriser l'installation « d'applications
   inconnues » → accepte pour cette fois.
3. L'app **Find-Flow** s'installe. Ouvre-la, va dans **Réglages** pour mettre ta
   clé carte et, si tu veux, la config Firebase.

C'est un APK de **débogage** (signé avec la clé de test d'Android) : idéal pour
l'essayer toi-même. Pour distribuer largement (Play Store ou autre), on fera
ensuite un APK signé avec **ta** clé — c'est une étape que tu déclenches, jamais
moi.

## Autre méthode : Android Studio (si tu préfères sur ton PC)

1. Installe **Android Studio** (gratuit).
2. Sur ton PC, dans le dossier du projet :
   ```
   npm install
   npm run sync-vendor
   npm run preparer-mobile
   npx cap add android
   npx cap sync android
   ```
3. Ouvre le dossier **android/** dans Android Studio → menu **Build → Build
   Bundle(s) / APK(s) → Build APK(s)**. L'APK sort dans
   `android/app/build/outputs/apk/debug/`.

## Ce que fait cet APK (version actuelle)

C'est le **viewer** : la carte, la liste des appareils, les alertes, l'itinéraire.
« Faire sonner » et « Caméra en direct » deviendront réels avec **l'agent**
(prochaine étape). Le vrai **GPS** du téléphone remplacera l'estimation par
adresse internet.
