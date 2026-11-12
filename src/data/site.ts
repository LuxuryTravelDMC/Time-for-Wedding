// Contact details, menu and settings used across the whole site.
// Change them here once and every page updates.
export const site = {
  name: 'Wedding by Luxury Travel',
  shortName: 'Time for Wedding',
  url: 'https://www.timeforwedding.com',
  phoneDisplay: '+30 (2310) 52 89 22',
  phoneHref: 'tel:+302310528922',
  email: 'wedding@timeforwedding.com',
  address: 'Danaidon 9, 54626 Thessaloniki, Greece',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Danaidon+9,+54626+Thessaloniki,+Greece',
  // The old site had "#" here. Add the real addresses and the icons appear in the footer.
  social: {
    facebook: '',
    instagram: '',
    pinterest: '',
    youtube: '',
  },
  // Where the "Plan Your Wedding" form sends requests. Not decided yet:
  // while this is empty, the form opens the visitor's email program with
  // everything filled in, addressed to the email above.
  // Later: put the address of a form service or a Cloudflare Worker here.
  formEndpoint: '',
  // true: search engines are asked not to list the site, so only people
  // with the link find it. When the site goes live, set this to false
  // and delete public/_headers.
  hideFromSearch: true,
};

export const nav = [
  { href: '/en/wedding', label: 'Wedding in Greece' },
  { href: '/en/wedding/destinations', label: 'Destinations' },
  { href: '/en/wedding/servicepackages', label: 'Services' },
  { href: '/en/wedding/portfolio', label: 'Portfolio' },
  { href: '/en/blog', label: 'Blog' },
  { href: '/en/about', label: 'About Us' },
  { href: '/en/contact', label: 'Contact' },
];

// The main call to action. "Request Wedding" sounded like a commitment;
// "Plan Your Wedding" invites the first step.
export const cta = { href: '/en/contact#request', label: 'Plan Your Wedding' };
