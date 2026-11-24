// Mobile nav
document.querySelectorAll('.nav-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const nav = document.querySelector('.nav');
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// Lightbox for diagrams and wireframes
(function () {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<div class="lb-bar"><span class="lb-cap"></span><span><button class="lb-zoom">Actual size</button> <button class="lb-close">Close ✕</button></span></div><div class="lb-img"><img alt="" class="fit"></div>';
  document.body.appendChild(lb);
  const img = lb.querySelector('img');
  const cap = lb.querySelector('.lb-cap');
  const zoom = lb.querySelector('.lb-zoom');
  let last = null;

  function open(src, alt) {
    last = document.activeElement;
    img.src = src; img.alt = alt || ''; img.className = 'fit';
    zoom.textContent = 'Actual size';
    cap.textContent = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (last) last.focus();
  }
  zoom.addEventListener('click', () => {
    const fit = img.classList.toggle('fit');
    zoom.textContent = fit ? 'Actual size' : 'Fit to screen';
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-img')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });

  document.querySelectorAll('[data-zoom]').forEach(el => {
    const target = el.querySelector('img') || el;
    el.addEventListener('click', () => open(el.dataset.zoom || target.src, target.alt));
    if (el.tagName !== 'BUTTON') {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
    }
  });
})();

// Table filters: buttons with data-filter="value" toggle rows with matching data-group
document.querySelectorAll('.filters').forEach(group => {
  const table = document.getElementById(group.dataset.for);
  if (!table) return;
  group.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    group.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.filter;
    table.querySelectorAll('tbody tr').forEach(tr => {
      const groups = (tr.dataset.group || '').split(' ');
      tr.hidden = !(f === 'all' || groups.includes(f));
    });
  });
});

// Highlight the current section in the sub-navigation
(function () {
  const links = [...document.querySelectorAll('.subnav a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const a = map.get(en.target.id);
        if (a) { a.classList.add('active'); a.parentElement.scrollTo({ left: a.offsetLeft - 24, behavior: 'smooth' }); }
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

// Project delivery lifecycle: clickable phases with a breakdown panel
document.querySelectorAll('[data-lifecycle]').forEach(lc => {
  const list = lc.querySelector('.lc-tabs');
  const tabs = [...lc.querySelectorAll('[role="tab"]')];
  const panelOf = t => document.getElementById(t.getAttribute('aria-controls'));
  const mq = window.matchMedia('(max-width: 720px)');

  function place() {
    const t = tabs.find(x => x.getAttribute('aria-selected') === 'true');
    const p = panelOf(t);
    if (mq.matches) t.after(p); else list.appendChild(p);
  }
  function select(t, focus) {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      panelOf(x).hidden = !on;
    });
    place();
    if (focus) t.focus();
    if (mq.matches) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      const j = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (j !== undefined) { e.preventDefault(); select(tabs[j], true); }
    });
  });
  if (mq.addEventListener) mq.addEventListener('change', place);
  place();

  // Deep links such as index.html#lc-design open that phase
  const fromHash = () => {
    const t = tabs.find(x => '#' + x.getAttribute('aria-controls') === location.hash);
    if (!t) return;
    select(t);
    // Run after the browser's own jump to the anchor, then bring the phase cards into view
    setTimeout(() => {
      const target = mq.matches ? t : list;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 90, behavior: 'instant' });
    }, 50);
  };
  window.addEventListener('hashchange', fromHash);
  if (document.readyState === 'complete') fromHash();
  else window.addEventListener('load', fromHash);
});
