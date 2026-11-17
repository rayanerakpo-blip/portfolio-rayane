/* ==========================================================================
   Portfolio Rayane AKPO — interactions
   Vanilla JS, aucune dépendance.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- Thème */
  const root = document.documentElement;
  const stored = localStorage.getItem("ra-theme");
  if (stored === "light" || stored === "dark") root.dataset.theme = stored;

  $("#theme-toggle")?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("ra-theme", next);
  });

  /* ------------------------------------------------------- Header / menu */
  const header = $(".site-header");
  const nav = $("#nav");
  const navToggle = $("#nav-toggle");

  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const closeNav = () => {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  };

  navToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  $$("#nav a").forEach((a) => a.addEventListener("click", closeNav));

  /* ------------------------------------------------- Navigation active */
  const sections = $$("main section[id]");
  const navLinks = $$("#nav a[href^='#']");

  if ("IntersectionObserver" in window && sections.length) {
    const byId = new Map(navLinks.map((l) => [l.getAttribute("href").slice(1), l]));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((l) => l.classList.remove("is-active"));
          byId.get(e.target.id)?.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------ Reveal */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            ro.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => ro.observe(el));
  }

  /* ---------------------------------------------------------- Compteurs */
  const counters = $$("[data-count]");
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion || !target) { el.textContent = target + suffix; return; }
    const duration = 1100;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window && counters.length) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ------------------------------------------------------------ Filtres */
  const filters = $$(".filter");
  const projects = $$(".project");
  const projectArchive = $("#project-archive");

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const f = btn.dataset.filter;
      let hasArchiveMatch = false;
      projects.forEach((p) => {
        const tags = (p.dataset.tags || "").split(/\s+/);
        const matches = f === "all" || tags.includes(f);
        p.classList.toggle("is-hidden", !matches);
        if (matches && projectArchive?.contains(p)) hasArchiveMatch = true;
      });
      if (projectArchive) projectArchive.open = f === "all" || hasArchiveMatch;
    });
  });

  /* ------------------------------------------------------------- Modale */
  const modal = $("#modal");
  const modalBody = $("#modal-body");
  let lastFocus = null;

  const data = {
    tensionwatch: {
      tag: "Stage · Global Needs Institute · 2026",
      title: "TensionWatch",
      stats: [
        ["7", "tables MySQL"],
        ["~2 800", "lignes PHP"],
        ["40", "fichiers Java"],
      ],
      problem:
        "Un proche aidant doit suivre au quotidien la tension d'un patient, ses traitements, ses effets indésirables et ses rendez-vous. Sans outil, ces informations se dispersent entre un carnet, des ordonnances et de la mémoire — avec un risque réel de rater un signal d'alerte.",
      solution:
        "Conçue à partir d'une analyse des besoins et de maquettes Figma, une application web PHP/MySQL qui couvre tout le suivi : saisie des mesures, évaluation automatique de la gravité, alertes visuelles, historique graphique, traitements, rappels et export imprimable. Le même besoin a ensuite été repris en API Spring Boot et SPA React.",
      versions: [
        ["V1 — PHP 8 / MySQL", "En ligne", "Application complète déployée sur InfinityFree : Bootstrap 5, Chart.js, PDO, seuils OMS/HAS et export du dossier par impression."],
        ["V2 — Spring Boot 3.2 / React 19", "Réécriture", "API REST + SPA TypeScript pour séparer le rendu de la logique et passer à une authentification stateless."],
      ],
      points: [
        "Analyse des besoins, conception des parcours utilisateurs et maquettes Figma.",
        "Développement des interfaces de gestion et de suivi.",
        "Évaluation du niveau de gravité selon les seuils OMS/HAS : normale, élevée, hypertension, crise hypertensive.",
        "Bandeau clignotant et alerte visuelle sur le tableau de bord dès qu'une mesure est anormale.",
        "Validation physiologique des valeurs et interdiction des dates futures pour les mesures et effets.",
        "Export PDF du dossier patient via la feuille d'impression dédiée.",
        "Tests fonctionnels, remontée d'anomalies et documentation technique.",
        "Sécurité : requêtes préparées, hachage des mots de passe, vérification de propriété avant suppression, filtre JWT côté API.",
        "API REST : 9 contrôleurs, 7 entités JPA et DTO dédiés ; front React avec contexte d'authentification, routes privées et test React Testing Library.",
        "Industrialisation de la V2 : Maven Wrapper, variables d'environnement pour la base et le secret JWT.",
      ],
      choices:
        "Deux implémentations pour deux objectifs. La V1 devait rester déployable sur un hébergement mutualisé gratuit, sans framework, tout en gardant un code lisible. La V2 est une montée en compétence volontaire : comprendre ce que Spring apporte (injection de dépendances, JPA, sécurité déclarative) et ce que React apporte (composants, état, routage).",
      limits:
        "V1 : un utilisateur ne peut suivre qu'un seul patient, le mot de passe oublié n'est pas implémenté et l'export repose sur l'impression navigateur. V2 : pas encore de README racine ni de tests d'intégration back-end, et pas de déploiement en ligne.",
      links: [
        { label: "Voir la démo en ligne", href: "https://tensionwatch.wuaze.com", external: true },
        { label: "Code V1 (PHP)", href: "https://github.com/rayanerakpo-blip/TensionWatch", external: true },
        { label: "Code V2 (Spring / React)", href: "https://github.com/rayanerakpo-blip/tensionwatch-java-react", external: true },
      ],
      gallery: [
        ["tw-dashboard.jpg", "Tableau de bord", "Mesures de la patiente de démonstration, moyenne, tension du jour et dernières valeurs."],
        ["tw-tension.jpg", "Suivi de tension", "Saisie d'une mesure et historique graphique avec repères de gravité."],
        ["tw-medicaments.jpg", "Traitements", "Traitements en cours, dosage, fréquence et heure de prise."],
        ["tw-conseils.jpg", "Conseils", "Recommandations d'accompagnement pour le proche aidant."],
        ["tw-login.jpg", "Connexion", "Authentification avec mot de passe haché."],
        ["twapi-login.jpg", "Connexion React", "SPA React 19 + TypeScript : écran de connexion relié à l'API Spring Boot."],
      ],
    },
    lexilux: {
      tag: "Hackathon · Assemblée nationale 2026",
      title: "LEXILUX",
      stats: [
        ["2026", "Assemblée nationale"],
        ["RAG", "architecture IA"],
        ["1", "agent conversationnel"],
      ],
      problem:
        "Le droit français est difficile d'accès : vocabulaire technique, phrases longues, renvois entre articles. Un citoyen ne sait pas toujours ce que dit la loi ni ce qu'elle implique pour sa situation.",
      solution:
        "Un assistant conversationnel qui reformule le droit en langage clair. Le projet a été conçu en équipe pendant un hackathon : définition des cas d'usage, tests avec différents profils, évaluation de la pertinence des réponses et remontée des anomalies.",
      points: [
        "Réalisation de tests utilisateurs sur différents profils et cas d'usage.",
        "Évaluation de la pertinence et de la compréhension des réponses de l'agent.",
        "Identification et remontée d'anomalies fonctionnelles et de pistes d'amélioration.",
        "Analyse du fonctionnement d'un outil intégrant une API d'IA et un système RAG.",
        "Proposition d'améliorations des parcours et des modes d'interaction.",
        "Travail en équipe avec les développeurs autour des retours utilisateurs.",
      ],
      choices:
        "Le choix central est de ne pas laisser le modèle répondre seul : l'outil combine une API d'IA et un système RAG, et l'évaluation humaine vérifie la pertinence et la compréhension des réponses. Les tests utilisateurs ont servi de garde-fou : une réponse fluide n'est pas forcément une réponse juste.",
      limits:
        "Le projet est un prototype de hackathon, pas un service juridique : les réponses ne remplacent pas un professionnel du droit, et les cas d'usage couverts restent limités.",
      links: [],
      gallery: [],
    },
    fairrepair: {
      tag: "Projet BTS SLAM · 2026",
      title: "Fair'repair",
      stats: [
        ["39", "pages PHP"],
        ["12", "tables MySQL"],
        ["105", "requêtes préparées"],
      ],
      problem:
        "Avec le retour du vélo en ville, trouver un réparateur de confiance, comparer les prix et réserver reste compliqué. Les réparateurs indépendants, eux, manquent de visibilité.",
      solution:
        "Une plateforme unique avec un espace client (recherche, carte, réservation, avis), un espace réparateur (services, demandes, revenus) et un espace administrateur (modération, sécurité, journalisation).",
      points: [
        "Recherche par mot-clé et carte interactive OpenStreetMap avec popups.",
        "Cycle de réservation complet : demande, acceptation, réalisation, avis.",
        "Tableau de bord réparateur avec statistiques et graphique sur 6 mois.",
        "RGPD : consentement à l'inscription, export JSON des données, suppression définitive du compte.",
        "Sécurité : verrouillage après 5 échecs, journal d'authentification, requêtes préparées, échappement XSS.",
      ],
      choices:
        "Développement sans framework pour maîtriser chaque brique : routage, sessions, autorisations et accès aux données. Le projet est documenté par un support de soutenance et un script de démonstration minuté.",
      limits:
        "Le paiement en ligne est simulé ; il n'y a pas encore de messagerie interne ni de notifications e-mail à chaque changement de statut.",
      links: [{ label: "Code source", href: "https://github.com/rayanerakpo-blip/fair-repair", external: true }],
      gallery: [
        ["fairrepair-home.jpg", "Accueil", "Recherche de réparateurs, services et avis sur la page d'accueil."],
        ["fairrepair-carte.jpg", "Carte interactive", "Carte OpenStreetMap des réparateurs référencés."],
        ["fairrepair-login.jpg", "Connexion", "Accès aux espaces client, réparateur et administrateur."],
      ],
    },

    ferme: {
      tag: "Application métier · 2026",
      title: "Ferme Togo",
      stats: [
        ["3", "déclinaisons"],
        ["24", "tables MySQL"],
        ["18", "sources Java"],
      ],
      problem:
        "Une exploitation multi-filières (soja, manioc, maraîchage, élevage) gère sur papier des parcelles, des semis, des récoltes, des stocks, des transformations et des finances. Résultat : pas de traçabilité, pas de vision consolidée, et des conseils agricoles difficiles à justifier.",
      solution:
        "Une application de gestion agricole complète, déclinée en trois versions pour répondre à trois contraintes de déploiement — du serveur PHP classique à une application Java autonome.",
      versions: [
        ["V1 — PHP 8.2 / MySQL", "Version complète", "MVC maison, 24 tables, 84 routes et 43 vues, avec documentation Merise/UML."],
        ["V2 — PHP allégée", "Hébergement mutualisé", "Réécriture procédurale en 10 tables, 197 clés i18n et installateur verrouillé, avec guide de déploiement InfinityFree."],
        ["V3 — Java 25 / PWA", "Sans dépendance", "Serveur HTTP natif, store JSON atomique et front PWA : 18 sources Java, ~6 500 lignes et 827 clés i18n."],
      ],
      points: [
        "Chaîne complète parcelle → semis → récolte → stock → transformation → vente.",
        "Moteur de conseil : calendrier de plantation, plan d'irrigation, fertilisation, détection d'anomalies.",
        "Modules élevage, finances (rentabilité par filière et par parcelle), personnel et observatoire.",
        "Import de relevés drone, analyses de sol et pluviométrie ; analyse d'images par verdeur ExG dans la V3.",
        "Installateur CLI et web idempotent, jeu de démonstration, sauvegarde/restauration SQL.",
        "Documentation : MCD, MLD, UML, UX, moteur de conseil, guide utilisateur, tests et perspectives.",
        "V3 : authentification PBKDF2, sessions bearer, écritures atomiques, sauvegardes quotidiennes et 70+ assertions API.",
      ],
      choices:
        "Trois réponses à trois contraintes réelles : la V1 privilégie la complétude métier, la V2 la portabilité sur un mutualisé, la V3 l'autonomie sur une machine rurale où seul le JDK est garanti. Dans les trois cas, les règles agronomiques restent déterministes et explicables plutôt qu'un modèle opaque.",
      limits:
        "La V1 couvre 2 des 17 hectares et l'import drone reste un fichier structuré. La V2 laisse de côté le drone et l'observatoire. La V3 calcule un indice de verdeur ExG, pas un NDVI, et son rendu tactile n'a pas pu être testé faute de navigateur.",
      links: [
        { label: "Code V1 (PHP)", href: "https://github.com/rayanerakpo-blip/ferme-togo", external: true },
        { label: "Code V2 (PHP allégée)", href: "https://github.com/rayanerakpo-blip/la-ferme-togo", external: true },
      ],
      gallery: [
        ["ferme-dashboard.jpg", "Tableau de bord — V1", "Cultures en cours, tâches, parcelles et indicateurs financiers."],
        ["ferme-cultures.jpg", "Cultures — V1", "Parcelles, semis, stades et interventions culturales."],
        ["ferme-finances.jpg", "Finances — V1", "Rentabilité par filière et par parcelle."],
        ["ferme-drone.jpg", "Drone — V1", "Relevés drone et analyse des zones de la parcelle."],
        ["ferme-conseil.jpg", "Moteur de conseil — V1", "Recommandations agronomiques explicables : irrigation, fertilisation, anomalies."],
        ["ferme-login.jpg", "Connexion — V1", "Authentification et choix de la langue de l'interface."],
        ["laferme-dashboard.jpg", "Vue d'ensemble — V2", "Parcelles, cultures, stocks et finances de l'exploitation."],
        ["laferme-login.jpg", "Connexion — V2", "Authentification propriétaire / collaborateur."],
        ["fermejava-dashboard.jpg", "Tableau de bord — V3", "Indicateurs de la ferme, cultures et tâches du jour."],
        ["fermejava-parcelles.jpg", "Parcelles — V3", "Parcelles, zones et surfaces cultivées."],
        ["fermejava-cultures.jpg", "Cultures — V3", "Cycles culturaux, stades et interventions."],
        ["fermejava-drone.jpg", "Survols drone — V3", "Relevés drone et indice de végétation calculé par zone."],
        ["fermejava-conseil.jpg", "Recommandations — V3", "Conseils agronomiques explicables produits par le moteur de règles."],
      ],
    },
    togo: {
      tag: "Portail public · 2026",
      title: "Portail du Togo",
      stats: [
        ["17", "démarches"],
        ["11", "ministères"],
        ["8", "tables"],
      ],
      problem:
        "L'information administrative togolaise est dispersée entre sites ministériels, PDF et bouche-à-oreille. Le citoyen ne sait pas quels documents fournir, ni quel délai prévoir.",
      solution:
        "Un portail inspiré de france.gouv.fr : démarches classées, fiches détaillées, ministères, actualités, numéros d'urgence et recherche globale avec suggestions instantanées. Un back-office permet de tout administrer.",
      points: [
        "Recherche AJAX avec autocomplétion sur les démarches, ministères et actualités.",
        "Fiches démarche : documents requis, étapes, coût, délai, lieu, liens officiels.",
        "Back-office CRUD complet, boîte de messages, export CSV et journal d'audit.",
        "SEO : JSON-LD, Open Graph, URL canonique, sitemap XML dynamique et robots.txt.",
        "Accessibilité : lien d'évitement, ARIA, navigation clavier, focus visible, réduction des animations.",
        "Contact protégé par honeypot et limitation de fréquence.",
      ],
      choices:
        "PHP sans framework pour rester portable, mais avec une vraie exigence de qualité front : identité visuelle du Togo en SVG, feuille d'impression dédiée, compression et cache via .htaccess.",
      limits:
        "Les données de démarches sont des données de démonstration ; le portail n'est pas rattaché à une source officielle.",
      links: [{ label: "Code source", href: "https://github.com/rayanerakpo-blip/portail-du-togo", external: true }],
      gallery: [
        ["togo-home.jpg", "Accueil", "Recherche globale et accès aux démarches les plus consultées."],
        ["togo-demarches.jpg", "Démarches", "Liste filtrable des démarches administratives."],
        ["togo-urgences.jpg", "Urgences", "Numéros d'urgence et contacts utiles."],
      ],
    },

    formasat: {
      tag: "Projet BTS · 2026",
      title: "FormaSat",
      stats: [
        ["7", "tables"],
        ["5", "critères"],
        ["4", "triggers SQL"],
      ],
      problem:
        "Les retours sur les modules de formation sont collectés de façon informelle : impossible de comparer les promotions, de repérer un module en difficulté ou de suivre une évolution dans le temps.",
      solution:
        "Une plateforme à deux espaces : l'étudiant note chaque module sur cinq critères (une seule évaluation par module), l'administrateur consulte des statistiques agrégées et gère étudiants, professeurs, promotions et modules.",
      points: [
        "Notation sur 5 axes : contenu, pédagogie, support, rythme, applicabilité.",
        "Table d'agrégats stats_module maintenue automatiquement par des triggers SQL versionnés.",
        "Triggers de contrôle des dates, d'initialisation des stats et de journalisation des suppressions.",
        "Dashboard admin : compteurs, moyennes par module, dernières évaluations.",
        "Procédure de migration SQL versionnée et script d'application des triggers.",
      ],
      choices:
        "Le choix fort du projet est de déporter une partie de la logique dans la base : les agrégats sont recalculés par la base elle-même, ce qui garantit la cohérence même en cas d'écriture concurrente.",
      limits:
        "Pas de gestion de plusieurs années d'évaluation par étudiant ; l'export des résultats reste à ajouter.",
      links: [{ label: "Code source", href: "https://github.com/rayanerakpo-blip/formasat", external: true }],
      gallery: [
        ["formasat-admin.jpg", "Tableau de bord admin", "Statistiques agrégées, promotions, professeurs, modules et évaluations."],
        ["formasat-login.jpg", "Connexion admin", "Accès réservé à l'administration pédagogique."],
      ],
    },

  };

  const openModal = (key) => {
    const p = data[key];
    if (!p || !modal || !modalBody) return;
    lastFocus = document.activeElement;

    const stats = p.stats
      .map(([v, l]) => `<div class="m-stat"><strong>${v}</strong><span>${l}</span></div>`)
      .join("");
    const points = p.points.map((x) => `<li>${x}</li>`).join("");
    const gallery = (p.gallery || []).length
      ? `<div class="m-section m-section--gallery"><h4>Captures d'écran</h4><div class="m-gallery">${p.gallery
          .map(
            ([file, title, desc]) =>
              `<figure><a href="assets/img/${file}" target="_blank" rel="noopener"><img src="assets/img/${file}" alt="${desc}" loading="lazy" width="980" height="840"></a><figcaption><b>${title}</b><span>${desc}</span></figcaption></figure>`
          )
          .join("")}</div></div>`
      : "";
    const links = p.links.length
      ? `<div class="m-actions">${p.links
          .map(
            (l) =>
              `<a class="btn btn--primary" href="${l.href}"${l.external ? ' target="_blank" rel="noopener"' : ""}>${l.label}</a>`
          )
          .join("")}</div>`
      : "";
    const versions = (p.versions || []).length
      ? `<div class="m-section"><h4>Les versions</h4><div class="m-versions${
          p.versions.length === 3 ? " m-versions--3" : ""
        }">${p.versions
          .map(
            ([name, stack, desc]) =>
              `<div class="m-version"><strong>${name}</strong><span>${stack}</span><p>${desc}</p></div>`
          )
          .join("")}</div></div>`
      : "";

    modalBody.innerHTML = `
      <div class="m-head">
        <span class="pill pill--accent">${p.tag}</span>
        <h3 id="modal-title">${p.title}</h3>
      </div>
      <div class="m-grid">${stats}</div>
      ${gallery}
      <div class="m-section"><h4>Le problème</h4><p>${p.problem}</p></div>
      <div class="m-section"><h4>La solution</h4><p>${p.solution}</p></div>
      ${versions}
      <div class="m-section"><h4>Ce qui a été réalisé</h4><ul>${points}</ul></div>
      <div class="m-section"><h4>Choix techniques</h4><p>${p.choices}</p></div>
      <div class="m-section"><h4>Limites assumées</h4><p>${p.limits}</p></div>
      ${links}
    `;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal__close", modal)?.focus();
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  };

  $$("[data-project]").forEach((btn) =>
    btn.addEventListener("click", () => openModal(btn.dataset.project))
  );
  $$("[data-close]", modal || document).forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeNav(); }
  });

  /* -------------------------------------------------------- Copier e-mail */
  const copyBtn = $("#copy-mail");
  copyBtn?.addEventListener("click", async () => {
    const mail = copyBtn.dataset.mail;
    try {
      await navigator.clipboard.writeText(mail);
      toast("Adresse copiée : " + mail);
      copyBtn.classList.add("is-done");
      setTimeout(() => copyBtn.classList.remove("is-done"), 1800);
    } catch {
      window.location.href = "mailto:" + mail;
    }
  });

  /* ------------------------------------------------------------- Toast */
  let toastEl = null;
  let toastTimer = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.setAttribute("role", "status");
      toastEl.style.cssText = [
        "position:fixed", "left:50%", "bottom:26px", "transform:translateX(-50%) translateY(20px)",
        "z-index:300", "padding:12px 20px", "border-radius:12px",
        "background:var(--bg-2)", "border:1px solid var(--border-strong)",
        "color:var(--text)", "font:600 13.5px var(--font)", "box-shadow:var(--shadow)",
        "opacity:0", "transition:opacity .22s,transform .22s", "pointer-events:none",
        "max-width:calc(100vw - 40px)", "text-align:center",
      ].join(";");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    requestAnimationFrame(() => {
      toastEl.style.opacity = "1";
      toastEl.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateX(-50%) translateY(20px)";
    }, 2600);
  }

  /* --------------------------------------------------------------- Année */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* -------------------------------------- Ancres internes (veille) */
  $$('a[href^="#v"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
})();
