// Looks up each component's live demo and the raw text of its files.
// The code panels read the same files the demos run, so they can't drift apart.
import type { GalleryComponent } from '../data/components';

type Demo = (props: Record<string, unknown>) => unknown;

const demos = import.meta.glob<{ default: Demo }>('/src/gallery/*/*.astro', { eager: true });
const sources = import.meta.glob<string>(['/src/gallery/**/*.{astro,ts,css}', '/src/lib/stage.ts', '/src/lib/preview.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const demoFor = (c: GalleryComponent) => {
  const mod = demos[`/src/gallery/${c.slug}/${c.entry}`];
  if (!mod) throw new Error(`No demo for ${c.slug}: expected src/gallery/${c.slug}/${c.entry}`);
  return mod.default;
};

export const sourceOf = (file: string) => {
  const text = sources[`/src/${file}`];
  if (text === undefined) throw new Error(`Missing source file: src/${file}`);
  return text;
};

const langs: Record<string, string> = { astro: 'astro', ts: 'ts', css: 'css' };
export const langOf = (file: string) => langs[file.split('.').pop() ?? ''] ?? 'txt';
export const labelOf = (lang: string) => ({ astro: 'Astro', ts: 'TypeScript', css: 'CSS' })[lang] ?? lang;
