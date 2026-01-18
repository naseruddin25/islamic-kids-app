/**
 * BASE PATH RESOLVER FOR GITHUB PAGES
 * 
 * Handles GitHub Pages deployment under /islamic-kids-app/ subpath.
 * Provides utilities for resolving asset and page URLs correctly
 * in both local development and production environments.
 */

(function() {
  'use strict';

  // Debug mode: Enable with ?debug=1 query parameter
  const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

  /**
   * Get the base path for the site
   * Priority:
   * 1. Meta tag: <meta name="site-base" content="/islamic-kids-app/">
   * 2. Auto-detect from pathname (for GitHub Pages)
   * 3. Default to root ("/")
   */
  function getSiteBase() {
    // Check for explicit meta tag
    const meta = document.querySelector('meta[name="site-base"]');
    if (meta && meta.content) {
      return meta.content.replace(/\/$/, '') || ''; // Remove trailing slash, allow empty
    }

    // Auto-detect GitHub Pages path
    const path = window.location.pathname;
    const match = path.match(/^(\/[^\/]+)\//);
    if (match && match[1] !== '/lessons' && match[1] !== '/assets') {
      // Looks like /islamic-kids-app/ or similar project path
      return match[1];
    }

    // Default to root
    return '';
  }

  /**
   * Prepend base path to a relative path
   * @param {string} relPath - Relative path (MUST NOT start with "/")
   * @returns {string} - Full path with base prepended
   */
  function withBase(relPath) {
    if (!relPath) return BASE_PATH || '/';
    if (relPath.startsWith('http://') || relPath.startsWith('https://')) {
      return relPath; // Already absolute
    }
    if (relPath.startsWith('/')) {
      console.warn('[withBase] Path starts with "/" which may fail on GitHub Pages:', relPath);
      return relPath;
    }
    
    const base = BASE_PATH || '';
    const path = relPath.startsWith('./') ? relPath.slice(2) : relPath;
    return base ? `${base}/${path}` : path;
  }

  /**
   * Show debug overlay in top-right corner
   */
  function showDebugOverlay(info) {
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 12px;
      border-radius: 4px;
      z-index: 99999;
      max-width: 400px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    `;
    
    overlay.innerHTML = `
      <div style="margin-bottom: 8px; color: #fff; font-weight: bold;">🔍 DEBUG MODE</div>
      <div><strong>Base Path:</strong> "${info.basePath}"</div>
      <div><strong>Location:</strong> ${info.location}</div>
      <div><strong>Manifest URL:</strong> ${info.manifestUrl}</div>
      <div><strong>Lessons Count:</strong> ${info.lessonsCount}</div>
      ${info.lastError ? `<div style="color: #f66; margin-top: 8px;"><strong>Last Error:</strong><br>${info.lastError}</div>` : ''}
      <div style="margin-top: 8px; color: #999;">Remove ?debug=1 to hide</div>
    `;
    
    document.body.appendChild(overlay);
  }

  /**
   * Update debug overlay info
   */
  function updateDebugInfo(updates) {
    if (!DEBUG) return;
    Object.assign(window.__DEBUG_INFO, updates);
    
    const existing = document.getElementById('debug-overlay');
    if (existing) {
      existing.remove();
    }
    showDebugOverlay(window.__DEBUG_INFO);
  }

  // Initialize
  const BASE_PATH = getSiteBase();

  // Export to global scope
  window.getSiteBase = getSiteBase;
  window.withBase = withBase;
  window.BASE_PATH = BASE_PATH;
  window.updateDebugInfo = updateDebugInfo;

  // Initialize debug info
  if (DEBUG) {
    window.__DEBUG_INFO = {
      basePath: BASE_PATH,
      location: window.location.pathname,
      manifestUrl: withBase('assets/lessons.json'),
      lessonsCount: '—',
      lastError: null
    };
    
    // Show overlay after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => showDebugOverlay(window.__DEBUG_INFO));
    } else {
      showDebugOverlay(window.__DEBUG_INFO);
    }
  }

  // Log initialization
  console.log('[base-path.js] Initialized with base:', BASE_PATH);
  console.log('[base-path.js] Sample paths:', {
    'assets/lessons.json': withBase('assets/lessons.json'),
    'lessons/': withBase('lessons/'),
    'lessons/lesson.html?id=1': withBase('lessons/lesson.html?id=1')
  });

})();
