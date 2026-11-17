#!/usr/bin/env node
/* ==========================================================================
   Veille — agrégateur RSS/Atom sans dépendance (Node 18+)
   Lit veille/sources.json, interroge les flux, filtre par mots-clés,
   produit un digest Markdown + un JSON, et peut mettre à jour le portfolio.

   Usage :
     node veille/veille.mjs
     node veille/veille.mjs --days 7 --limit 8
     node veille/veille.mjs --dry-run
     node veille/veille.mjs --site
   ========================================================================== */

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SITE = join(ROOT, "index.html");
const OUT_DIGESTS = join(HERE, "digests");
const OUT_DATA = join(HERE, "data");

/* ------------------------------------------------------------------ CLI */
const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
function opt(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}

const DAYS = Number(opt("days", 0)) || 0;
const LIMIT = Number(opt("limit", 0)) || 0;
const DRY = has("dry-run");
const UPDATE_SITE = has("site");

/* -------------------------------------------------------------- Helpers */
const ISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const frDate = (d) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);

const frShort = (d) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(d);

function normalize(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&hellip;/gi, "…");
}

function safeChar(code) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function cleanText(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  return s.replace(/\s+/g, " ").trim();
}

function truncate(s, n = 260) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const i = cut.lastIndexOf(" ");
  const base = i > n * 0.6 ? cut.slice(0, i) : cut;
  return `${base.replace(/[.,;:!?]$/, "")}…`;
}

function cleanTitle(s) {
  return s.replace(/^(article|podcast|video|présentation|presentation|interview|news)\s*:\s*/i, "").trim();
}

