/* RTL Vibe UI — Preview interaction layer; replaces Modal/Drawer/Tabs/Accordion inline handlers. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const modal = $('#modal');
  const dialog = $('.modal', modal);
  const drawer = $('#drawer');
  const drawerBackdrop = $('#drawer-backdrop');
  const app = $('.app');
  const sidebar = $('.sidebar', app);
  const main = $('.main', app);
  const demoBar = $('.demo-bar');
  const navBackdrop = $('#mobile-nav-backdrop');
  const navToggle = $('#mobile-nav-toggle');
  const navClose = $('#mobile-nav-close');
  let activeOverlay = null;
  let returnFocus = null;
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const openFocusables = container => $$(focusableSelector, container).filter(el => !el.closest('[hidden], [inert]') && el.getClientRects().length);

  const setBackgroundInert = (type, value) => {
    if (type === 'mobile') {
      main.inert = value;
      demoBar.inert = value;
    } else {
      app.inert = value;
      demoBar.inert = value;
    }
  };
  const setBodyLocked = locked => document.body.classList.toggle('has-overlay', locked);
  const show = (type, trigger) => {
    if (activeOverlay) close();
    returnFocus = trigger;
    activeOverlay = type;
    if (type === 'modal') {
      modal.hidden = false;
    } else if (type === 'drawer') {
      drawer.inert = false;
      drawer.setAttribute('aria-hidden', 'false');
      drawer.classList.add('open');
      drawerBackdrop.classList.add('open');
    } else if (type === 'mobile') {
      app.classList.add('mobile-nav-open');
      navBackdrop.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      sidebar.inert = false;
    }
    setBackgroundInert(type, true);
    setBodyLocked(true);
    const target = type === 'modal' ? dialog : type === 'drawer' ? drawer : sidebar;
    (openFocusables(target)[0] || target).focus();
  };
  const close = () => {
    const previousType = activeOverlay;
    if (!previousType) return;
    if (previousType === 'modal') modal.hidden = true;
    if (previousType === 'drawer') {
      drawer.classList.remove('open');
      drawerBackdrop.classList.remove('open');
      drawer.inert = true;
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (previousType === 'mobile') {
      app.classList.remove('mobile-nav-open');
      navBackdrop.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      sidebar.inert = matchMedia('(max-width: 900px)').matches;
    }
    setBackgroundInert(previousType, false);
    setBodyLocked(false);
    activeOverlay = null;
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected && !target.closest('[inert]')) target.focus();
  };

  $('#open-modal')?.addEventListener('click', e => show('modal', e.currentTarget));
  $('#close-modal')?.addEventListener('click', close);
  $('#cancel-modal')?.addEventListener('click', close);
  $('#confirm-modal')?.addEventListener('click', () => {
    close();
    if (typeof showToast === 'function') showToast('این یک دموی نمایشی است؛ عملیات ثبت انجام نشد.', 'accent');
  });
  modal?.addEventListener('click', e => { if (e.target === modal) close(); });
  $('#open-drawer')?.addEventListener('click', e => show('drawer', e.currentTarget));
  $('#close-drawer')?.addEventListener('click', close);
  drawerBackdrop?.addEventListener('click', close);
  $('.drawer-body .btn-primary', drawer)?.addEventListener('click', () => {
    close();
    if (typeof showToast === 'function') showToast('فیلترهای نمایشی اعمال شدند.', 'accent');
  });
  navToggle?.addEventListener('click', e => show('mobile', e.currentTarget));
  navClose?.addEventListener('click', close);
  navBackdrop?.addEventListener('click', close);
  $$('.nav-item', sidebar).forEach(link => link.addEventListener('click', () => {
    if (activeOverlay === 'mobile') close();
  }));
  document.addEventListener('keydown', event => {
    if (!activeOverlay) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const target = activeOverlay === 'modal' ? dialog : activeOverlay === 'drawer' ? drawer : sidebar;
    const options = openFocusables(target);
    if (!options.length) { event.preventDefault(); return; }
    const first = options[0];
    const last = options[options.length - 1];
    if (event.shiftKey && (document.activeElement === first || !target.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !target.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });
  const onViewportChange = () => {
    if (!matchMedia('(max-width: 900px)').matches && activeOverlay === 'mobile') close();
    sidebar.inert = matchMedia('(max-width: 900px)').matches && activeOverlay !== 'mobile';
  };
  window.addEventListener('resize', onViewportChange, { passive: true });
  onViewportChange();
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');

  // Automatic-activation tabs with roving tabindex and direction-aware arrows.
  $$('.tabs[role="tablist"]').forEach(group => {
    const tabs = $$('[role="tab"]', group);
    const activate = (tab, moveFocus = false) => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (moveFocus) tab.focus();
    };
    tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
    group.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      let next = current;
      const rtl = getComputedStyle(group).direction === 'rtl';
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === 'ArrowRight') next = (current + (rtl ? -1 : 1) + tabs.length) % tabs.length;
      if (event.key === 'ArrowLeft') next = (current + (rtl ? 1 : -1) + tabs.length) % tabs.length;
      activate(tabs[next], true);
    });
    activate(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  });

  $$('.accordion-trigger').forEach(trigger => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    const initial = trigger.getAttribute('aria-expanded') === 'true';
    panel.hidden = !initial;
    panel.classList.toggle('open', initial);
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
      panel.classList.toggle('open', !expanded);
    });
  });
  const phone = $('#f-phone');
  const phoneHint = $('#phone-hint');
  if (phone && phoneHint) phone.setAttribute('aria-describedby', 'phone-hint');
})();
