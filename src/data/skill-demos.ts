// The skill demos: one made-up landing page (Tallbook, brief in skill-demos/brief.md)
// built once per design skill, each by a fresh agent allowed only that skill.
// Each page lives as static files in public/skill-demos/<id>/.
// Thumbnails (first screen, desktop and phone) are in public/skill-demos/thumbs/.
import usage from './skill-demos/usage.json';

export interface SkillDemo {
  id: string;
  name: string;
  /** The one skill the builder was allowed. null for the baseline. */
  skill: string | null;
  /** One line on what the skill is for. */
  line: string;
  /** What the skill led the builder to decide, from its report. */
  notes: string[];
}

export const skillDemos: SkillDemo[] = [
  {
    id: 'baseline',
    name: 'No skill',
    skill: null,
    line: 'What Claude builds by default, with no design skill loaded. The control.',
    notes: [
      'Fraunces serif for headings, prices and card fronts; Inter for running text.',
      'Warm off-white paper with tan bands on alternate sections, one blue accent and deep navy for card backs and the closing band.',
      'Split hero: words on the left, an app window with a tilted “due tomorrow” card on the right.',
      'Step cards, a 2×2 feature grid, two pricing plans side by side and an FAQ that opens in place.',
      'The demo highlights the note’s lines and the cards flip over on tap; reduced motion swaps faces instead of turning.',
      'Left rough, by its own account: the pricing pair leaves space on the right and the headline runs to three lines on desktop.',
    ],
  },
  {
    id: 'design-taste',
    name: 'Design taste',
    skill: 'design-taste-frontend',
    line: 'Deals a researched art direction from a library of gallery sites, then holds a strict no-ornament house style.',
    notes: [
      'Dealt three directions and picked “The page is the object” (seed 719735876), because a revision card already exists in a student’s world.',
      'The idea: the Week 6 recursion note becomes the stationery the page is printed on. The hero is a striped card, How it works a slip with a torn edge, Features a printed menu, Pricing two perforated tickets.',
      'The live thing: the sample note is editable. Type a heading and a definition and a new revision card appears. The closing “Start a notebook” opens a first page named after the module you type.',
      'The hero’s app picture crossfades between the note, a card front and the card back with its link to C++.',
      'Found real pictures in open collections and credited them in the footer: Ebbinghaus’s 1885 forgetting-curve figure and two library card catalogues from Wikimedia Commons.',
      'Swapped the dealt closing section for another, since it wanted a form field and the only action is a link.',
      'Ended with zero inspector failures and one warning (no video, since the only clips it found read as stock). It scored itself 7.7 on the skill’s critique.',
      'Left rough, by its own account: the two pricing tickets have empty middles and the hero card leaves a gap above the section links.',
    ],
  },
  {
    id: 'impeccable',
    name: 'Impeccable',
    skill: 'impeccable',
    line: 'Works like a design director: picks a mode and a point of view, then holds a craft floor.',
    notes: [
      'Rolled one of seven concepts it wrote: a university library issue desk. Each idea is issued from your notes and stamped to come back before you’d forget it.',
      'Library-binding green owns whole sections, alternating with pale slip paper. Purple stamp ink marks only what Tallbook did; spine-label yellow marks only “Start a notebook”.',
      'Archivo, condensed and heavy like spine labels, for display; Atkinson Hyperlegible Next for reading.',
      'Signature move: a full-width date-due slip in the hero, where purple stamps land one by one at widening gaps, the “comes back before you’d forget” idea.',
      'Ruled-line lists instead of boxes, an origin ticket on each card, and cards that flip and light up the note lines they came from.',
      'With no one to interview, it treated the brief as its product context and reviewed itself instead of using a fresh reviewer.',
      'Left rough, by its own account: How it works sits close to a standard three columns, the stamps are flat with no ink texture, and the headline runs to three lines on phones.',
    ],
  },
  {
    id: 'apple-design',
    name: 'Apple design',
    skill: 'apple-design',
    line: 'Apple’s approach for the web: physical motion and springs, materials and depth, careful type.',
    notes: [
      'The system font, with letter-spacing that changes with size: tight on the hero, neutral on body text, slightly open on small print.',
      'A warm neutral page with one blue accent and a full dark mode.',
      'A translucent header that blurs the page behind it, with a soft fade below instead of a line. Shadows grow with the size of the surface: chip, card, window.',
      'A small hand-written spring engine using the skill’s damping and response settings. Most motion settles without overshoot; bounce only follows a flick, and anything can be caught mid-move.',
      'Cards can be dragged one-to-one and flicked away, with momentum deciding where they land. On first view they fly out of the note lines they came from.',
      'The phone menu is a blurred sheet you can drag down to close. Every gesture also has a button or key.',
      'Reduced motion swaps movement for cross-fades, and there are separate styles for reduced transparency and high contrast.',
    ],
  },
  {
    id: 'emil-design-eng',
    name: 'Emil design eng',
    skill: 'emil-design-eng',
    line: 'Emil Kowalski’s polish: component feel, easing and timing, the details you only notice when missing.',
    notes: [
      'A quiet, tool-like look: Geist with tight tracking, a warm off-white page, white cards edged with a hairline shadow, one blue accent. Follows the system’s dark mode.',
      'Only custom curves, never ease-in: a strong ease-out for entering and leaving, an in-out curve for the card flip, a drawer curve for the hero stack.',
      'Buttons shrink to 0.97 on press in 160ms. The menu opens from its button in 180ms and closes in 120ms; exits are always quicker than entries.',
      'The hero is a stack of revision cards with Show answer and Next. The old card leaves with a slight blur so two never show at once, and fast clicking stays smooth.',
      'In the demo a highlighter wipes across each note line, then its card arrives; hovering a card lights up the lines it came from.',
      'Buttons that go nowhere open a toast with the “made-up product” line. It pauses on hover and when the tab is hidden, and a flick dismisses it.',
      'Left rough, by its own account: the hero card is half empty until you show the answer, and the FAQ snaps open while only the answer fades in.',
    ],
  },
];

// Token use and API-equivalent cost of each build, written by tools/agent-usage.py
// from the builder agents' transcripts. Prices are the model's API list prices.

export interface Usage {
  model: string;
  requests: number;
  toolCalls: number;
  minutes: number | null;
  tokens: { input: number; cache_write_5m: number; cache_write_1h: number; cache_read: number; output: number };
  totalTokens: number;
  costUsd: number;
}

export const prices = usage.prices as Record<string, Record<keyof Usage['tokens'], number>>;
export const usageOf = (d: SkillDemo) => (usage.runs as Record<string, Usage>)[d.id];

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('en-GB');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const fmt = {
  compact: (n: number) => compact.format(n),
  whole: (n: number) => whole.format(n),
  usd: (n: number) => usd.format(n),
};

// index.html spelled out: the dev server does not map a public folder to its index.
export const pageOf = (d: SkillDemo) => `/skill-demos/${d.id}/index.html`;
export const thumbOf = (d: SkillDemo, view: 'desktop' | 'mobile') => `/skill-demos/thumbs/${d.id}-${view}.jpg`;
