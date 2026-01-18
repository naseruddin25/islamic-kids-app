/**
 * BASE PATH RESOLVER FOR GITHUB PAGES
 * 
 * This module provides a centralized way to handle base paths for GitHub Pages
 * where the site is hosted under a subpath (e.g., /islamic-kids-app/).
 * 
 * Usage:
 *   withBase('lessons/lesson.html') => '/islamic-kids-app/lessons/lesson.html'
 *   withBase('assets/lessons.json') => '/islamic-kids-app/assets/lessons.json'
 */

(function(window) {
  'use strict';

  // Determine the base path for this deployment
  function getBasePath() {
    // 1. Check for meta tag (highest priority)
    const meta = document.querySelector('meta[name="site-base"]');
    if (meta && meta.content) {
      return meta.content.replace(/\/$/, ''); // Remove trailing slash
    }

    // 2. Derive from current location
    const pathname = window.location.pathname;
    
    // Known GitHub Pages project path
    const ghPagesMatch = pathname.match(/^(\/[^\/]+)/);
    if (ghPagesMatch && ghPagesMatch[1] !== '/index.html') {
      // We're likely on GitHub Pages with a project name
      // Check if it looks like /islamic-kids-app/ or similar
      const possibleBase = ghPagesMatch[1];
      if (possibleBase !== '/lessons' && possibleBase !== '/assets') {
        return possibleBase;
      }
    }

    // 3. Default to empty (root deployment)
    return '';
  }

  const BASE_PATH = getBasePath();

  /**
   * Prepend the base path to a relative URL
   * @param {string} path - Relative path (e.g., 'assets/lessons.json')
   * @returns {string} - Absolute path with base (e.g., '/islamic-kids-app/assets/lessons.json')
   */
  function withBase(path) {
    if (!path) return BASE_PATH || '/';
    
    // Remove leading slash if present
    const cleanPath = path.replace(/^\//, '');
    
    if (BASE_PATH) {
      return `${BASE_PATH}/${cleanPath}`;
    }
    
    return `/${cleanPath}`;
  }

  /**
   * Get the base path (useful for debugging)
   * @returns {string} - The current base path
   */
  function getBase() {
    return BASE_PATH;
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean}
   */
  function isDebugMode() {
    const params = new URLSearchParams(window.location.search);
    return params.has('debug');
  }

  /**
   * Log diagnostics if debug mode is enabled
   */
  function logDiagnostics() {
    if (!isDebugMode()) return;

    console.group('🔍 Base Path Diagnostics');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Computed Base Path:', BASE_PATH || '(root)');
    console.log('Sample paths:');
    console.log('  - withBase("assets/lessons.json"):', withBase('assets/lessons.json'));
    console.log('  - withBase("lessons/"):', withBase('lessons/'));
    console.log('  - withBase("lessons/lesson.html"):', withBase('lessons/lesson.html'));
    console.groupEnd();
  }

  // Expose to global scope
  window.BasePath = {
    withBase: withBase,
    getBase: getBase,
    isDebugMode: isDebugMode,
    logDiagnostics: logDiagnostics
  };

  // Auto-log diagnostics on load if debug mode is active
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logDiagnostics);
  } else {
    logDiagnostics();
  }

})(window);