function cleanLink(url) {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) {
      if (/^utm_/i.test(key)) u.searchParams.delete(key);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function atomLink(block) {
  const alt = block.match(
    /<link\b[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i
  );
  if (alt) return alt[1];
  const any = block.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i);
  return any ? any[1] : "";
}

function firstUrl(block) {
  const raw = tag(block, "link");
  const clean = cleanText(raw);
  if (/^https?:\/\//i.test(clean)) return clean;
  return atomLink(block);
}

function firstDate(block) {
  for (const name of ["pubDate", "published", "updated", "dc:date", "date"]) {
    const raw = cleanText(tag(block, name));
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function firstSummary(block) {
  for (const name of ["description", "summary", "content:encoded", "content"]) {
    const raw = tag(block, name);
    if (raw) {
      const text = cleanText(raw);
      if (text) return truncate(text);
    }
  }
  return "";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------------------------------------- Parsing */
function parseFeed(xml, source) {
  const blocks = [
    ...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);

  return blocks
    .map((block) => {
      const title = cleanTitle(cleanText(tag(block, "title")));
      const link = cleanLink(firstUrl(block).trim());
      const date = firstDate(block);
      const summary = firstSummary(block);
      if (!title || !link) return null;
      return { title, link, date, summary, source };
    })
    .filter(Boolean);
}

async function fetchFeed(source) {
  const res = await fetch(source.url, {
    headers: {
      "user-agent": "VeillePortfolio/1.0 (+https://github.com/rayanerakpo)",
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(20000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const ct = res.headers.get("content-type") || "";
  const charset = (ct.match(/charset=([\w-]+)/i) || [, "utf-8"])[1];
  const buf = await res.arrayBuffer();
  let xml;
  try {
    xml = new TextDecoder(charset, { fatal: false }).decode(buf);
  } catch {
    xml = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  }
  const items = parseFeed(xml, source);
  if (!items.length) throw new Error("aucun élément lisible");
  return items;
}

/* --------------------------------------------------------------- Scoring */
function keywordMatcher(keyword) {
  const n = normalize(keyword);
  const escaped = escapeRe(n).replace(/\\ /g, "\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

function scoreItem(item, keywords, now) {
  const haystack = normalize(`${item.title} ${item.summary}`);
  const hits = [];
  let score = 0;
  for (const [kw, weight] of Object.entries(keywords)) {
    if (keywordMatcher(kw).test(haystack)) {
      score += weight;
      hits.push(kw);
    }
  }
  score += item.source.poids || 0;

  const ageDays = item.date ? (now - item.date) / 86400000 : 999;
  score += Math.max(0, 3 - ageDays / 7);

  return { score, hits };
}

function dedupeKey(item) {
  return normalize(item.title).replace(/\s+/g, "");
}

function diversify(items, maxPerSource, size) {
  const counts = new Map();
  const picked = [];
  for (const item of items) {
    if (picked.length >= size) break;
    const n = counts.get(item.source.nom) || 0;
    if (n >= maxPerSource) continue;
    counts.set(item.source.nom, n + 1);
    picked.push(item);
  }
  if (picked.length < size) {
    for (const item of items) {
      if (picked.includes(item)) continue;
      picked.push(item);
      if (picked.length >= size) break;
    }
  }
  return picked;
}

/* ------------------------------------------------------------------ Main */
async function main() {
  const config = JSON.parse(await readFile(join(HERE, "sources.json"), "utf8"));
  const settings = config.reglages || {};
  const days = DAYS || settings.jours || 21;
  const limit = LIMIT || settings.max || 12;
  const maxSite = settings.maxSite || 5;
  const now = new Date();
  const since = new Date(now.getTime() - days * 86400000);

  console.log(`\nVeille — ${frDate(now)}`);
  console.log(`Période : ${days} jours · ${config.sources.length} flux · limite ${limit}\n`);

  const results = await Promise.allSettled(config.sources.map(fetchFeed));

  const feedStatus = [];
  const collected = [];

  results.forEach((result, i) => {
    const source = config.sources[i];
    if (result.status === "fulfilled") {
      feedStatus.push({ nom: source.nom, url: source.url, statut: "ok", brut: result.value.length });
      collected.push(...result.value);
      console.log(`  ok    ${source.nom.padEnd(22)} ${String(result.value.length).padStart(4)} éléments`);
    } else {
      feedStatus.push({
        nom: source.nom,
        url: source.url,
        statut: "erreur",
        brut: 0,
        erreur: result.reason?.message || String(result.reason),
      });
      console.log(`  ERREUR ${source.nom.padEnd(21)} ${result.reason?.message || result.reason}`);
    }
  });

  const seenTitles = new Set();
  const seenLinks = new Set();
  const kept = [];

  for (const item of collected) {
    if (item.date && item.date < since) continue;
    if (!item.date) item.date = now;

    const tKey = dedupeKey(item);
    const lKey = item.link.replace(/[?#].*$/, "").replace(/\/$/, "");
    if (seenTitles.has(tKey) || seenLinks.has(lKey)) continue;
    seenTitles.add(tKey);
    seenLinks.add(lKey);

    const { score, hits } = scoreItem(item, config.motsCles || {}, now);
    if (!hits.length && (item.source.poids || 0) < 3) continue;

    kept.push({ ...item, score: Math.round(score * 10) / 10, hits });
  }

  kept.sort((a, b) => b.score - a.score || b.date - a.date);
  const selection = kept.slice(0, limit);

  const keptByFeed = new Map();
  for (const item of kept) {
    keptByFeed.set(item.source.nom, (keptByFeed.get(item.source.nom) || 0) + 1);
  }

  console.log(
    `\n${collected.length} éléments lus · ${kept.length} pertinents · ${selection.length} retenus\n`
  );

  if (DRY) {
    for (const item of selection) {
      console.log(`[${item.score}] ${item.title}`);
      console.log(`      ${item.source.nom} · ${frShort(item.date)} · ${item.hits.join(", ")}`);
      console.log(`      ${item.link}\n`);
    }
    return;
  }

  const day = ISO(now);
  await mkdir(OUT_DIGESTS, { recursive: true });
  await mkdir(OUT_DATA, { recursive: true });

  const markdown = buildMarkdown({ now, days, selection, feedStatus, config, keptByFeed });
  const digestPath = join(OUT_DIGESTS, `${day}.md`);
  await writeFile(digestPath, markdown, "utf8");
  await copyFile(digestPath, join(OUT_DIGESTS, "latest.md"));

  const payload = {
    genereLe: now.toISOString(),
    periodeJours: days,
    flux: feedStatus,
    elements: selection.map((item) => ({
      titre: item.title,
      lien: item.link,
      date: item.date.toISOString(),
      source: item.source.nom,
      theme: item.source.theme,
      resume: item.summary,
      score: item.score,
      motsCles: item.hits,
    })),
  };
  const jsonPath = join(OUT_DATA, `${day}.json`);
  await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DATA, "latest.json"), JSON.stringify(payload, null, 2), "utf8");

  console.log(`Digest  : ${digestPath}`);
  console.log(`JSON    : ${jsonPath}`);

  if (UPDATE_SITE) {
    const siteItems = diversify(selection, 2, maxSite);
    const injected = await injectSite(siteItems, feedStatus, now, days);
    console.log(`Portfolio : ${injected ? "sélection mise à jour dans index.html" : "non modifié"}`);
  }

  console.log("");
}

/* --------------------------------------------------------------- Digest */
function buildMarkdown({ now, days, selection, feedStatus, config, keptByFeed }) {
  const ok = feedStatus.filter((f) => f.statut === "ok").length;
  const lines = [];

  lines.push(`# Veille — sélection du ${frDate(now)}`);
  lines.push("");
  lines.push(
    `> Généré automatiquement depuis **${ok}/${feedStatus.length} flux** sur les **${days} derniers jours**.`
  );
  lines.push(
    "> Le tri est automatique ; la lecture critique, la fiche et l'analyse restent manuelles."
  );
  lines.push("");

  lines.push("## Sélection");
  lines.push("");

  if (!selection.length) {
    lines.push("_Aucun élément ne correspond aux critères sur la période. Augmente `--days` ou assouplis les mots-clés._");
    lines.push("");
  }

  selection.forEach((item, i) => {
    lines.push(`### ${i + 1}. ${item.title}`);
    lines.push("");
    lines.push(
      `- **Source :** ${item.source.nom} · **Date :** ${frShort(item.date)} · **Thème :** ${item.source.theme}`
    );
    lines.push(`- **Lien :** ${item.link}`);
    if (item.hits.length) lines.push(`- **Pourquoi :** ${item.hits.join(", ")}`);
    if (item.summary) lines.push(`- **Résumé :** ${item.summary}`);
    lines.push("");
  });

  lines.push("## Fiche de lecture (à remplir)");
  lines.push("");
  lines.push("| Champ | Contenu |");
  lines.push("|---|---|");
  lines.push("| Source retenue | |");
  lines.push("| Date de publication | |");
  lines.push("| Niveau de confiance | annonce / retour d'expérience / mesure |");
  lines.push("| Ce que ça change | |");
  lines.push("| Lien avec mon alternance | |");
  lines.push("| Question ouverte | |");
  lines.push("");

  lines.push("## État des flux");
  lines.push("");
  lines.push("| Source | Statut | Lus | Retenus |");
  lines.push("|---|---|---:|---:|");
  for (const feed of feedStatus) {
    const kept = keptByFeed.get(feed.nom) || 0;
    const statut = feed.statut === "ok" ? "ok" : `erreur — ${feed.erreur}`;
    lines.push(`| ${feed.nom} | ${statut} | ${feed.brut} | ${kept} |`);
  }
  lines.push("");

  if (config.lectureManuelle?.length) {
    lines.push("## À consulter manuellement");
    lines.push("");
    for (const source of config.lectureManuelle) {
      lines.push(`- [${source.nom}](${source.url})`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `Généré par \`veille/veille.mjs\` le ${frDate(now)}. Modifier les sources et les mots-clés dans \`veille/sources.json\`.`
  );
  lines.push("");

  return lines.join("\n");
}

/* --------------------------------------------------------------- Portfolio */
async function injectSite(items, feedStatus, now, days) {
  const START = "<!-- veille:auto:start -->";
  const END = "<!-- veille:auto:end -->";
  let html;
  try {
    html = await readFile(SITE, "utf8");
  } catch {
    console.warn("  index.html introuvable — injection ignorée.");
    return false;
  }

  const re = new RegExp(`${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}`);
  if (!re.test(html)) {
    console.warn(`  Marqueurs ${START} / ${END} absents de index.html — injection ignorée.`);
    return false;
  }

  const ok = feedStatus.filter((f) => f.statut === "ok").length;
  const rows = items
    .map(
      (item) => `                  <li>
                    <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(
        item.title
      )} <svg class="i"><use href="#i-external"/></svg></a>
                    <span>${escapeHtml(item.source.nom)} · ${escapeHtml(frShort(item.date))}</span>
                  </li>`
    )
    .join("\n");

  const block = `${START}
              <div class="v-auto">
                <div class="v-auto__head">
                  <h4>Sélection automatique — ${escapeHtml(frDate(now))}</h4>
                  <span class="pill">${ok} flux · ${days} jours</span>
                </div>
                <ul class="v-auto__list">
${rows}
                </ul>
                <p class="v-auto__note">
                  Sélection issue des flux RSS, classée par pertinence. Le tri est automatique ;
                  la lecture critique et la fiche de veille restent manuelles.
                </p>
              </div>
              ${END}`;

  await writeFile(SITE, html.replace(re, block), "utf8");
  return true;
}

main().catch((error) => {
  console.error("\nÉchec de la veille :", error.message);
  process.exitCode = 1;
});
