# Wedding by Luxury Travel website (timeforwedding.com)

Static website built with Astro, rebuilt from the old ASP.NET + Umbraco site (timeforwedding.premiumasp.net) with every fix from the design review. English only. Hosted as a static site on Cloudflare Workers; there is no server or database.

## Working with the owner

- The owner is a designer who knows Figma and is not a developer, and is learning web design. Reply in Greek, in plain language, and explain technical steps briefly.
- Every change appears on the live site after it is merged into `main`, so work on a branch and let the owner review before merging.

## Where things are

- `src/data/site.ts`: phone, email, address, menu, the main call to action ("Plan Your Wedding"), social links (empty until the real ones are known), `formEndpoint`, `hideFromSearch`.
- `src/data/*.json`: all content, extracted from the old site. `couples.json` (portfolio galleries), `venues.json`, `destinations.json`, `services.json`, `ceremonies.json` (Civil / Symbolic / Church / Proposal pages), `dest_ceremony.json` (e.g. Symbolic Wedding in Crete), `blog.json`, `seo.json` (titles and descriptions of the old pages).
- `src/lib/content.ts`: helpers that read and connect the data (ceremony keys keep the old URL words: `official` = civil, `orthodox` = church).
- `src/pages/en/`: one template per page type. Addresses are exactly the old ones, without a trailing slash (`build.format: 'file'`, `trailingSlash: 'never'`).
- `public/_redirects`: old addresses that now lead elsewhere (`/`, `/en/wedding/request`, `/en/wedding/couples`, `/en/wedding/places`).
- The site is hidden from search engines for now: `hideFromSearch: true` adds a `noindex` meta tag, and `public/_headers` adds `X-Robots-Tag: noindex`. To launch, set it to `false` and delete that block of `public/_headers`. Do not use a robots.txt `Disallow` for this.

## Photos

- Originals (max 2400 px, or 2000 px for the couples' photos) live in `photos/`, which is git-ignored because it is large. `npm run images` (scripts/optimize-images.mjs) writes WebP versions in 480/960/1600 px (+2000 px for full-width folders) to `public/img/` and their sizes to `src/data/images.json`.
- Always show photos with `src/components/Img.astro` (`name` = path in photos/ without extension) and give a real `sizes`.
- `scripts/image-sources.json` maps every photo name to its address on the old site.

## Design rules from the review (keep them)

- One radius for all buttons and form fields: `--radius-btn: 3px`.
- Body text 17px (16px on phones); never below 14px. Menu items weight 400 with generous spacing.
- H1 with the page keyword above the fold on every page.
- Text never sits on faces: on phones text goes on a solid card below the photo.
- Sliders and tabs with changing text keep a fixed height (stack all texts in one grid cell).
- No accordions for normal content; FAQ lists are fine.
- Don't repeat a section with the same design on several pages; each page should add information.
- Footer dark (`--ink`) with white text. Icons in brand colours, never orange.
- The euro sign goes before the amount (€1,500).
- Check new layouts at 1440 px and 390 px wide; nothing may scroll sideways on a phone.

## Commands

- `npm install`, then `npm run dev` for a local preview at http://localhost:4321/en
- `npm run build` writes the finished site to `dist/`

## Hosting

Cloudflare Workers with static assets, configured in `wrangler.jsonc` (no Worker code, no adapter, `html_handling: drop-trailing-slash`). Cloudflare builds with `npm run build` and deploys with `npx wrangler deploy` on every push to `main`; other branches get preview URLs through `npx wrangler preview` (needs the `previews` block). The `name` in `wrangler.jsonc` (`time-for-wedding`) should match the Worker name in the Cloudflare dashboard.

## Content from the old CMS that still needs the owner

- The four "Planning" answers on every ceremony page are the same placeholder text (about symbolic ceremonies).
- Some destination texts on the ceremony pages talk about another topic (e.g. Civil Wedding in Mykonos talks about yachts, Civil Wedding in Corfu about church weddings).
- Blog articles are one paragraph each; two are about Heckfield Place (a UK venue) and two have the same text ("How to Write a Wedding" / "Writing Your Wedding").
- Some couples have placeholder names ("15.9.2018", "27.09.2017 -flile 2019", "Last wedding 2016"); "Anna and Denis" has only a logo as photo.
- Skopelos uses the Zakynthos map and photo; Cyprus has no text, venues or map.
- Testimonials (Emma & James, Sophie & Michael, Anna & David) look like sample texts.
