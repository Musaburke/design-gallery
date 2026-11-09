# Design gallery

Musa's component gallery: every background and effect from his sites, running live, with its code. Local only, private repo, not deployed.

Stack: Astro 7, TypeScript, Tailwind 4, `three`. Run with `npm run dev`. Check with `npm run check`.

## How it works
- `src/data/components.ts` is the one list. Each entry points at `src/gallery/<slug>/`.
- `entry` is the component the pages render. `files` are shown as code, in order, with paths relative to `src/`.
- `src/lib/demos.ts` loads the demos and the raw text of their files with `import.meta.glob`. The code panels show the same files the demos run, so they can't drift.
- `groups` in `components.ts` sets the group order, headings, one-line descriptions and the `feature` demo for each group. The landing page, the group pages and the header all read it.
- `/` is the landing page: a jump list and one tile per group, led by its `feature` demo. Those demos are `inert`, so they play but take no clicks; the tile is one link.
- `/g/<slug>/` is a group's grid of live previews. The grid layout follows the count (1, 2, 3 or 5 across). `/c/<slug>/` is the full demo, the code and what changed.
- Demos inside `[data-preview]` (grid cards and landing tiles) may play themselves. `src/lib/preview.ts` says when: on screen, tab visible, no pointer or focus inside. The drawer and the pyramid use it; scroll reveal has its own copy.
- `origin` (the source repo and path) stays in `components.ts` but is hidden on the pages for now. Musa will confirm before it comes back. No site names in visible text, `changes` or code comments.

## Adding a component
1. Copy the original into `src/gallery/<slug>/`. It's a snapshot, not a link to the other repo.
2. Make it fill its parent instead of the window. It must handle several instances on one page and pause off screen. Three.js loads lazily when in view. Respect `prefers-reduced-motion`.
3. Add an entry to `components.ts` with `origin`, `ground` (the source site's background colour) and `changes` (what was altered for the gallery). A new group needs an entry in `groups` too.
4. Check the landing tile, the group grid and the detail page in a browser with zero console errors.
5. Glass: check `backdrop-filter` survives in the built CSS (`dist/_astro/*.css`). One minifier once kept only the `-webkit-` copy, which left Chrome with no blur.

## Rules
- Placeholders only. No client logos, contact details, socials or personal data from `site.ts`. A component from a client site keeps the code and loses the content.
- The chrome stays quiet and dark: one ground, one ink, the sage accent on the mark and focus only. The components are the loud part.
- Skills: `design-taste-frontend` (app-screen rules) and `emil-design-eng` for UI. Run `impeccable` and `web-design-guidelines` after a section. Skills live in `.claude/skills`, copied from `DBS-cleaning`.

## Skill demos
- One made-up product, Tallbook, built once per design skill and once with none. The brief and the full copy are in `src/data/skill-demos/brief.md`, and every version uses them word for word.
- Each version was built by a fresh agent allowed only its one skill (the baseline got none) and lives as static files in `public/skill-demos/<id>/`. Link to `.../index.html`: the dev server doesn't map a public folder to its index.
- `src/data/skill-demos.ts` lists the versions with notes from each builder's report. `/skills/` compares them, `/skills/<id>/` shows one live with a desktop/phone toggle, and `/skills/brief/` renders the brief.
- Captures in `public/skill-demos/thumbs/` (WebP): a first screen and the whole page for each version, desktop at 1.5× and phone at 2×. `/skills/` shows one version at a time: a row of chips picks it (the hash names it, e.g. `/skills/#design-taste`), and its whole page shows in a `Peek.astro` window with a Desktop/Phone switch above it. The switch applies to every version. Without JS all versions show stacked. Like the scroll reveal card, a Peek plays itself while on screen (slow scroll down, pause, glide back). The wheel and swipes pass over it to the page, so it never traps you; clicking, tapping or tabbing into it stops the play and lets you scroll it by hand until you click outside or press Escape. Each version's words and stats sit above its preview, with a solid "Open the full page" button (new tab). Their pixel sizes are in `src/data/skill-demos/shots.json`.
- To retake them: `node tools/capture-skill-demos.mjs <png dir> <id> ...` with the dev server on 4324 (it borrows `playwright-core` from `~/Projects/portfolio`), then `cwebp -q 82 -m 6` each PNG into `thumbs/` and update `shots.json`. It waits for entrances to settle, scrolls the page so reveals fire, and puts bottom-sticky elements back in the flow for the full shot (a full-page capture leaves their place blank otherwise).
- Token use and cost: `python3 tools/agent-usage.py src/data/skill-demos/usage.json <id>=<agent transcript .jsonl> ...` sums each builder's transcript and prices it at API list prices (the `PRICES` table in the script). Run it only once every agent has finished, because a transcript is still growing until then.
- To add a skill: copy the builder prompt pattern (one skill, the brief, write only in its folder), add an entry to `skill-demos.ts`, rerun the usage script with every transcript, and retake thumbnails.

## Notes
- The FAQ accordion was a React island on its source site. Here it is rebuilt with `details`/`summary`, since the gallery has no React.
