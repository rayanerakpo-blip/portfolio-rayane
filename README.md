# Portfolio — Rayane AKPO

Portfolio personnel **statique** (HTML / CSS / JavaScript, zéro dépendance, zéro build).
Il rassemble le parcours, les projets, l'alternance à l'Institut Gustave Roussy, les
compétences UX/IA, une lecture du référentiel **BTS SIO option SLAM** et une note de
veille technologique sur l'architecture logicielle à l'ère du cloud et de l'IA.

---

## Lancer le site

### Option 1 — AMPPS (recommandé)

Le dossier est déjà dans la racine web d'AMPPS. Démarre **Apache**, puis ouvre :

```
http://localhost/www/portfolio-rayane/
```

### Option 2 — serveur PHP intégré

```bash
cd C:/Ampps/www/www/portfolio-rayane
C:/Ampps/php/php.exe -S 127.0.0.1:8123 -t .
```

Puis <http://127.0.0.1:8123/>.

### Option 3 — sans serveur

Le site n'utilise ni module ES, ni `fetch`, ni routeur : ouvrir `index.html` dans un
navigateur suffit.

---

## Structure

```
portfolio-rayane/
├─ index.html              # tout le contenu (sections sémantiques, dont #bts-sio)
├─ assets/
│  ├─ css/style.css        # design system, thèmes clair/sombre, responsive, impression
│  ├─ js/main.js           # thème, menu, modales, galeries, copie e-mail
│  ├─ img/                 # 24 captures d'écran réelles des projets
│  └─ CV_Rayane_AKPO.pdf   # CV téléchargeable
├─ veille/                 # automatisation de la veille (RSS → digest)
│  ├─ sources.json         # flux, thèmes, poids, mots-clés
│  ├─ veille.mjs           # script Node.js sans dépendance
│  ├─ digests/             # digests Markdown datés + latest.md
│  └─ data/                # archives JSON
├─ .github/workflows/      # génération hebdomadaire via GitHub Actions
└─ README.md
```

Aucune police, icône ou bibliothèque externe : les icônes sont un sprite SVG inline et
les polices sont celles du système. Le site fonctionne donc hors ligne.

### Les 4 projets présentés

| Projet | Contexte | Stack | Fiche |
|--------|----------|-------|-------|
| TensionWatch | Stage — Global Needs Institute | PHP 8, MySQL, Spring Boot 3.2, React 19, JWT | `tensionwatch` |
| Fair'repair | Projet BTS SLAM | PHP 8.2, MySQL, OpenStreetMap | `fairrepair` |
| Ferme Togo | Application métier | PHP 8.2, MySQL, Java, PWA, i18n | `ferme` |
| FormaSat | Projet BTS — BDD | PHP 8, MySQL, triggers | `formasat` |

La clé `Fiche` correspond à la valeur de `data-project` dans `index.html` et à l'entrée
du même nom dans l'objet `data` de `assets/js/main.js`. Les quatre cartes sont affichées
dans la même grille, sans filtre technique : l'objectif est de montrer un parcours
d'étudiant, pas un catalogue d'outils.

### Dépôts GitHub

| Projet | Dépôt |
|--------|-------|
| TensionWatch — V1 PHP | <https://github.com/rayanerakpo-blip/TensionWatch> |
| TensionWatch — V2 Spring / React | <https://github.com/rayanerakpo-blip/tensionwatch-java-react> |
| Fair'repair | <https://github.com/rayanerakpo-blip/fair-repair> |
| Ferme Togo — V1 | <https://github.com/rayanerakpo-blip/ferme-togo> |
| La Ferme — V2 allégée | <https://github.com/rayanerakpo-blip/la-ferme-togo> |
| FormaSat | <https://github.com/rayanerakpo-blip/formasat> |
| Portfolio | <https://github.com/rayanerakpo-blip/portfolio-rayane> |

Les liens sont aussi disponibles dans chaque fiche projet, sous « Code source ».
D'autres dépôts publics sont visibles sur le compte GitHub.

La section Compétences reste volontairement courte : **4 cartes et 13 compétences**,
celles qui sont réellement pratiquées en formation, en projet ou en alternance. Elle ne
cherche pas à lister tout ce qui a été aperçu, et n'affiche pas de jauges d'auto-évaluation.

### Lecture du référentiel BTS SIO

La section `#bts-sio` reprend les **14 compétences professionnelles** de l'option SLAM
(arrêté du 29 avril 2019) et les rattache aux épreuves du diplôme :

| Bloc | Épreuve | Compétences |
|------|---------|-------------|
| Support et mise à disposition de services informatiques | E4 | C1.1 à C1.6 |
| Conception et développement d'applications (SLAM) | E5 | C2B.1 à C2B.3 |
| Cybersécurité des services informatiques | E6 | C3.1 à C3.5 |

Chaque compétence affiche :

- un **niveau honnête** : *pratiqué en projet*, *mobilisé en stage / alternance* ou
  *notions à consolider* ;
- une **preuve** concrète : projet, livrable, situation d'alternance ou certification.

Les points à consolider sont regroupés dans un encart séparé. Le tableau
« Réalisations professionnelles » sert de base aux dossiers **E4** et **E5**.
Il ne remplace ni le modèle officiel de la circulaire nationale, ni les attestations de
stage, ni le dossier numérique attendu par le jury.

### Contenu repris du CV

- Stage **Global Needs Institute** (juin – août 2026) : analyse des besoins, maquettes Figma,
  développement des interfaces, tests fonctionnels et documentation technique.
