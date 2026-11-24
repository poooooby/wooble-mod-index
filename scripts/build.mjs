#!/usr/bin/env node
// Builds site/data/index.json, the feed the Gen1Recomp launcher's Find mods tab reads
// (src/mods/ModIndex.lua in the engine: schema_version 1).
//
// mods.json holds only what a mod's own repo can't say (title, summary, categories, tags,
// licence, thumbnail). Everything else is read fresh from GitHub on every run:
//   - the mod's manifest.json on its default branch: id check, games, api, game_version,
//     profile, permissions, dependencies, conflicts
//   - its Releases: the newest stable release with a .zip, picked the way the launcher's
//     ModUpdate does (<id>-<version>.zip, then <id>*.zip, then any .zip)
// so the index follows every release without anyone editing it.
//
//   GITHUB_TOKEN=... node scripts/build.mjs
//
// A mod that can't be read is still listed, with update_check "error: ..." (the launcher
// shows it as not installable); the build fails only when no mod could be read at all.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.GITHUB_TOKEN || '';
const AUTHOR = 'poooooby';
const CATEGORIES = ['GAMEPLAY', 'CONTENT', 'BALANCE', 'ART', 'AUDIO', 'UI', 'QOL', 'TRANSLATION',
  'TOTAL_CONVERSION', 'LIBRARY', 'TOOL', 'OTHER'];

async function gh(path) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'wooble-mod-index' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function manifestOf(repo) {
  const doc = await gh(`repos/${repo}/contents/manifest.json`);
  const text = Buffer.from(doc.content, 'base64').toString('utf8').replace(/^﻿/, '');
  return JSON.parse(text);
}

function pickZip(assets, id, version) {
  const zips = (assets || []).filter((a) => a.name.toLowerCase().endsWith('.zip'));
  const lower = id.toLowerCase();
  return zips.find((a) => a.name.toLowerCase() === `${lower}-${version}.zip`.toLowerCase())
    || zips.find((a) => a.name.toLowerCase().startsWith(lower))
    || zips[0] || null;
}

function pickRelease(releases, id) {
  for (const r of releases) {
    if (r.draft || r.prerelease) continue;
    const version = String(r.tag_name || '').replace(/^v/i, '');
    const zip = pickZip(r.assets, id, version);
    if (!zip) continue;
    return {
      version, tag: r.tag_name, name: r.name || r.tag_name, prerelease: false,
      published_at: r.published_at,
      zip: { name: zip.name, url: zip.browser_download_url, size: zip.size },
    };
  }
  return null;
}

function raw(repo, path) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `https://raw.githubusercontent.com/${repo}/HEAD/${path.replace(/^\//, '')}`;
}

// A picture in site/thumbs/<id>.png (or .jpg) wins over mods.json's thumbnail. It ships with the
// Pages site, so the feed names it relative to the site root, which the launcher resolves itself.
const THUMB_MAX = 2 * 1024 * 1024;
function localThumb(id) {
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const file = join(root, 'site', 'thumbs', `${id}.${ext}`);
    if (!existsSync(file)) continue;
    if (statSync(file).size > THUMB_MAX) throw new Error(`site/thumbs/${id}.${ext} is over 2 MB`);
    return `thumbs/${id}.${ext}`;
  }
  return null;
}

const listed = JSON.parse(readFileSync(join(root, 'mods.json'), 'utf8'));
const mods = [];
let readable = 0;
for (const m of listed) {
  const bad = (m.categories || []).filter((c) => !CATEGORIES.includes(c));
  if (!m.id || !m.title || !m.github || bad.length) {
    throw new Error(`mods.json: ${m.id || '?'} needs id, title, github and known categories (${bad.join(', ')})`);
  }
  const entry = {
    folder: `${AUTHOR}@${m.id}`,
    id: m.id,
    title: m.title,
    author: m.author || AUTHOR,
    summary: m.summary || '',
    categories: m.categories,
    tags: m.tags || [],
    repo: `https://github.com/${m.github}`,
    github: m.github,
    license: m.license,
    thumbnail: localThumb(m.id) || raw(m.github, m.thumbnail),
    description_url: raw(m.github, m.description || 'README.md'),
    update_check: 'pending',
  };
  try {
    const manifest = await manifestOf(m.github);
    if (manifest.id !== m.id) throw new Error(`manifest id is ${manifest.id}, not ${m.id}`);
    for (const key of ['games', 'api', 'game_version', 'profile', 'affects_link', 'experimental',
      'permissions', 'dependencies', 'conflicts']) {
      if (manifest[key] !== undefined) entry[key] = manifest[key];
    }
    entry.version = manifest.version;
    const releases = await gh(`repos/${m.github}/releases?per_page=100`);
    entry.latest = pickRelease(releases, m.id);
    entry.update_check = entry.latest ? 'ok' : 'no installable release';
    if (entry.latest) {
      entry.version = entry.latest.version;
      entry.last_release = entry.latest.published_at;
    }
    const dated = releases.filter((r) => !r.draft && r.published_at).map((r) => r.published_at).sort();
    if (dated.length) entry.first_release = dated[0];
    let total = 0;
    for (const r of releases) for (const a of r.assets || []) {
      if (a.name.toLowerCase().endsWith('.zip')) total += a.download_count || 0;
    }
    entry.downloads = { total, as_of: new Date().toISOString() };
    readable += 1;
  } catch (err) {
    entry.update_check = `error: ${err.message}`;
    console.error(`${m.id}: ${err.message}`);
  }
  mods.push(entry);
}
if (readable === 0) throw new Error('no mod could be read; not publishing an empty index');

mods.sort((a, b) => a.title.localeCompare(b.title));
const index = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  count: mods.length,
  cart_count: 0,
  categories: CATEGORIES,
  mods,
  carts: [],
};
mkdirSync(join(root, 'site', 'data'), { recursive: true });
writeFileSync(join(root, 'site', 'data', 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`wrote site/data/index.json: ${mods.length} mods`);
for (const e of mods) console.log(`- ${e.title} (${e.id}) ${e.latest ? e.latest.version + ' ' + e.latest.zip.name : e.update_check}`);
