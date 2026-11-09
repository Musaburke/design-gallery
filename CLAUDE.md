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

## Later
- Skill demos: rebuild one landing page with each design skill and compare. Planned as a second section.

## Notes
- The FAQ accordion was a React island on its source site. Here it is rebuilt with `details`/`summary`, since the gallery has no React.
