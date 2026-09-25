'use strict';

/* Outil commun aux bancs d'essai.

   CE QUI EST ÉPROUVÉ ICI EST CE QUI PART CHEZ UN CLIENT. Ces tests ne touchent
   AUCUN service réel et AUCUNE base : le tableau de bord tourne aujourd'hui sur
   des données de démonstration, et c'est cette logique-là (échappement des noms,
   calcul « en ligne / hors ligne », copies défensives) qu'on protège.

   Le tableau de bord est écrit pour le navigateur (il parle à window, document,
   localStorage). Pour l'éprouver sous Node sans navigateur, on recrée juste ce
   qu'il faut de ces objets, puis on charge les fichiers source tels quels. */

const fs = require('fs');
const path = require('path');

const racineScripts = path.join(__dirname, '..', 'tableau-de-bord', 'scripts');

/* Un faux « document » minimal : createElement('div') suffit à
   FindFlow.format.echapper, et il doit échapper &, < et > comme le vrai
   navigateur — sinon le test de sécurité ne prouverait rien. */
function fauxDocument() {
  return {
    createElement() {
      let brut = '';
      return {
        set textContent(v) { brut = v === null || v === undefined ? '' : String(v); },
        get innerHTML() {
          return brut.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
      };
    }
  };
}

/* Un faux localStorage sur un simple objet en mémoire. */
function fauxLocalStorage() {
  const memoire = new Map();
  return {
    getItem(k) { return memoire.has(k) ? memoire.get(k) : null; },
    setItem(k, v) { memoire.set(k, String(v)); },
    removeItem(k) { memoire.delete(k); }
  };
}

/* Charge des fichiers source du tableau de bord dans un même « window ».
   On normalise CRLF -> LF avant d'évaluer (règle de la charte pour un dépôt
   Windows). Chaque fichier est évalué dans sa propre portée pour éviter que le
   « const FindFlow » de chacun n'entre en conflit. */
function chargerModules(nomsFichiers) {
  const win = { localStorage: fauxLocalStorage() };
  const doc = fauxDocument();
  for (const nom of nomsFichiers) {
    const chemin = path.join(racineScripts, nom);
    const source = fs.readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
    const evaluer = new Function('window', 'document', source + '\n//# sourceURL=' + nom);
    evaluer(win, doc);
  }
  return win.FindFlow;
}

/* Petit compteur de vérifications : affiche OK/ÉCHEC ligne par ligne. */
function creerBanc(titre) {
  let reussis = 0;
  let echoues = 0;
  console.log('\n=== ' + titre + ' ===');
  return {
    verifier(intitule, condition) {
      if (condition) { reussis++; console.log('  OK    ' + intitule); }
      else { echoues++; console.log('  ÉCHEC ' + intitule); }
    },
    bilan() { return { reussis, echoues }; }
  };
}

module.exports = { chargerModules, creerBanc };
