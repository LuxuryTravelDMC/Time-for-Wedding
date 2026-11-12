// Makes the light versions of every photo for the website.
//
// The full-size originals live in photos/ (kept on your computer, not on GitHub).
// For each photo this writes WebP files in a few widths to public/img/
// and records the sizes in src/data/images.json, which the <Img> component reads.
//
// Use: put a new photo in photos/<folder>/<name>.jpg, then run `npm run images`.
// Photos that already have their light versions are skipped.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'photos';
const OUT = 'public/img';
const MANIFEST = 'src/data/images.json';
// Folders whose photos are shown full width (heroes, banners) get one extra, larger size.
const WIDE = ['homepage', 'about', 'wedding', 'blog', 'cache', 'destinations', 'services', 'testimonials', 'ceremonytype'];
const WIDTHS = [480, 960, 1600];
const WIDE_WIDTH = 2000;

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8').catch(() => '{}'));
const files = await walk(SRC);
let done = 0;

async function one(file) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  const name = rel.replace(/\.[^.]+$/, '');
  const folder = name.split('/')[0];
  const img = sharp(file, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  // .rotate() applies the camera orientation, so swap width/height for rotated photos
  const turned = (meta.orientation ?? 1) >= 5;
  const w = turned ? meta.height : meta.width;
  const h = turned ? meta.width : meta.height;
  const alpha = meta.hasAlpha && /\.png$/i.test(file);
  const wanted = [...WIDTHS, ...(WIDE.includes(folder) ? [WIDE_WIDTH] : [])];
  let widths = wanted.filter((x) => x < w);
  // Add the photo's own width as the largest size, unless it is only slightly bigger than the last one
  const top = Math.min(w, wanted[wanted.length - 1]);
  if (!widths.length || widths[widths.length - 1] < top * 0.9) widths.push(top);
  widths = [...new Set(widths)].sort((a, b) => a - b);
  const prev = manifest[name];
  const have = prev && prev.w === w && JSON.stringify(prev.widths) === JSON.stringify(widths);
  if (!have) {
    await fs.mkdir(path.dirname(path.join(OUT, name)), { recursive: true });
    for (const width of widths) {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: alpha ? 80 : 72, effort: 5, smartSubsample: true })
        .toFile(path.join(OUT, `${name}-${width}.webp`));
    }
  }
  manifest[name] = { w, h, widths, ...(alpha ? { alpha: true } : {}) };
  done++;
  if (done % 50 === 0) console.log(`${done}/${files.length}`);
}

const queue = [...files];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) await one(queue.shift());
}));

// Remove light versions that no photo uses any more
for (const f of await walk(OUT)) {
  const rel = path.relative(OUT, f).split(path.sep).join('/');
  const m = rel.match(/^(.*)-(\d+)\.webp$/);
  if (m && !(manifest[m[1]]?.widths ?? []).includes(Number(m[2]))) await fs.unlink(f);
}
for (const name of Object.keys(manifest)) if (!files.some((f) => path.relative(SRC, f).split(path.sep).join('/').replace(/\.[^.]+$/, '') === name)) delete manifest[name];

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(MANIFEST, JSON.stringify(sorted, null, 1) + '\n');
console.log(`Done: ${files.length} photos.`);
