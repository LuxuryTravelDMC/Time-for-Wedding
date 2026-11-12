// Helpers that read the content files in src/data/ and connect them.
import couplesRaw from '../data/couples.json';
import venuesRaw from '../data/venues.json';
import destinationsRaw from '../data/destinations.json';
import servicesRaw from '../data/services.json';
import ceremoniesRaw from '../data/ceremonies.json';
import destCeremonyRaw from '../data/dest_ceremony.json';
import blogRaw from '../data/blog.json';
import seoRaw from '../data/seo.json';

export const DESTINATIONS = ['mykonos', 'santorini', 'crete', 'corfu', 'rhodes', 'athens', 'skopelos', 'halkidiki', 'cyprus'] as const;
export const DEST_NAMES: Record<string, string> = {
  mykonos: 'Mykonos', santorini: 'Santorini', crete: 'Crete', corfu: 'Corfu', rhodes: 'Rhodes',
  athens: 'Athens', skopelos: 'Skopelos', halkidiki: 'Halkidiki', cyprus: 'Cyprus',
};
// Ceremony keys keep the old addresses (/ceremonytype/official …)
export const CEREMONIES = ['official', 'symbolic', 'orthodox', 'proposal'] as const;
export const CEREMONY_NAMES: Record<string, string> = { official: 'Civil Wedding', symbolic: 'Symbolic Wedding', orthodox: 'Church Wedding', proposal: 'Wedding Proposal' };
export const CEREMONY_SHORT: Record<string, string> = { official: 'Civil', symbolic: 'Symbolic', orthodox: 'Church', proposal: 'Proposal' };

const destSlugByName: Record<string, string> = { chalkidiki: 'halkidiki', rodos: 'rhodes' };
export function destSlug(name: string) {
  const n = (name || '').toLowerCase().trim();
  return destSlugByName[n] ?? n;
}
export function ceremonyKeyFromType(type: string) {
  const t = (type || '').toLowerCase();
  if (t.startsWith('civil')) return 'official';
  if (t.startsWith('church')) return 'orthodox';
  if (t.startsWith('symbolic')) return 'symbolic';
  return 'proposal';
}

export type Couple = (typeof couplesRaw)[number] & { destSlug: string; ceremony: string; sortKey: number };
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
export const couples: Couple[] = couplesRaw
  .map((c) => {
    let sortKey = 0;
    if (c.date) {
      const [d, m, y] = c.date.split('/').map(Number);
      sortKey = y * 10000 + m * 100 + d;
    } else if (c.when) {
      const [mon, y] = c.when.split(' ');
      sortKey = Number(y) * 10000 + (MONTHS.indexOf(mon.toLowerCase()) + 1) * 100;
    }
    return { ...c, destSlug: destSlug(c.destination), ceremony: ceremonyKeyFromType(c.type), sortKey };
  })
  .filter((c) => c.photos.length > 0)
  .sort((a, b) => b.sortKey - a.sortKey);
export const coupleBySlug = (slug: string) => couples.find((c) => c.slug === slug);

export const venues = [...venuesRaw].sort((a, b) => a.order - b.order);
export const venuesFor = (dest: string) => venues.filter((v) => v.destination === dest);
export const destinations = destinationsRaw;
export const destinationBySlug = (slug: string) => destinations.find((d) => d.slug === slug)!;
export const services = servicesRaw;
export const ceremonies = ceremoniesRaw;
export const destCeremony = destCeremonyRaw;
export const blog = blogRaw;
export const seo = seoRaw as Record<string, { title: string; description: string }>;

export function venueTypes(v: (typeof venuesRaw)[number]): string[] {
  const t = (v.essentials as Record<string, unknown>)['Ceremony types'];
  return Array.isArray(t) ? (t as string[]) : [];
}
export function plain(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
