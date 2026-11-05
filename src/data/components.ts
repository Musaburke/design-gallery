// The gallery's one list. Each entry points at a folder in src/gallery/<slug>/.
// `entry` is the component the pages render; `files` are shown as code, in order.
// Paths in `files` are relative to src/ so shared helpers (lib/stage.ts) can be listed too.

export type Group = 'Backgrounds' | 'Motion';

export interface GalleryComponent {
  slug: string;
  name: string;
  group: Group;
  blurb: string;
  /** Where the original lives, as repo + path under ~/Projects. */
  origin: { repo: string; path: string };
  entry: string;
  files: string[];
  uses: string[];
  /** Ground colour of the site it came from, so the demo sits on its real background. */
  ground: string;
  /** What was changed to make it work inside a frame instead of a full page. */
  changes: string[];
}

export const components: GalleryComponent[] = [
  {
    slug: 'starfield',
    name: 'Starfield',
    group: 'Backgrounds',
    blurb: 'Twinkling stars with a heartbeat pulse. The cursor parts them and links the nearest into constellations.',
    origin: { repo: 'portfolio', path: 'src/components/Starfield.astro' },
    entry: 'Starfield.astro',
    files: ['gallery/starfield/Starfield.astro'],
    uses: ['Canvas 2D'],
    ground: '#1c1c1c',
    changes: [
      'Sized to its parent instead of the window, so several can run on one page.',
      'Dropped scroll drift, warp streaks and the contact-section boost, which were portfolio-only hooks.',
      'Pauses when off screen.',
    ],
  },
  {
    slug: 'globe',
    name: 'Wireframe globe',
    group: 'Backgrounds',
    blurb: 'A network sphere of evenly spread points joined to their nearest neighbours. Turns slowly and tilts toward the cursor.',
    origin: { repo: 'portfolio', path: 'src/scripts/three/globe.ts' },
    entry: 'Globe.astro',
    files: ['gallery/globe/Globe.astro', 'gallery/globe/globe.ts', 'lib/stage.ts'],
    uses: ['three'],
    ground: '#1c1c1c',
    changes: [
      'Point count follows the canvas width, not the window.',
      'Loads Three.js only when the frame scrolls into view.',
      'Pulses with the starfield when one is on the same page.',
    ],
  },
  {
    slug: 'particles',
    name: 'Particle network',
    group: 'Backgrounds',
    blurb: 'Drifting gold dots joined by thin lines, with lines reaching to the cursor.',
    origin: { repo: 'DBS-cleaning', path: 'src/components/common/ParticleBackground.astro' },
    entry: 'Particles.astro',
    files: ['gallery/particles/Particles.astro'],
    uses: ['Canvas 2D'],
    ground: '#0a0a0a',
    changes: [
      'Sized to its parent instead of fixed to the window.',
      'Pointer measured against the frame.',
      'Pauses when off screen.',
    ],
  },
  {
    slug: 'constellation',
    name: 'Constellation',
    group: 'Backgrounds',
    blurb: 'The light version of the starfield: green nodes that drift, link when close and reach for the cursor.',
    origin: { repo: 'ai-field-guide', path: 'src/components/Constellation.astro' },
    entry: 'Constellation.astro',
    files: ['gallery/constellation/Constellation.astro'],
    uses: ['Canvas 2D'],
    ground: '#fbf9f3',
    changes: [
      'Handles several canvases on one page.',
      'Redraws on resize of its frame, not the window.',
    ],
  },
  {
    slug: 'liquid-orb',
    name: 'Liquid orb',
    group: 'Motion',
    blurb: 'An iridescent glass blob whose surface ripples. A wireframe twin fades in while the cursor is over it.',
    origin: { repo: 'portfolio', path: 'src/scripts/three/orb.ts' },
    entry: 'Orb.astro',
    files: ['gallery/liquid-orb/Orb.astro', 'gallery/liquid-orb/orb.ts', 'lib/stage.ts'],
    uses: ['three', 'RoomEnvironment'],
    ground: '#1c1c1c',
    changes: ['Loads Three.js only when the frame scrolls into view.'],
  },
  {
    slug: 'preloader',
    name: 'Goo preloader',
    group: 'Motion',
    blurb: 'A name and three orbiting dots melted together by an SVG goo filter, then a curtain wipes up.',
    origin: { repo: 'portfolio', path: 'src/components/Preloader.astro' },
    entry: 'Preloader.astro',
    files: ['gallery/preloader/Preloader.astro'],
    uses: ['SVG filter', 'CSS'],
    ground: '#1c1c1c',
    changes: [
      'Plays inside its frame on a loop, with a replay button, instead of once per session over the whole page.',
      'Name is a prop instead of coming from site data.',
    ],
  },
  {
    slug: 'logo-orbit',
    name: 'Logo orbit',
    group: 'Motion',
    blurb: 'Links circling a logo, kept upright as they turn. Pauses on hover and focus so they are easy to hit. A sheen passes once.',
    origin: { repo: 'DBS-cleaning', path: 'src/components/common/LogoOrbit.astro' },
    entry: 'LogoOrbit.astro',
    files: ['gallery/logo-orbit/LogoOrbit.astro'],
    uses: ['CSS', 'Container queries'],
    ground: '#0a0a0a',
    changes: [
      'Placeholder mark and links instead of the client logo and socials.',
      'Sheen clipped to a circle instead of a logo-shaped mask image.',
    ],
  },
  {
    slug: 'typed-rotator',
    name: 'Typed rotator',
    group: 'Motion',
    blurb: 'Types a phrase, holds, deletes it and types the next, with a blinking caret.',
    origin: { repo: 'portfolio', path: 'src/scripts/motion.ts' },
    entry: 'TypedRotator.astro',
    files: ['gallery/typed-rotator/TypedRotator.astro'],
    uses: ['TypeScript'],
    ground: '#1c1c1c',
    changes: [
      'Wrapped as a component with the phrases as a prop.',
      'Starts when it scrolls into view and stops when it leaves.',
    ],
  },
  {
    slug: 'scroll-reveal',
    name: 'Scroll reveal',
    group: 'Motion',
    blurb: 'Headings rise in word by word and blocks stagger in as they scroll into view. Visible without JavaScript.',
    origin: { repo: 'portfolio', path: 'src/scripts/motion.ts' },
    entry: 'ScrollReveal.astro',
    files: ['gallery/scroll-reveal/ScrollReveal.astro', 'gallery/scroll-reveal/reveal.ts'],
    uses: ['IntersectionObserver', 'CSS'],
    ground: '#1c1c1c',
    changes: [
      'Watches its own scroll box instead of the page, so it works inside a frame.',
      'Replay button resets it.',
    ],
  },
];

export const bySlug = (slug: string) => components.find((c) => c.slug === slug);
