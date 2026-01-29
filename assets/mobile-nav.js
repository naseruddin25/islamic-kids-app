/**
 * HAMBURGER MENU - Mobile Navigation
 * Provides full-screen drawer navigation for screens < 768px
 * Compatible with iOS Safari, Android Chrome, and all modern browsers
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__mobileNavInit) return;
  window.__mobileNavInit = true;

  function initHamburgerMenu() {
    const hamburger = document.querySelector('.navbar-hamburger');
    const drawer = document.querySelector('.navbar-drawer');
    const drawerContent = document.querySelector('.navbar-drawer-content');
    const drawerClose = document.querySelector('.navbar-drawer-close');

    // Guard: elements must exist
    if (!hamburger || !drawer || !drawerContent) {
      console.warn('[MobileNav] Required elements not found:', {
        hamburger: !!hamburger,
        drawer: !!drawer,
        drawerContent: !!drawerContent
      });
      return;
    }

    console.log('[MobileNav] All required elements found, initializing...');

    // State: track scroll position for iOS Safari
    let scrollY = 0;

    /**
     * Open drawer: show menu and lock body scroll
     */
    const openDrawer = () => {
      // Preserve scroll position before locking
      scrollY = window.scrollY || window.pageYOffset || 0;
      
      // Add classes for drawer visibility
      drawer.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      
      // Lock body scroll (iOS-friendly approach)
      document.body.classList.add('nav-open');
      document.body.style.top = `-${scrollY}px`;
    };

    /**
     * Close drawer: hide menu and restore body scroll
     */
    const closeDrawer = () => {
      // Remove classes to hide drawer
      drawer.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      
      // Unlock body scroll
      document.body.classList.remove('nav-open');
      document.body.style.top = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, scrollY);
      }
    };

    /**
     * Toggle drawer open/closed
     */
    const toggleDrawer = () => {
      if (drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    };

    // EVENT 1: Hamburger button click
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[MobileNav] Hamburger clicked, current state:', drawer.classList.contains('open') ? 'open' : 'closed');
      toggleDrawer();
    }, false);

    // EVENT 2: Close button click
    if (drawerClose) {
      drawerClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDrawer();
      }, false);
    }

    // EVENT 3: Backdrop click (semi-transparent overlay)
    drawer.addEventListener('click', (e) => {
      // Only close if clicking directly on the drawer (backdrop)
      if (e.target === drawer) {
        closeDrawer();
      }
    }, false);

    // EVENT 4: Navigation link click (auto-close after navigation)
    const drawerNavLinks = drawer.querySelectorAll('.navbar-drawer-nav a');
    drawerNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Close drawer after link click
        closeDrawer();
      }, false);
    });

    // EVENT 5: Escape key (close menu)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    }, false);

    console.log('[MobileNav] Hamburger menu initialized successfully');
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburgerMenu, false);
  } else {
    // DOM already loaded
    initHamburgerMenu();
  }
})();
