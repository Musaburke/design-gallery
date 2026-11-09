// The gallery's one list. Each entry points at a folder in src/gallery/<slug>/.
// `entry` is the component the pages render; `files` are shown as code, in order.
// Paths in `files` are relative to src/ so shared helpers (lib/stage.ts) can be listed too.

export type Group = 'Backgrounds' | 'Motion' | 'Navigation' | 'Sections' | 'Surfaces';

export interface GroupInfo {
  group: Group;
  /** Page at /g/<slug>/. */
  slug: string;
  heading: string;
  line: string;
  /** The component that stands for the group on the landing page. */
  feature: string;
}

// In page order. The landing page, the group pages and the header all read this.
export const groups: GroupInfo[] = [
  { group: 'Backgrounds', slug: 'backgrounds', heading: 'Backgrounds', line: 'Living fields that sit behind everything else on a page.', feature: 'starfield' },
  { group: 'Motion', slug: 'motion', heading: 'Motion and effects', line: 'Effects that play once, run on a loop or follow the cursor.', feature: 'liquid-orb' },
  { group: 'Navigation', slug: 'navigation', heading: 'Navigation', line: 'Ways around a site, from the first menu to the last link.', feature: 'drawer-nav' },
  { group: 'Sections', slug: 'sections', heading: 'Page sections', line: 'Reviews that slide past and answers that open in place.', feature: 'reviews-marquee' },
  { group: 'Surfaces', slug: 'surfaces', heading: 'Surfaces', line: 'Materials for panels and cards, starting with the glass.', feature: 'glass-card' },
];

