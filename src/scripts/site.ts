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
  // preventScroll: the buttons sit in the sticky menu bar; without it the browser
  // scrolled the page up to "show" them each time the menu opened or closed
  if (open) closeBtn?.focus({ preventScroll: true }); else openBtn.focus({ preventScroll: true });
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
  const anim = root.hasAttribute('data-tabs-anim') && !reduceMotion;
  // A brown pill that glides to the chosen tab (instead of switching colour in place)
  const pills = root.querySelector<HTMLElement>('.pills');
  let marker: HTMLElement | null = null;
  const moveMarker = (instant = false) => {
    if (!marker || !pills) return;
    const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    if (!t || !t.offsetWidth) return;
    if (instant) marker.style.transition = 'none';
    marker.style.width = `${t.offsetWidth}px`; marker.style.height = `${t.offsetHeight}px`;
    marker.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop}px)`;
    if (instant) { void marker.offsetWidth; marker.style.transition = ''; }
  };
  if (anim && pills) {
    marker = document.createElement('span');
    marker.className = 'pills__marker'; marker.setAttribute('aria-hidden', 'true');
    pills.prepend(marker); pills.classList.add('pills--glide');
    new ResizeObserver(() => moveMarker(true)).observe(pills);
  }
  // The new destination's cards are dealt from the middle: the centre card grows into
  // place, the cards beside it slide out from behind it a moment later
  const dealIn = (panel: HTMLElement) => {
    panel.querySelectorAll('[data-carousel]').forEach((c) => c.dispatchEvent(new Event('carousel:refresh')));
    {
      const cards = [...panel.querySelectorAll<HTMLElement>('.carousel__track > *, .venues > *')];
      const mid = cards.findIndex((c) => c.dataset.side === 'center');
      cards.forEach((card, i) => {
        const side = card.dataset.side;
        // only the centre card and its two neighbours take part; the cards further out stay
        // hidden until the deal is over, so nothing peeks in at the edges
        if (side && Math.abs(i - mid) > 1) {
          card.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1170 });
          return;
        }
        const ease = 'cubic-bezier(.22,.61,.36,1)';
        if (side === 'center' || !side) {
          card.animate([{ opacity: 0, scale: side ? '0.8' : '0.92' }, { opacity: 1, scale: '1' }], { duration: 950, easing: ease });
        } else {
          // slide out from behind the centre card to the card's own resting place (its
          // translate/opacity are set by the carousel), so it never overshoots and snaps back
          const restX = parseFloat(card.style.translate) || 0;
          const restO = card.style.opacity || '0.72';
          const dx = side === 'left' ? 110 : -110;
          card.animate([{ opacity: 0, translate: `${restX + dx}px 0` }, { opacity: restO, translate: `${restX}px 0` }], { duration: 950, delay: 220, easing: ease, fill: 'backwards' });
        }
      });
    }
  };
  let busy = 0;
  const select = (key: string, focus = false) => {
    if (anim) {
      const old = panels.find((p) => !p.hidden);
      const next = panels.find((p) => p.dataset.tabPanel === key);
      if (old && next && old !== next) {
        tabs.forEach((t) => { const on = t.dataset.tab === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
        moveMarker();
        clearTimeout(busy);
        // the old cards sink back (shrink and fade) before the new ones come forward
        old.querySelectorAll<HTMLElement>('.carousel__track > *, .venues > *').forEach((card) =>
          card.animate([{ scale: getComputedStyle(card).scale === 'none' ? '1' : getComputedStyle(card).scale, opacity: getComputedStyle(card).opacity }, { scale: '0.7', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' }));
        old.animate([{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 400 });
        busy = window.setTimeout(() => {
          panels.forEach((p) => { p.hidden = p !== next; });
          old.querySelectorAll<HTMLElement>('.carousel__track > *, .venues > *').forEach((card) => card.getAnimations().forEach((a) => a.cancel()));
          dealIn(next);
          root.dispatchEvent(new CustomEvent('tabchange', { detail: key }));
        }, 390);
        return;
      }
    }
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

// ---------- Venue carousel: arrows move one card, the counter shows what is in view ----------
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((c) => {
  const track = c.querySelector<HTMLElement>('[data-carousel-track]')!;
  const prev = c.querySelector<HTMLButtonElement>('[data-carousel-prev]')!;
  const next = c.querySelector<HTMLButtonElement>('[data-carousel-next]')!;
  const count = c.querySelector<HTMLElement>('[data-carousel-count]');
  const total = track.children.length;
  const centred = c.hasAttribute('data-center');
  // Centred carousels loop: a copy of the cards sits before and after the real ones, and when
  // a copy reaches the middle the row jumps (invisibly) to the same card in the real set
  if (centred) {
    const originals = [...track.children] as HTMLElement[];
    const copy = (el: HTMLElement) => { const k = el.cloneNode(true) as HTMLElement; k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; k.dataset.copy = ''; return k; };
    track.prepend(...originals.map(copy));
    track.append(...originals.map(copy));
  }
  const cards = [...track.children] as HTMLElement[];
  const step = () => {
    const card = track.firstElementChild as HTMLElement | null;
    return card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0) : track.clientWidth;
  };
  // Centred mode: the card nearest the middle is the big one; cards left and right of it
  // shrink towards it. A click on a side card brings it to the middle instead of opening it.
  let current = 0;
  // Our own glide (ease-in-out) instead of the browser's smooth scroll, so the start and the
  // stop are soft and the cards' size follows the movement frame by frame
  let glide = 0;
  const centreOn = (i: number, smooth = true) => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
    if (!card) return;
    const to = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;
    cancelAnimationFrame(glide);
    if (!smooth || reduceMotion) { track.scrollLeft = to; return; }
    const from = track.scrollLeft, dist = to - from, start = performance.now();
    const dur = Math.min(900, 520 + Math.abs(dist) * 0.25);
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      track.scrollLeft = from + dist * ease(t);
      if (t < 1) glide = requestAnimationFrame(tick);
    };
    glide = requestAnimationFrame(tick);
  };
  const updateCentre = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((card, i) => { const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
    current = best;
    // size and fade follow the distance from the middle continuously (1 in the middle, 0.77 one card away)
    const stepW = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    cards.forEach((card, i) => {
      card.classList.toggle('is-center', i === best);
      card.dataset.side = i < best ? 'left' : i > best ? 'right' : 'center';
      const off = card.offsetLeft + card.offsetWidth / 2 - mid;
      const d = Math.min(1, Math.abs(off) / stepW);
      const sc = 1 - 0.23 * d;
      card.style.scale = String(sc);
      card.style.opacity = String(1 - 0.28 * d);
      // a smaller card moves towards the middle so the gaps stay even (no jump when the centre changes)
      card.style.translate = `${(-Math.sign(off) * card.offsetWidth * (1 - sc)) / 2}px 0`;
    });
    if (count) count.textContent = `${(best % total) + 1} / ${total}`;
  };
  // when a copy is in the middle, move to the same card in the real (middle) set without any motion
  const loopJump = () => {
    if (current >= total && current < 2 * total) return;
    const target = total + (current % total);
    track.classList.add('is-jumping');
    track.scrollTo({ left: track.scrollLeft + cards[target].offsetLeft - cards[current].offsetLeft, behavior: 'instant' });
    updateCentre();
    requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-jumping')));
  };
  if (centred) {
    cards.forEach((card, i) => card.addEventListener('click', (e) => {
      if (i !== current) { e.preventDefault(); centreOn(i); }
    }));
    // after a swipe or a wheel scroll, glide the nearest card to the middle
    let settle = 0;
    const settleSoon = () => {
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        const card = cards[current];
        const off = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2 - track.scrollLeft;
        if (Math.abs(off) > 2) centreOn(current); else loopJump();
      }, 140);
    };
    track.addEventListener('scroll', settleSoon, { passive: true });
  }
  const update = () => {
    if (!track.clientWidth) return; // hidden tab
    if (centred) { updateCentre(); return; }
    const max = track.scrollWidth - track.clientWidth;
    c.toggleAttribute('data-static', max < 4);
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft > max - 4;
    if (count) {
      const s = step();
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const firstIn = Math.min(total, Math.round(track.scrollLeft / s) + 1);
      const lastIn = Math.min(total, firstIn + Math.max(1, Math.floor((track.clientWidth + gap + 2) / s)) - 1);
      count.textContent = firstIn === lastIn ? `${firstIn} / ${total}` : `${firstIn}–${lastIn} / ${total}`;
    }
  };
  prev.addEventListener('click', () => centred ? centreOn(current - 1) : track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => centred ? centreOn(current + 1) : track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
  let raf = 0;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  let started = false;
  const refresh = () => {
    // centred mode starts with the second card in the middle, so there is a card on each side
    if (centred && !started && track.clientWidth) { started = true; centreOn(total + 1, false); }
    update();
  };
  new ResizeObserver(refresh).observe(track); // also runs when a hidden tab is shown
  c.addEventListener('carousel:refresh', refresh); // a tab just showed this carousel: set it up now
  update();
});

// ---------- Service options (slanted panels): a tab or a photo switches the text ----------
document.querySelectorAll<HTMLElement>('[data-var]').forEach((root) => {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const texts = [...root.querySelectorAll<HTMLElement>('[data-var-text]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-var-panel]')];
  const ease = 'cubic-bezier(.22,.61,.36,1)';
  let busy = 0;
  // the chosen photo moves next to the text; the last one gets the straight right edge
  const reorder = (key: string) => {
    let pos = 2;
    panels.forEach((p) => { const on = p.dataset.varKey === key; p.classList.toggle('is-active', on); p.dataset.pos = on ? '1' : String(pos++); });
    panels.forEach((p) => p.classList.toggle('is-trailing', p.dataset.pos === String(panels.length)));
  };
  const activate = (key: string, focus = false) => {
    const current = panels.find((p) => p.classList.contains('is-active'))?.dataset.varKey;
    tabs.forEach((t) => {
      const on = t.dataset.varKey === key;
      t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    texts.forEach((p) => { const on = p.dataset.varKey === key; p.classList.toggle('is-active', on); p.setAttribute('aria-hidden', String(!on)); });
    if (reduceMotion || key === current) { reorder(key); return; }
    // Same effect as the venues by destination: the photos sink back (shrink and fade),
    // then the chosen one comes forward next to the text and the other slides in behind it
    texts.find((p) => p.dataset.varKey === key)?.animate([{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: 700, delay: 200, easing: ease, fill: 'backwards' });
    clearTimeout(busy);
    panels.forEach((p) => { p.getAnimations().forEach((a) => a.cancel()); p.animate([{ scale: '1', opacity: 1 }, { scale: '0.7', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' }); });
    busy = window.setTimeout(() => {
      reorder(key);
      panels.forEach((p) => {
        p.getAnimations().forEach((a) => a.cancel());
        if (p.dataset.pos === '1') p.animate([{ opacity: 0, scale: '0.8' }, { opacity: 1, scale: '1' }], { duration: 950, easing: ease });
        else p.animate([{ opacity: 0, translate: '-110px 0' }, { opacity: 1, translate: '0 0' }], { duration: 950, delay: 220, easing: ease, fill: 'backwards' });
      });
    }, 390);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t.dataset.varKey!));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      activate(tabs[(i + d + tabs.length) % tabs.length].dataset.varKey!, true);
    });
  });
  panels.forEach((p) => p.addEventListener('click', () => activate(p.dataset.varKey!)));
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
  const open = (n: number) => { last = document.activeElement as HTMLElement; show(n); box.classList.add('is-open'); document.body.classList.add('menu-open'); box.querySelector<HTMLElement>('[data-close]')!.focus({ preventScroll: true }); };
  const close = () => { box.classList.remove('is-open'); document.body.classList.remove('menu-open'); last?.focus({ preventScroll: true }); };
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