- **LEXILUX** — hackathon Assemblée nationale 2026 : tests utilisateurs, évaluation d'un
  agent conversationnel et analyse d'un outil API IA + RAG.
- Certifications **AI Fluency Framework & Foundations** et **Claude 101** (Anthropic, mars 2026),
  **MOOC Atelier RGPD** (CNIL, décembre 2025).
- Compétences UX, tests utilisateurs, documentation, IA générative, Next.js, Python,
  PostgreSQL, MongoDB, Qdrant, Linux, GLPI/ITIL et VMware.
- Langues, soft skills et centres d'intérêt.

---

## Modifier le contenu

| Quoi | Où |
|------|----|
| Textes, titres, sections | `index.html` |
| Niveaux et preuves BTS SIO | `index.html`, section `#bts-sio` |
| Fiches détaillées des projets (modales) | `assets/js/main.js`, objet `data` |
| Couleurs, rayons, espacements | `assets/css/style.css`, bloc `:root` |
| CV téléchargeable | remplacer `assets/CV_Rayane_AKPO.pdf` |
| Photo de profil | remplacer le monogramme `.avatar` par une `<img>` |

### Liens externes

Le lien **GitHub** pointe vers <https://github.com/rayanerakpo-blip>. Le lien **LinkedIn**
a été retiré : aucune URL publique n'était disponible, un lien mort aurait moins de valeur
qu'une absence assumée.

### Captures d'écran

Les 24 images de `assets/img/` sont de **vraies captures** des applications, prises en local
sur les projets démarrés (Apache/MySQL AMPPS, serveur Java et serveur React). Aucune maquette
n'est présentée comme une capture.

Les quatre cartes projet affichent une capture dans `.project__preview`, et leur fiche
détaillée (modale) contient une galerie : `gallery` dans l'objet `data` de
`assets/js/main.js`.

Pour remplacer une capture :

1. déposer la nouvelle image dans `assets/img/` en conservant le nom de fichier ;
2. garder le ratio 7:6 environ (les fichiers actuels font 980 × 840 ou 1000 × 840 px) ;
3. mettre à jour le texte alternatif (`alt`) dans `index.html` et la légende dans `main.js`.

### Démos en ligne

Quatre applications sont déployées sur InfinityFree. Les liens et les comptes sont aussi
affichés dans chaque fiche projet du site.

| Projet | URL | Comptes de démonstration |
|--------|-----|--------------------------|
| TensionWatch | <https://tensionwatch.wuaze.com> | `demo@tensionwatch.local` / `demo2026` |
| Fair'repair | <https://fairrepair.wuaze.com><br>Lien de secours : <https://mifarma.wuaze.com/fairrepair/> | `alice.fournier.27@demo.fairrepair.fr` (client), `sarah.mercier.0@demo.fairrepair.fr` (réparateur), `admin@demo.fairrepair.fr` (admin) / `Demo@Fair2026` |
| Ferme Togo (V2 allégée) | <https://mifarma.wuaze.com> | `proprietaire@laferme.tg` / `admin123`, `collaborateur@laferme.tg` / `collab123` |
| FormaSat | <https://formasat.wuaze.com> | `admin@formasat.fr` / `admin2026` |

Les données hébergées sont des données de démonstration, distinctes des bases locales
utilisées pour les captures du portfolio. Le compte MySQL d'InfinityFree n'a pas le
privilège `CREATE TRIGGER` : les cinq triggers de FormaSat sont versionnés dans le dépôt
et applicables sur un serveur qui l'autorise, mais la démo affiche des agrégats
initialisés à l'import.

---

## Déploiement

Le site est 100 % statique : il suffit d'envoyer le dossier tel quel.

- **Netlify / Vercel** : glisser-déposer le dossier, ou connecter le dépôt Git.
- **GitHub Pages** : pousser le contenu sur la branche `gh-pages`.
- **Hébergement mutualisé** : envoyer par FTP dans `htdocs/`.

Avant la mise en ligne :

- [ ] vérifier que le CV est à jour ;
- [ ] ajouter si possible `assets/img/og-image.png` (1200 × 630) et la balise `og:image` ;
- [ ] vérifier le rendu sur mobile.

---

## Qualité

Vérifié avec Lighthouse sur la page d'accueil :

| Audit | Score |
|-------|-------|
| Accessibilité | 100 |
| Bonnes pratiques | 100 |
| SEO | 100 |

Le site respecte aussi :

- `prefers-reduced-motion` (animations désactivées) ;
- la navigation clavier et les styles `:focus-visible` ;
- un lien d'évitement, des libellés ARIA et une structure de titres cohérente ;
- une feuille de style d'impression dédiée ;
- un thème clair/sombre mémorisé dans `localStorage`.

---

## Sources de la veille

Les références sont listées dans la section **Veille** du site : CNCF, ThoughtWorks
Technology Radar, DORA, OWASP (Top 10 for LLM Applications), ANSSI, CNIL et OpenTelemetry.

### Automatisation

Le dossier `veille/` contient un agrégateur RSS/Atom sans dépendance (Node.js 18+) :

```bash
node veille/veille.mjs --site
```

Il lit 14 flux, filtre par mots-clés, classe les articles et produit un digest Markdown
avec une fiche de lecture à remplir. L'option `--site` met à jour le bloc
« Sélection automatique » de la section Veille, entre les marqueurs
`<!-- veille:auto:start -->` et `<!-- veille:auto:end -->`.

Le tri est automatique ; l'analyse reste manuelle. Voir `veille/README.md` pour les
options, la planification Windows et le workflow GitHub Actions.