export interface GalleryComponent {
  slug: string;
  name: string;
  group: Group;
  blurb: string;
  /** Where the original lives, as repo + path under ~/Projects. Kept in the data, hidden on the pages for now. */
  origin: { repo: string; path: string };
  entry: string;
  files: string[];
  uses: string[];
  /** Ground colour of the site it came from, so the demo sits on its real background. */
  ground: string;
  /** What was changed to make it work inside a frame instead of a full page. */
  changes: string[];
  /** Give the demo a taller frame on its detail page (for demos you scroll inside). */
  tall?: boolean;
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
      'Dropped scroll drift, warp streaks and the contact-section boost, which only made sense on the original page.',
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
    blurb: 'Links circling a logo, each spinning on its own axis. Pauses on hover and focus so they are easy to hit, and the link under the pointer buzzes.',
    origin: { repo: 'DBS-cleaning', path: 'src/components/common/LogoOrbit.astro' },
    entry: 'LogoOrbit.astro',
    files: ['gallery/logo-orbit/LogoOrbit.astro'],
    uses: ['CSS', 'Container queries'],
    ground: '#0a0a0a',
    changes: [
      'Placeholder mark and links instead of the client logo and socials.',
      'Links spin on their own axis instead of staying upright, with a short buzz on hover and focus.',
      'Dropped the sheen across the logo.',
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
    blurb: 'Headings rise in word by word and blocks stagger in as they scroll into view. Scroll inside the box to see each one. Visible without JavaScript.',
    origin: { repo: 'portfolio', path: 'src/scripts/motion.ts' },
    entry: 'ScrollReveal.astro',
    files: ['gallery/scroll-reveal/ScrollReveal.astro', 'gallery/scroll-reveal/reveal.ts'],
    uses: ['IntersectionObserver', 'CSS'],
    ground: '#1c1c1c',
    changes: [
      'Watches its own scroll box instead of the page, so it works inside a frame.',
      'Each effect gets its own box-tall part with a heading naming it, and a scroll hint shows until you scroll.',
      'In the grid it scrolls itself on a loop; it stops while the pointer or focus is inside.',
      'Replay button resets it.',
    ],
    tall: true,
  },
  {
    slug: 'drawer-nav',
    name: 'Drawer navbar',
    group: 'Navigation',
    blurb: 'A monogram and a burger that folds into a cross. The menu slides in from the side on glass, and its links follow one by one.',
    origin: { repo: 'portfolio', path: 'src/components/Header.astro' },
    entry: 'DrawerNav.astro',
    files: ['gallery/drawer-nav/DrawerNav.astro', 'lib/preview.ts'],
    uses: ['CSS', 'backdrop-filter', 'TypeScript'],
    ground: '#1c1c1c',
    changes: [
      'The header, scrim and drawer sit inside the frame instead of being fixed to the window, over a sample page that scrolls.',
      'The open state is a class on the demo, not on the page, so several can run at once and the page never locks.',
      'Escape, the scrim and the focus trap work for each instance on its own.',
      'Placeholder monogram and links.',
      'In the grid it opens and closes itself on a loop; it stops while the pointer or focus is inside.',
    ],
  },
  {
    slug: 'link-pyramid',
    name: 'Link pyramid',
    group: 'Navigation',
    blurb: 'A triangle rises from the foot of the page with links in rows and a back-to-top button at its heart. A floating button with a progress ring covers the rest of the scroll.',
    origin: { repo: 'portfolio', path: 'src/components/Pyramid.astro' },
    entry: 'LinkPyramid.astro',
    files: ['gallery/link-pyramid/LinkPyramid.astro', 'lib/preview.ts'],
    uses: ['CSS clip-path', 'IntersectionObserver', 'SVG'],
    ground: '#1c1c1c',
    changes: [
      'Sits at the end of its own scroll box, so back-to-top scrolls the box, not the page.',
      'The floating back-to-top button is folded in and follows the box. It hides while the pyramid is in view, as it did on the original.',
      'The triangle rises again each time it comes back into view, instead of once.',
      'Placeholder links, with the icons drawn inline.',
      'In the grid it scrolls down to the pyramid and back on a loop; it stops while the pointer or focus is inside.',
    ],
    tall: true,
  },
  {
    slug: 'reviews-marquee',
    name: 'Reviews marquee',
    group: 'Sections',
    blurb: 'Review cards on glass slide past in a strip with no end. A moving mouse pauses it so a card can be read.',
    origin: { repo: 'DBS-cleaning', path: 'src/components/sections/ReviewsHome.astro' },
    entry: 'ReviewsMarquee.astro',
    files: ['gallery/reviews-marquee/ReviewsMarquee.astro'],
    uses: ['CSS', 'Container queries', 'backdrop-filter'],
    ground: '#0a0a0a',
    changes: [
      'Sample reviews with made-up first names instead of real customers.',
      'Scoped CSS and inline SVG instead of Tailwind classes and an icon library.',
      'Card widths follow the frame instead of the window.',
      'Set in the gallery font instead of Barlow.',
    ],
  },
  {
    slug: 'faq-accordion',
    name: 'FAQ accordion',
    group: 'Sections',
    blurb: 'Questions that open in place to show their answer, one at a time. Works without JavaScript.',
    origin: { repo: 'DBS-cleaning', path: 'src/components/sections/FAQList.tsx' },
    entry: 'FaqAccordion.astro',
    files: ['gallery/faq-accordion/FaqAccordion.astro'],
    uses: ['details', '::details-content', 'CSS'],
    ground: '#0a0a0a',
    changes: [
      'Rebuilt with details and summary instead of a React accordion, so it needs no framework and opens without JavaScript.',
      'One open at a time through the name attribute, as the original allowed.',
      'The slide uses ::details-content where the browser supports it and snaps open where it does not.',
      'Questions about the component itself instead of the client\'s.',
      'Set in the gallery font instead of Barlow.',
    ],
  },
  {
    slug: 'glass-card',
    name: 'Glass card',
    group: 'Surfaces',
    blurb: 'A frosted panel: a dark tint, an 18px blur with a little extra saturation, and a faint inner edge.',
    origin: { repo: 'portfolio', path: 'src/components/Contact.astro' },
    entry: 'GlassCard.astro',
    files: ['gallery/glass-card/GlassCard.astro'],
    uses: ['backdrop-filter', 'CSS'],
    ground: '#1c1c1c',
    changes: [
      'The glass tokens and class come with the card, so it stands on its own.',
      'Slow drifting shapes behind it give the blur something to bend; the original sits over the starfield.',
      'Placeholder heading, line and actions.',
      'Falls back to a solid tint where backdrop-filter is not supported.',
    ],
  },
];

export const bySlug = (slug: string) => components.find((c) => c.slug === slug);
export const groupOf = (c: GalleryComponent) => groups.find((g) => g.group === c.group)!;
export const inGroup = (g: GroupInfo) => components.filter((c) => c.group === g.group);
