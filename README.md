# Design gallery

The components from my sites in one place, each running live with its code.

**Live:** https://musa-design-gallery.pages.dev

## What's in it

- **Components,** in five groups: backgrounds, motion and effects, navigation, page sections and surfaces. Each one has a live preview and a page with the full demo and every file it needs.
- **Skill demos:** one made-up product, Tallbook, built once per design skill and once with none, so the skills can be compared side by side on desktop and phone. Each version lists what it cost in tokens.

Every demo uses placeholder content. No client logos, contact details or personal data.

## Built with

Astro 7, TypeScript, Tailwind CSS 4 and Three.js. Hosted free on Cloudflare Pages, with security headers and an enforced Content Security Policy.

## Run it locally

Needs Node 22 or newer.

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # type check, then build
```

## Where things live

- `src/data/components.ts`: the one list of components and groups. Each entry points at a folder in `src/gallery/<slug>/`.
- `src/lib/demos.ts`: loads each demo and the raw text of its files, so the code panels always match what runs.
- `src/data/skill-demos.ts`: the skill demo versions and their notes. The built versions are static files in `public/skill-demos/`.
- `CLAUDE.md`: how to add a component, and the rules every demo follows.

## Deploys

Merging into `main` deploys to Cloudflare Pages. Every other branch gets its own preview address.
