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
  { group: 'Sections', slug: 'sections', heading: 'Page sections', line: 'Reviews that slide past, answers that open in place and project sections on colour.', feature: 'reviews-marquee' },
  { group: 'Surfaces', slug: 'surfaces', heading: 'Surfaces', line: 'Materials for panels and cards, starting with the glass.', feature: 'glass-card' },
];

export interface GalleryComponent {
  slug: string;
  name: string;
  group: Group;
  blurb: string;
  entry: string;
  files: string[];
  /** Ground colour of the site it came from, so the demo sits on its real background. */
  ground: string;
  /** Give the demo a taller frame on its detail page (for demos you scroll inside). */
  tall?: boolean;
}

export const components: GalleryComponent[] = [
  {
    slug: 'starfield',
    name: 'Starfield',
    group: 'Backgrounds',
    blurb: 'Twinkling stars with a heartbeat pulse. The cursor parts them and links the nearest into constellations.',
    entry: 'Starfield.astro',
    files: ['gallery/starfield/Starfield.astro'],
    ground: '#1c1c1c',
  },
  {
    slug: 'globe',
    name: 'Wireframe globe',
    group: 'Backgrounds',
    blurb: 'A network sphere of evenly spread points joined to their nearest neighbours. Turns slowly and tilts toward the cursor.',
    entry: 'Globe.astro',
    files: ['gallery/globe/Globe.astro', 'gallery/globe/globe.ts', 'lib/stage.ts'],
    ground: '#1c1c1c',
  },
  {
    slug: 'particles',
    name: 'Particle network',
    group: 'Backgrounds',
    blurb: 'Drifting gold dots joined by thin lines, with lines reaching to the cursor.',
    entry: 'Particles.astro',
    files: ['gallery/particles/Particles.astro'],
    ground: '#0a0a0a',
  },
  {
    slug: 'liquid-orb',
    name: 'Liquid orb',
    group: 'Motion',
    blurb: 'An iridescent glass blob whose surface ripples. A wireframe twin fades in while the cursor is over it.',
    entry: 'Orb.astro',
    files: ['gallery/liquid-orb/Orb.astro', 'gallery/liquid-orb/orb.ts', 'lib/stage.ts'],
    ground: '#1c1c1c',
  },
  {
    slug: 'preloader',
    name: 'Goo preloader',
    group: 'Motion',
    blurb: 'A name and three orbiting dots melted together by an SVG goo filter, then a curtain wipes up.',
    entry: 'Preloader.astro',
    files: ['gallery/preloader/Preloader.astro'],
    ground: '#1c1c1c',
  },
  {
    slug: 'logo-orbit',
    name: 'Logo orbit',
    group: 'Motion',
    blurb: 'Links circling a logo, each spinning on its own axis. Pauses on hover and focus so they are easy to hit, and the link under the pointer buzzes.',
    entry: 'LogoOrbit.astro',
    files: ['gallery/logo-orbit/LogoOrbit.astro'],
    ground: '#0a0a0a',
  },
  {
    slug: 'typed-rotator',
    name: 'Typed rotator',
    group: 'Motion',
    blurb: 'Types a phrase, holds, deletes it and types the next, with a blinking caret.',
    entry: 'TypedRotator.astro',
    files: ['gallery/typed-rotator/TypedRotator.astro'],
    ground: '#1c1c1c',
  },
  {
    slug: 'scroll-reveal',
    name: 'Scroll reveal',
    group: 'Motion',
    blurb: 'Headings rise in word by word and blocks stagger in as they scroll into view. Scroll inside the box to see each one. Visible without JavaScript.',
    entry: 'ScrollReveal.astro',
    files: ['gallery/scroll-reveal/ScrollReveal.astro', 'gallery/scroll-reveal/reveal.ts'],
    ground: '#1c1c1c',
    tall: true,
  },
  {
    slug: 'iso-stack',
    name: 'Isometric stack',
    group: 'Motion',
    blurb: 'Three screenshots fanned out as a tilted, exploded stack that settles flat as it scrolls into view. Scroll inside the box to drive it.',
    entry: 'IsoStack.astro',
    files: ['gallery/iso-stack/IsoStack.astro', 'gallery/iso-stack/Frame.astro', 'lib/preview.ts'],
    ground: '#1c1c1c',
    tall: true,
  },
  {
    slug: 'drawer-nav',
    name: 'Drawer navbar',
    group: 'Navigation',
    blurb: 'A monogram and a burger that folds into a cross. The menu slides in from the side on glass, and its links follow one by one.',
    entry: 'DrawerNav.astro',
    files: ['gallery/drawer-nav/DrawerNav.astro', 'lib/preview.ts'],
    ground: '#1c1c1c',
  },
  {
    slug: 'link-pyramid',
    name: 'Link pyramid',
    group: 'Navigation',
    blurb: 'A triangle rises from the foot of the page with links in rows and a back-to-top button at its heart. A floating button with a progress ring covers the rest of the scroll.',
    entry: 'LinkPyramid.astro',
    files: ['gallery/link-pyramid/LinkPyramid.astro', 'lib/preview.ts'],
    ground: '#1c1c1c',
    tall: true,
  },
  {
    slug: 'reviews-marquee',
    name: 'Reviews marquee',
    group: 'Sections',
    blurb: 'Review cards on glass slide past in a strip with no end. A moving mouse pauses it so a card can be read.',
    entry: 'ReviewsMarquee.astro',
    files: ['gallery/reviews-marquee/ReviewsMarquee.astro'],
    ground: '#0a0a0a',
  },
  {
    slug: 'faq-accordion',
    name: 'FAQ accordion',
    group: 'Sections',
    blurb: 'Questions that open in place to show their answer, one at a time. Works without JavaScript.',
    entry: 'FaqAccordion.astro',
    files: ['gallery/faq-accordion/FaqAccordion.astro'],
    ground: '#0a0a0a',
  },
  {
    slug: 'slab-section',
    name: 'Colour slab sections',
    group: 'Sections',
    blurb: 'Full-height project sections where a block of the product\'s own colour wipes in behind each one as it arrives, alternating sides. Scroll inside the box to see both.',
    entry: 'SlabSection.astro',
    files: ['gallery/slab-section/SlabSection.astro', 'gallery/iso-stack/Frame.astro', 'lib/preview.ts'],
    ground: '#1c1c1c',
    tall: true,
  },
  {
    slug: 'glass-card',
    name: 'Glass card',
    group: 'Surfaces',
    blurb: 'A frosted panel: a dark tint, an 18px blur with a little extra saturation, and a faint inner edge.',
    entry: 'GlassCard.astro',
    files: ['gallery/glass-card/GlassCard.astro'],
    ground: '#1c1c1c',
  },
];

export const bySlug = (slug: string) => components.find((c) => c.slug === slug);
export const groupOf = (c: GalleryComponent) => groups.find((g) => g.group === c.group)!;
export const inGroup = (g: GroupInfo) => components.filter((c) => c.group === g.group);
