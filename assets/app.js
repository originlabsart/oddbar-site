/* ODDBAR · The lucky ones. Vanilla JS, no dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- top bar ---------- */
  const bar = $('[data-bar]');
  const onBar = () => bar.classList.toggle('solid', window.scrollY > 40 || menuOpen);

  /* ---------- mobile menu ---------- */
  const nav = $('[data-nav]'), menuBtn = $('[data-menu]');
  let menuOpen = false;
  function setMenu(open, focusBack) {
    menuOpen = open;
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    $('.bar-menu-t', menuBtn).textContent = open ? 'Close' : 'Menu';
    onBar();
    if (open) $('a', nav)?.focus();
    else if (focusBack) menuBtn.focus();
  }
  menuBtn?.addEventListener('click', () => setMenu(!menuOpen));
  nav?.addEventListener('click', e => { if (e.target.closest('a') && menuOpen) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false, true); });
  window.matchMedia('(min-width: 1181px)').addEventListener?.('change', m => { if (m.matches && menuOpen) setMenu(false); });

  /* ---------- parallax ---------- */
  const scenes = $$('[data-scene]').map(el => ({ el, layers: $$('[data-speed]', el).map(l => ({ l, s: parseFloat(l.dataset.speed) || 0, c: parseFloat(l.dataset.clamp) || 0 })) }));
  let ticking = false, vh = window.innerHeight;
  function paint() {
    ticking = false;
    if (reduce.matches) return;
    for (const sc of scenes) {
      const r = sc.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      // 0 when the scene is framed as drawn: hero at the top of the page, other
      // scenes centred in the viewport. Positive as you scroll past, so far layers lag.
      const off = sc.el.classList.contains('hero') ? -r.top : (vh / 2) - (r.top + r.height / 2);
      for (const { l, s, c } of sc.layers) {
        let y = off * s;
        // layers that move inside a frame are held within the frame's overscan
        if (c) { const m = l.parentElement.offsetHeight * c; y = Math.max(-m, Math.min(m, y)); }
        l.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    }
  }
  function onScroll() { onBar(); if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { vh = window.innerHeight; onScroll(); }, { passive: true });
  reduce.addEventListener?.('change', () => { if (reduce.matches) scenes.forEach(sc => sc.layers.forEach(({ l }) => (l.style.transform = ''))); else onScroll(); });
  onScroll();

  /* ---------- hero pets: eyes follow the pointer, blink, talk ---------- */
  const eyes = $$('[data-eyes]').map(g => ({ g, pupils: $$('.pupil', g).map(p => ({ p, cx: +p.getAttribute('cx'), cy: +p.getAttribute('cy') })) }));
  let px = window.innerWidth * 0.3, py = window.innerHeight * 0.3, eyeQueued = false;
  function lookAt() {
    eyeQueued = false;
    for (const e of eyes) {
      const svg = e.g.ownerSVGElement; const r = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal;
      const k = r.width / vb.width;
      for (const pu of e.pupils) {
        const ex = r.left + pu.cx * k, ey = r.top + pu.cy * k;
        const a = Math.atan2(py - ey, px - ex), d = Math.min(1, Math.hypot(px - ex, py - ey) / 300);
        pu.p.setAttribute('transform', `translate(${(Math.cos(a) * 4.2 * d).toFixed(2)} ${(Math.sin(a) * 2.6 * d).toFixed(2)})`);
      }
    }
  }
  window.addEventListener('pointermove', ev => { px = ev.clientX; py = ev.clientY; if (!eyeQueued) { eyeQueued = true; requestAnimationFrame(lookAt); } }, { passive: true });
  lookAt();

  const pets = $$('.pet');
  const blink = p => { p.classList.remove('blink'); void p.offsetWidth; p.classList.add('blink'); };
  if (!reduce.matches) setInterval(() => { const p = pets[Math.floor(Math.random() * pets.length)]; if (p) blink(p); }, 3200);

  const say = $('[data-say]');
  const lines = {
    cat: ['Bad luck? Me? Rude.', 'Black cats are good luck. Fact. Well, opinion. A strong one.', 'This ear has a story. It is not for sharing.', 'Purr.'],
    dog: ['Grey round the chops, young at heart.', 'Old dogs know the best spots on the sofa.', 'Is that a biscuit in your pocket?', 'Woof. That means hello.'],
  };
  const idx = { cat: 0, dog: 0 };
  let sayT;
  pets.forEach(p => p.addEventListener('click', () => {
    const k = p.dataset.pet; const l = lines[k][idx[k]++ % lines[k].length];
    say.textContent = l; say.classList.add('on'); blink(p);
    p.classList.remove('happy'); void p.offsetWidth; p.classList.add('happy');
    clearTimeout(sayT); sayT = setTimeout(() => { say.classList.remove('on'); p.classList.remove('happy'); }, 2600);
  }));

  /* ---------- shop tags ---------- */
  const tags = $$('.tag');
  tags.forEach(t => t.addEventListener('click', () => t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true')));
  const flipAll = $('[data-flip-all]');
  flipAll?.addEventListener('click', () => {
    const on = flipAll.getAttribute('aria-pressed') !== 'true';
    flipAll.setAttribute('aria-pressed', on); flipAll.textContent = on ? 'Turn them back' : 'Turn them all over';
    tags.forEach((t, i) => setTimeout(() => t.setAttribute('aria-pressed', on), reduce.matches ? 0 : i * 90));
  });

  /* ---------- omen cards ---------- */
  $$('.card').forEach(c => c.addEventListener('click', () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true')));

  /* ---------- a black cat crosses your path ---------- */
  const crosser = $('[data-crosser]'), toast = $('[data-toast]'), luckEl = $('[data-luck]');
  let luck = 0, toastT, crossing = false;
  const toasts = ['A black cat just crossed your path. Lucky you.', 'Another one. Your luck is through the roof.', 'Three crossings. Practically a four-leaf clover.', 'At this point you are the luckiest person in Orkney.'];
  function cross() {
    luck++; luckEl.textContent = luck === 1 ? '1 lucky crossing so far' : `${luck} lucky crossings so far`;
    toast.textContent = toasts[Math.min(luck - 1, toasts.length - 1)];
    toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 3400);
    if (reduce.matches || crossing) return;
    crossing = true; crosser.classList.remove('go'); void crosser.offsetWidth; crosser.classList.add('go');
  }
  crosser.addEventListener('animationend', e => { if (e.animationName === 'cross') { crosser.classList.remove('go'); crossing = false; } });
  $('[data-cross]')?.addEventListener('click', cross);
  const omens = $('#omens');
  if ('IntersectionObserver' in window && omens) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(cross, 700); } }, { threshold: 0.45 });
    io.observe(omens);
  }

  /* ---------- the line-up ---------- */
  const mates = $$('.mate');
  mates.forEach(m => m.addEventListener('click', () => {
    const open = m.getAttribute('aria-expanded') !== 'true';
    mates.forEach(o => o.setAttribute('aria-expanded', 'false'));
    m.setAttribute('aria-expanded', open);
  }));

  /* ---------- standing stones ---------- */
  const aims = [
    ['Welfare, and learning', 'Promote the welfare of animals, and educate the public about how to look after them.'],
    ['Neutering, made affordable', 'Support control of the dog and cat population by advocating neutering, and by making funds available to help members of the public pay for it.'],
    ['Black is lucky', 'Campaign against the superstitions around black dogs and cats, and against their high rate of ill-treatment and abandonment.'],
    ['Old and wonky welcome', 'Campaign for a responsible attitude to dogs and cats, including the rehoming of old and disabled dogs and cats.'],
    ['A home for life', 'Establish rescue and rehoming centres, and give a permanent home for life to those that cannot be rehomed, in particular old, disabled and black dogs and cats.'],
    ['The shop that pays for it', 'Provide for the welfare of animals through a charity shop and fundraising, run entirely by volunteers.'],
  ];
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const stones = $$('.stone');
  const card = $('.aim-card');
  let cur = 0;
  function setAim(i) {
    cur = (i + aims.length) % aims.length;
    stones.forEach((s, j) => { s.classList.toggle('on', j === cur); s.setAttribute('aria-pressed', j === cur); });
    $('[data-aim-n]').textContent = `Stone ${roman[cur]} of VI`;
    $('[data-aim-t]').textContent = aims[cur][0];
    $('[data-aim-d]').textContent = aims[cur][1];
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
  }
  stones.forEach((s, i) => {
    s.addEventListener('click', () => setAim(i));
    s.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAim(i); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setAim(i + 1); stones[cur].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setAim(i - 1); stones[cur].focus(); }
    });
  });
  $('[data-aim-next]')?.addEventListener('click', () => setAim(cur + 1));
  $('[data-aim-prev]')?.addEventListener('click', () => setAim(cur - 1));

  /* ---------- the door at No. 42 ---------- */
  const door = $('[data-door]');
  if (door) {
    const sign = $('[data-sign]', door), signLabel = $('[data-sign-label]', door), how = $('[data-door-how]', door);
    const modes = {
      open: ['Open · Call in person', 'Pop into the shop to browse and buy, say thank you, ask about volunteering, or ask how best to give.'],
      closed: ['Closed · Call or write', 'Ring 07491 250664 or post a note to the shop at the address below. Ideal for a question about adopting or volunteering, or simply cheering on the volunteers.'],
    };
    sign.addEventListener('click', () => {
      const closed = !door.classList.contains('closed');
      door.classList.toggle('closed', closed);
      const m = modes[closed ? 'closed' : 'open'];
      signLabel.textContent = `The shop sign shows ${closed ? 'Closed' : 'Open'}. Turn it over`;
      $('.door-k', how).textContent = m[0]; $('.door-t', how).textContent = m[1];
      how.classList.remove('swap'); void how.offsetWidth; how.classList.add('swap');
      if (!reduce.matches) { sign.classList.remove('swing'); void sign.offsetWidth; sign.classList.add('swing'); }
    });
    sign.addEventListener('animationend', e => { if (e.animationName === 'signSwing') sign.classList.remove('swing'); });

    const bell = $('[data-bell]', door), catSay = $('[data-door-say]', door);
    const catLines = [
      'Mrrp. The shop helps pay for our work, so come and have a rummage.',
      'Everyone here is a volunteer. No paid staff. Ask about joining us.',
      'Want to give? Ask at the counter how best to do it.',
      'A black cat at the door? That is good luck, that is.',
      'Ring 07491 250664. Not this bell. The other kind.',
    ];
    let ci = 0, catT, actx;
    function ding() {
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const t0 = actx.currentTime;
        [0, 0.16].forEach((d, k) => [[1568, .05], [2352, .022], [3920, .01]].forEach(([f, g]) => {
          const o = actx.createOscillator(), v = actx.createGain(), t = t0 + d;
          o.type = 'sine'; o.frequency.value = f * (k ? 1.005 : 1);
          v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g * (k ? .7 : 1), t + .008); v.gain.exponentialRampToValueAtTime(.0001, t + 1.5);
          o.connect(v); v.connect(actx.destination); o.start(t); o.stop(t + 1.6);
        }));
      } catch { /* no audio, the bell still swings */ }
    }
    bell.addEventListener('click', () => {
      ding();
      bell.classList.remove('ringing'); void bell.offsetWidth; bell.classList.add('ringing');
      door.classList.remove('awake'); void door.offsetWidth; door.classList.add('awake');
      catSay.textContent = catLines[ci++ % catLines.length]; catSay.classList.add('on');
      clearTimeout(catT); catT = setTimeout(() => { catSay.classList.remove('on'); door.classList.remove('awake'); }, 5200);
    });

    $('[data-print]', door)?.addEventListener('click', () => window.print());
    const note = $('[data-copy-note]', door);
    $('[data-copy]', door)?.addEventListener('click', async () => {
      const text = 'ODDBAR, 42 Albert Street, Kirkwall, Orkney KW15 1HQ';
      try { await navigator.clipboard.writeText(text); note.textContent = 'Copied. Good luck!'; }
      catch { note.textContent = text; }
      setTimeout(() => (note.textContent = ''), 3000);
    });
  }

  /* ---------- II From Kirkwall to Brasov: night to dawn, the route draws as you scroll ---------- */
  const dawn = $('[data-dawn]');
  if (dawn) {
    const path = $('[data-route-path]', dawn), dot = $('[data-route-dot]', dawn);
    const len = path.getTotalLength();
    let dq = false;
    const draw = () => {
      dq = false;
      let p = 1;
      if (!reduce.matches) {
        const r = dawn.getBoundingClientRect();
        p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (r.height * 0.95)));
      }
      dawn.style.setProperty('--p', p.toFixed(3));
      path.style.strokeDashoffset = (1 - p).toFixed(4);
      const pt = path.getPointAtLength(len * p);
      dot.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    };
    const queue = () => { if (!dq) { dq = true; requestAnimationFrame(draw); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    reduce.addEventListener?.('change', queue);
    draw();
  }

  /* ---------- numbers count up, tally marks are chalked one by one ---------- */
  const below = el => el.getBoundingClientRect().top > window.innerHeight;
  const fmt = (n, sep) => sep ? Number(n).toLocaleString('en-GB') : String(n);
  if ('IntersectionObserver' in window && !reduce.matches) {
    const counts = $$('[data-count]').filter(below);
    counts.forEach(el => (el.textContent = '0'));
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, sep = el.hasAttribute('data-sep'), t0 = performance.now(), dur = Math.min(1800, 700 + end * 6);
      const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3))), sep); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    counts.forEach(el => cio.observe(el));
    const tally = $('[data-tally]');
    if (tally && below(tally)) {
      tally.classList.add('armed');
      const tio = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { tio.disconnect(); tally.classList.add('go'); } }, { threshold: 0.35 });
      tio.observe(tally);
    }
  }

  /* ---------- five years of the books: hover and focus readout ---------- */
  const plot = $('[data-books-plot]');
  if (plot) {
    const tip = $('[data-books-tip]', plot);
    const gbp = n => '\u00a3' + Number(n).toLocaleString('en-GB');
    const row = (c, v, l) => { const r = document.createElement('div'); r.className = 'tt-r'; const i = document.createElement('i'); i.style.background = c; const b = document.createElement('b'); b.textContent = gbp(v); const t = document.createElement('span'); t.textContent = l; r.append(i, b, t); return r; };
    const show = li => {
      tip.replaceChildren();
      const y = document.createElement('div'); y.className = 'tt-y'; y.textContent = 'Year ended 30 July ' + li.dataset.y;
      tip.append(y, row('#b08640', li.dataset.in, 'income'), row('#3f86c4', li.dataset.out, 'spending'));
      const pr = plot.getBoundingClientRect(), r = li.getBoundingClientRect();
      tip.classList.add('on');
      let x = r.left - pr.left + r.width / 2 - tip.offsetWidth / 2;
      x = Math.max(0, Math.min(pr.width - tip.offsetWidth, x));
      tip.style.left = x + 'px'; tip.style.top = '-8px';
    };
    const hide = () => tip.classList.remove('on');
    $$('li', plot).forEach(li => {
      li.addEventListener('pointerenter', () => show(li));
      li.addEventListener('focus', () => show(li));
      li.addEventListener('pointerleave', hide);
      li.addEventListener('blur', hide);
    });
  }

  /* ---------- the merry dancers flare round our partner ---------- */
  const dancers = $('[data-dancers]');
  if (dancers) {
    let dq = false;
    const flare = () => {
      dq = false;
      if (reduce.matches) { dancers.style.setProperty('--f', '1'); return; }
      const r = dancers.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)));
      dancers.style.setProperty('--f', f.toFixed(3));
    };
    const queue = () => { if (!dq) { dq = true; requestAnimationFrame(flare); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    reduce.addEventListener?.('change', queue);
    flare();
    const pl = $('.dn-link', dancers);
    const surge = on => dancers.classList.toggle('surge', on);
    pl.addEventListener('pointerenter', () => surge(true));
    pl.addEventListener('pointerleave', () => surge(false));
    pl.addEventListener('focus', () => surge(true));
    pl.addEventListener('blur', () => surge(false));
  }
})();
