# Wooble Mod Index 📚

*Every Wooble mod in the Gen1Recomp launcher's Find mods tab.*

A mod index for [Gen1Recomp](https://github.com/bryanthaboi/gen1recomp). Add it once and the
mods below show up in the launcher, ready to install, alongside the main index.

## 💾 Adding it to the launcher

1. Open the launcher's **Find mods** tab.
2. Press **Add index**.
3. Paste **`poooooby/wooble-mod-index`** and confirm.

The mods appear in the list with the rest. Install one with a tap, and the launcher's MODS panel
keeps it up to date from then on.

## 🧩 What's in it

| Mod | What it does |
|---|---|
| [WoobleDex](https://github.com/poooooby/national_dex_gen3) | All 1025 Pokémon in every game, with today's moves, abilities, items and the Fairy type |
| [WoobleSpritePack](https://github.com/poooooby/g9-battle-sprites-gen3) | Animated, true-colour sprites for all 1025 Pokémon |
| [WoobleSpawns](https://github.com/poooooby/g1r_modern_spawns) | Fresh wild Pokémon from Generations 1 to 9, picked to fit each place |
| [WoobleView](https://github.com/poooooby/gen3-hd-sprites) | Sharp Pokémon, battles that fit any screen, battles in a 3D world |
| [Vivid Worlds](https://github.com/poooooby/wilds-of-hoenn) | Wild Pokémon roam the overworld of FireRed to Emerald, with a partner along |
| [Vivid Worlds: OG](https://github.com/poooooby/vivid-worlds-og) | Wild Pokémon roam the overworld of Red to Crystal, with a partner along |
| [WoobOS](https://github.com/poooooby/woob_os) | The PC as a modern desktop |
| [Galar Rising](https://github.com/poooooby/max-raids) | Sword and Shield's Max Raid Battles in FireRed to Emerald |
| [NaviPlay](https://github.com/poooooby/PlayNav) | A DS-style second screen to pet, feed, play with and train your Pokémon |
| [Terrarium2](https://github.com/poooooby/Terrarium) | Red, Blue and Yellow's overworld as a living 3D diorama |
| [Cleaner Mod Options](https://github.com/poooooby/cleaner-mod-options) | Hides disabled mods and other games' mods from the in-game mod menu |

## 📌 Good to know

- The list follows each mod's newest release on its own, refreshed every night.
- The launcher checks an index about once a day, so a brand-new release can take a day to show here.
  Mods you've installed update from the MODS panel straight away.

---

<details>
<summary>For maintainers</summary>

- `mods.json` lists each mod: `id` (its manifest id), `title`, `github` (`owner/repo`), `summary`,
  1-4 `categories` (GAMEPLAY, CONTENT, BALANCE, ART, AUDIO, UI, QOL, TRANSLATION,
  TOTAL_CONVERSION, LIBRARY, TOOL, OTHER), `tags`, and optionally `license`, `thumbnail` (a path in
  the mod's repo, or a full URL), `description` (default `README.md`) and `author` (default poooooby).
- `scripts/build.mjs` reads each mod's `manifest.json` and newest stable release with a `.zip`, and
  writes `site/data/index.json` (the launcher's feed, schema version 1). Run it with
  `GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs`.
- `.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push and nightly.
- **Thumbnails:** drop a picture in `site/thumbs/` named after the mod's id (`national_dex_gen3.png`,
  `max_raids.jpg`; PNG or JPG, 2 MB at most) and push. It wins over the row's `thumbnail`. The
  launcher shows it in a small square, fitted without cropping, so square pictures read best
  (256x256 is plenty).
- To add a mod, add its row to `mods.json` and push. No row changes for new versions.

</details>
