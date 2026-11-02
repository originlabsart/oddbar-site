/* ODDBAR · policies and 404 pages: sticky bar and the mobile menu. */
(() => {
  const bar = document.querySelector('[data-bar]');
  const nav = document.querySelector('[data-nav]'), btn = document.querySelector('[data-menu]');
  let open = false;
  const onBar = () => bar && bar.classList.toggle('solid', window.scrollY > 40 || open);
  function setMenu(v, back) {
    open = v; nav.classList.toggle('open', v); btn.setAttribute('aria-expanded', v);
    btn.querySelector('.bar-menu-t').textContent = v ? 'Close' : 'Menu'; onBar();
    if (v) nav.querySelector('a')?.focus(); else if (back) btn.focus();
  }
  if (nav && btn) {
    btn.addEventListener('click', () => setMenu(!open));
    nav.addEventListener('click', e => { if (e.target.closest('a') && open) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setMenu(false, true); });
    window.matchMedia('(min-width: 1181px)').addEventListener?.('change', m => { if (m.matches && open) setMenu(false); });
  }
  window.addEventListener('scroll', onBar, { passive: true });
  onBar();
})();
