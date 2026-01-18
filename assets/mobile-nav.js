/**
 * HAMBURGER MENU - Mobile Navigation
 * Provides drawer-based navigation for screens < 768px
 */

(function() {
  'use strict';

  if (window.__mobileNavInit) return;
  window.__mobileNavInit = true;

  function initHamburgerMenu() {
    const hamburger = document.querySelector('.navbar-hamburger');
    const drawer = document.querySelector('.navbar-drawer');
    const drawerClose = document.querySelector('.navbar-drawer-close');

    if (!hamburger || !drawer) {
      console.warn('[MobileNav] Hamburger menu elements not found');
      return;
    }

    const openDrawer = () => {
      drawer.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    // Open drawer
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close button
    if (drawerClose) {
      drawerClose.addEventListener('click', closeDrawer);
    }

    // Close on backdrop click
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        closeDrawer();
      }
    });

    // Close on nav link click
    const drawerNavLinks = drawer.querySelectorAll('.navbar-drawer-nav a');
    drawerNavLinks.forEach(link => {
      link.addEventListener('click', closeDrawer);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });

    console.log('[MobileNav] Hamburger menu initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburgerMenu);
  } else {
    initHamburgerMenu();
  }
})();
