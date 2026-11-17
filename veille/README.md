# Veille technologique — automatisation

Un script **sans dépendance** (Node.js 18+) qui lit des flux RSS/Atom, filtre les
articles par mots-clés, les classe, puis produit :

1. un **digest Markdown** daté, avec une fiche de lecture à remplir ;
2. un **JSON** réutilisable (archive, statistiques, autre outil) ;
3. une **sélection de 5 liens** injectée dans la section « Veille » du portfolio.

L'objectif n'est pas de rédiger la veille à ta place : le script prépare une liste courte
et traçable. La lecture critique, le niveau de confiance et la synthèse restent manuels.

---

## Lancer

```bash
# depuis la racine du portfolio
node veille/veille.mjs
```

Ou double-cliquer sur `veille/run-veille.bat` (Windows).

### Options

| Option | Effet |
|---|---|
| `--days 7` | Fenêtre de lecture en jours (défaut : 21) |
| `--limit 8` | Nombre d'articles retenus (défaut : 12) |
| `--dry-run` | Affiche la sélection dans le terminal, n'écrit rien |
| `--site` | Met aussi à jour le bloc automatique de `index.html` |

Exemples :

```bash
node veille/veille.mjs --days 7 --limit 8
node veille/veille.mjs --dry-run
node veille/veille.mjs --site
```

---

## Sorties

```
veille/
├─ sources.json            # flux, thèmes, poids, mots-clés
├─ veille.mjs              # le script
├─ run-veille.bat          # lancement Windows
├─ digests/
│  ├─ 2026-11-10.md        # digest daté
│  └─ latest.md            # copie du dernier digest
└─ data/
   ├─ 2026-11-10.json      # archive structurée
   └─ latest.json
```

Le digest contient :

- la période et le nombre de flux lus ;
- une sélection classée par pertinence (source, date, thème, lien, résumé, mots-clés déclencheurs) ;
- une **fiche de lecture** vide (source, date, confiance, ce que ça change, lien avec l'alternance, question ouverte) ;
- l'**état des flux** (ok / erreur, éléments lus, éléments retenus) ;
- les sources à consulter manuellement (ThoughtWorks Radar, DORA, OWASP, ANSSI).

---

## Comment le classement fonctionne

Score = somme des poids des mots-clés trouvés + poids de la source + bonus de fraîcheur.

- Un article doit contenir **au moins un mot-clé** pour être retenu, sauf s'il vient d'une
  source institutionnelle (CNCF, CNIL) marquée `poids: 3`.
- Les doublons sont éliminés par titre normalisé et par URL.
- Les paramètres `utm_*` sont retirés des liens.
- Les titres commençant par `Article:`, `Podcast:`, `Video:` sont nettoyés.

Tout se règle dans `sources.json` :

```json
{ "nom": "CNCF", "url": "https://www.cncf.io/feed/", "theme": "Cloud & architecture", "poids": 3 }
```

```json
"kubernetes": 3,
"rgpd": 3,
"playwright": 3
```

Augmenter un poids rend le mot-clé plus discriminant. Ajouter une source ne demande
qu'une ligne, à condition que l'URL soit un flux RSS ou Atom valide.

---

## Planifier

### Windows — Planificateur de tâches

Une fois par semaine, lundi à 8 h :

```bat
schtasks /Create /SC WEEKLY /D MON /TN "Portfolio - veille" ^
  /TR "\"C:\Program Files\nodejs\node.exe\" \"C:\Ampps\www\www\portfolio-rayane\veille\veille.mjs\" --site" ^
  /ST 08:00
```

Vérifier : `schtasks /Query /TN "Portfolio - veille"`.
Supprimer : `schtasks /Delete /TN "Portfolio - veille" /F`.

### GitHub Actions

Le workflow `.github/workflows/veille.yml` tourne chaque lundi à 06:00 UTC et commit
le digest. Il faut que le portfolio soit dans un dépôt GitHub et que les Actions soient
activées (`Settings → Actions → General → Workflow permissions → Read and write`).

Le workflow peut aussi être lancé à la main depuis l'onglet **Actions**.

---

## Bonnes pratiques

- **Respecter les flux** : le script lit les RSS officiels, n'aspire pas les sites et
  n'essaie pas de contourner les paywalls.
- **Garder la main** : un article classé haut n'est pas forcément un bon signal. Vérifier
  la date, l'auteur, la méthode et les chiffres avant de reprendre une affirmation.
- **Distinguer** annonce commerciale, retour d'expérience et mesure. C'est le rôle de la
  colonne « niveau de confiance » de la fiche.
- **Ne pas automatiser la conclusion** : la valeur de la veille, c'est l'écart entre ce que
  dit la source et ce que tu en comprends pour ton contexte (BTS, alternance, tests, IA).

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `node` non reconnu | Node.js absent ou hors du `PATH` |
| `HTTP 403` sur un flux | Le site bloque les requêtes automatisées ; retirer la source |
| `aucun élément lisible` | L'URL n'est pas un flux RSS/Atom (page HTML) |
| Aucun article retenu | Fenêtre trop courte ou mots-clés trop restrictifs : `--days 30` |
| Bloc portfolio non mis à jour | Les marqueurs `veille:auto:start/end` ont été supprimés de `index.html` |

Le script échoue proprement : un flux indisponible est signalé, les autres continuent.
