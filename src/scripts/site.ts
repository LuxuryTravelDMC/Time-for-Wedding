// All the small movements and interactions of the site, in one place.
// Each part only runs on pages that have the matching elements.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

// ---------- Menu: white background once you scroll; mobile menu ----------
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
const menu = document.querySelector<HTMLElement>('[data-menu]');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
const closeBtn = document.querySelector<HTMLButtonElement>('[data-menu-close]');
function setMenu(open: boolean) {
  if (!menu || !openBtn) return;
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  openBtn.setAttribute('aria-expanded', String(open));
  if (open) closeBtn?.focus(); else openBtn.focus();
}
openBtn?.addEventListener('click', () => setMenu(true));
closeBtn?.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false); });

// ---------- Soft fade-in of text and photos while scrolling ----------
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.forEach((el) => io.observe(el));
} else revealEls.forEach((el) => el.classList.add('is-visible'));

// ---------- Parallax: the photo moves a little slower than the page ----------
const parallax = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
if (parallax.length && !reduceMotion) {
  let ticking = false;
  const update = () => {
    ticking = false;
    for (const el of parallax) {
      const r = el.parentElement!.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const speed = Number(el.dataset.parallax || 0.12);
      const offset = (r.top + r.height / 2 - innerHeight / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

// ---------- Tabs (wedding types, venues by destination…) ----------
// <div data-tabs> with buttons [data-tab="x"] and panels [data-tab-panel="x"]
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-tab-panel]')];
  const activeClass = root.dataset.activeClass;
  const select = (key: string, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p) => {
      const on = p.dataset.tabPanel === key;
      if (activeClass) p.classList.toggle(activeClass, on); else p.hidden = !on;
    });
    root.dispatchEvent(new CustomEvent('tabchange', { detail: key }));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.tab!));
    t.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      select(tabs[(i + dir + tabs.length) % tabs.length].dataset.tab!, true);
    });
  });
  (root as HTMLElement & { selectTab?: (k: string) => void }).selectTab = select;
});

// ---------- Slides that change by themselves (testimonials, ceremony types) ----------
document.querySelectorAll<HTMLElement>('[data-slider]').forEach((root) => {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-dot]')];
  const linked = [...root.querySelectorAll<HTMLElement>('[data-slide-linked]')];
  if (slides.length < 2) return;
  let i = 0;
  let timer = 0;
  const interval = Number(root.dataset.interval || 0);
  const show = (n: number) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    linked.forEach((el) => el.querySelectorAll<HTMLElement>('[data-index]').forEach((x) => {
      const on = Number(x.dataset.index) === i;
      x.classList.toggle('is-active', on);
      if (x.hasAttribute('aria-selected')) x.setAttribute('aria-selected', String(on));
    }));
  };
  const start = () => { if (interval && !reduceMotion) { stop(); timer = window.setInterval(() => show(i + 1), interval); } };
  const stop = () => window.clearInterval(timer);
  root.querySelector('[data-prev]')?.addEventListener('click', () => { show(i - 1); start(); });
  root.querySelector('[data-next]')?.addEventListener('click', () => { show(i + 1); start(); });
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); start(); }));
  root.querySelectorAll<HTMLElement>('[data-goto]').forEach((b) => b.addEventListener('click', () => { show(Number(b.dataset.goto)); start(); }));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  show(0);
  start();
});

// ---------- Map of Greece: the card opens next to the pin, always inside the map ----------
document.querySelectorAll<HTMLElement>('[data-map]').forEach((map) => {
  const card = map.querySelector<HTMLElement>('[data-map-card]')!;
  const pins = [...map.querySelectorAll<HTMLButtonElement>('[data-pin]')];
  const data = JSON.parse(map.querySelector('[data-map-data]')!.textContent || '{}');
  const img = card.querySelector('img')!;
  const close = () => { card.classList.remove('is-open'); pins.forEach((p) => p.setAttribute('aria-expanded', 'false')); };
  pins.forEach((pin) => pin.addEventListener('click', () => {
    const d = data[pin.dataset.pin!];
    if (!d) return;
    const wasOpen = pin.getAttribute('aria-expanded') === 'true';
    close();
    if (wasOpen) return;
    pin.setAttribute('aria-expanded', 'true');
    img.src = d.image; img.srcset = d.srcset; img.alt = `Wedding in ${d.name}`;
    card.querySelector('h3')!.textContent = d.name;
    card.querySelector('p')!.textContent = d.text;
    card.querySelector<HTMLAnchorElement>('a')!.href = d.href;
    card.querySelector<HTMLAnchorElement>('a')!.setAttribute('aria-label', `Explore weddings in ${d.name}`);
    card.classList.add('is-open');
    if (window.innerWidth > 640) {
      // place the card beside the pin, then pull it back inside the map
      const m = map.getBoundingClientRect();
      const p = pin.getBoundingClientRect();
      const cw = card.offsetWidth; const ch = card.offsetHeight;
      let left = p.left - m.left + p.width / 2 + 18;
      if (left + cw > m.width) left = p.left - m.left + p.width / 2 - cw - 18;
      left = Math.max(0, Math.min(left, m.width - cw));
      let top = p.top - m.top - ch / 2;
      top = Math.max(0, Math.min(top, m.height - ch));
      card.style.left = `${left}px`; card.style.top = `${top}px`;
    } else card.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  card.querySelector('[data-map-close]')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
});

// ---------- Destinations "book": one panel opens at a time ----------
document.querySelectorAll<HTMLElement>('[data-book]').forEach((book) => {
  const panels = [...book.querySelectorAll<HTMLElement>('[data-book-panel]')];
  const open = (p: HTMLElement) => panels.forEach((x) => { const on = x === p; x.classList.toggle('is-active', on); x.setAttribute('aria-expanded', String(on)); });
  panels.forEach((p) => {
    p.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('a')) open(p); });
    p.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === p) { e.preventDefault(); open(p); } });
    if (window.matchMedia('(hover: hover)').matches) p.addEventListener('mouseenter', () => open(p));
  });
});

// ---------- Lightbox for galleries ----------
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
  const items = [...gallery.querySelectorAll<HTMLButtonElement>('[data-full]')];
  const box = document.querySelector<HTMLElement>('[data-lightbox]');
  if (!box || !items.length) return;
  const img = box.querySelector('img')!;
  const count = box.querySelector('[data-count]')!;
  let i = 0; let last: HTMLElement | null = null;
  const show = (n: number) => {
    i = (n + items.length) % items.length;
    img.src = items[i].dataset.full!;
    img.alt = items[i].querySelector('img')?.alt || '';
    count.textContent = `${i + 1} / ${items.length}`;
  };
  const open = (n: number) => { last = document.activeElement as HTMLElement; show(n); box.classList.add('is-open'); document.body.classList.add('menu-open'); box.querySelector<HTMLElement>('[data-close]')!.focus(); };
  const close = () => { box.classList.remove('is-open'); document.body.classList.remove('menu-open'); last?.focus(); };
  items.forEach((b, k) => b.addEventListener('click', () => open(k)));
  box.querySelector('[data-close]')!.addEventListener('click', close);
  box.querySelector('[data-prev]')!.addEventListener('click', () => show(i - 1));
  box.querySelector('[data-next]')!.addEventListener('click', () => show(i + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  let x0 = 0;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
});
