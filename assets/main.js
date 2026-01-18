/**
 * MAIN.JS - Filtering & Interaction Logic with GitHub Pages support
 */

(function() {
  'use strict';

  const state = {
    allLessons: [],
    currentSearch: '',
    currentCategory: 'all',
    completedLessons: new Set(),
  };

  // Map lesson tags/categories to chip categories
  const categoryMap = {
    'foundations': ['Foundations of Faith'],
    'character': ['Role Models & Character', 'Strength of Character', 'Modesty & Personal Conduct'],
    'worship': ['Prayer & Worship', 'Purification & Cleanliness', 'Pillars of Islam & Iman'],
    'identity': ['Important Modern Topics', 'Wrap-Up & Reference'],
    'social': ['Unity & Following the Right Path'],
    'purpose': ['Pillars of Islam & Iman'],
  };

  function lessonMatchesCategory(lesson, category) {
    if (category === 'all') return true;
    const allowedTags = categoryMap[category] || [];
    return (lesson.tags || []).some(tag => allowedTags.includes(tag));
  }

  function filterLessons(search = '', category = 'all') {
    const searchLower = search.toLowerCase().trim();
    
    return state.allLessons.filter(lesson => {
      // Category filter
      if (!lessonMatchesCategory(lesson, category)) return false;
      
      // Search filter
      if (!searchLower) return true;
      
      return (
        String(lesson.number).includes(searchLower) ||
        lesson.title.toLowerCase().includes(searchLower) ||
        (lesson.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  }

  function renderLessonCard(lesson) {
    const isCompleted = state.completedLessons.has(lesson.id);
    const badge = `Lesson ${String(lesson.number).padStart(2, '0')}`;
    
    // Use withBase() for lesson links
    const lessonUrl = window.withBase ? 
      window.withBase(`lessons/lesson.html?id=${encodeURIComponent(lesson.id)}`) :
      `lessons/lesson.html?id=${encodeURIComponent(lesson.id)}`;
    
    return `
      <a href="${lessonUrl}" class="card">
        <div class="card-header">
          <span class="card-badge">${badge}</span>
          ${isCompleted ? '<span style="font-size: 18px;">✓</span>' : ''}
        </div>
        <h3>${lesson.title}</h3>
        <p class="card-description">${lesson.tags.join(' • ')}</p>
        <div class="card-meta">
          <span>⏱ ${lesson.minutes} min</span>
          <span>${isCompleted ? 'Completed' : 'Start'}</span>
        </div>
      </a>
    `;
  }

  function updateDisplay() {
    const filteredLessons = filterLessons(state.currentSearch, state.currentCategory);
    const grid = document.getElementById('lessons-grid');
    const statusEl = document.getElementById('filter-status');

    if (!grid) return;

    if (filteredLessons.length === 0) {
      grid.innerHTML = `
        <div class="no-lessons">
          <p class="no-lessons-title">No lessons found</p>
          <p class="no-lessons-text">Try adjusting your search or category filters.</p>
        </div>
      `;
      if (statusEl) {
        statusEl.textContent = state.currentSearch ? `No results for "${state.currentSearch}"` : '';
      }
    } else {
      grid.innerHTML = filteredLessons.map(renderLessonCard).join('');
      if (statusEl) {
        const count = filteredLessons.length;
        statusEl.textContent = state.currentSearch ? `Showing ${count} result(s)` : '';
      }
    }

    // Update debug info
    if (window.updateDebugInfo) {
      window.updateDebugInfo({ lessonsCount: state.allLessons.length });
    }
  }

  function setupSearch() {
    const searchInput = document.getElementById('hero-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      state.currentSearch = e.target.value;
      updateDisplay();
    });

    // Allow Enter key to navigate if single result
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const filtered = filterLessons(state.currentSearch, state.currentCategory);
        if (filtered.length === 1) {
          const url = window.withBase ?
            window.withBase(`lessons/lesson.html?id=${encodeURIComponent(filtered[0].id)}`) :
            `lessons/lesson.html?id=${encodeURIComponent(filtered[0].id)}`;
          window.location.href = url;
        }
      }
    });
  }

  function setupChips() {
    const chipContainer = document.getElementById('chip-container');
    if (!chipContainer) return;

    const chips = chipContainer.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentCategory = chip.dataset.category || 'all';
        updateDisplay();
      });
    });
  }

  function setupCTA() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const url = window.withBase ? window.withBase('lessons/') : 'lessons/';
        window.location.href = url;
      });
    }
  }

  function loadCompletedLessons() {
    try {
      const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
      state.completedLessons = new Set(completed);
    } catch {
      state.completedLessons = new Set();
    }
  }

  function updateProgressCount() {
    const progressEl = document.getElementById('progress-count');
    if (progressEl) {
      progressEl.textContent = state.completedLessons.size;
    }
  }

  async function loadLessons() {
    // Use withBase() to get correct path for GitHub Pages
    const manifestUrl = window.withBase ? window.withBase('assets/lessons.json') : 'assets/lessons.json';
    
    try {
      console.log('[loadLessons] Fetching from:', manifestUrl);
      const res = await fetch(manifestUrl);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText} - Failed to load ${manifestUrl}`);
      }
      
      const data = await res.json();
      console.log('[loadLessons] Successfully loaded', (data.lessons || []).length, 'lessons');
      return data.lessons || [];
      
    } catch (error) {
      console.error('[loadLessons] Error:', error);
      
      // Update debug info
      if (window.updateDebugInfo) {
        window.updateDebugInfo({ 
          lastError: `${error.message}\n\nAttempted URL: ${manifestUrl}\nBase path: ${window.BASE_PATH || '(none)'}` 
        });
      }
      
      throw error;
    }
  }

  async function init() {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        const swUrl = window.withBase ? window.withBase('sw.js') : 'sw.js';
        navigator.serviceWorker.register(swUrl).catch((err) => {
          console.warn('[SW] Registration failed:', err);
        });
      }

      // Load data
      state.allLessons = await loadLessons();
      loadCompletedLessons();
      updateProgressCount();

      // Setup interactive elements
      setupSearch();
      setupChips();
      setupCTA();

      // Initial render
      updateDisplay();
      
    } catch (err) {
      console.error('[Init Error]', err);
      const grid = document.getElementById('lessons-grid');
      if (grid) {
        const offline = !navigator.onLine;
        const basePath = window.BASE_PATH || '(not set)';
        
        grid.innerHTML = `
          <div class="no-lessons">
            <p class="no-lessons-title">${offline ? 'Offline' : 'Error loading lessons'}</p>
            <p class="no-lessons-text">${offline ? 
              'You\'re offline. Reconnect to load lessons.' : 
              'Unable to load lessons. Please check your connection and try again.'
            }</p>
            ${!offline ? `
              <details style="margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.05); border-radius: 4px;">
                <summary style="cursor: pointer; font-weight: 600;">Technical Details</summary>
                <pre style="margin-top: 8px; font-size: 0.85em; white-space: pre-wrap; color: #666;">
Error: ${err.message}

Base Path: ${basePath}
Current Location: ${window.location.pathname}

Suggestion: Add ?debug=1 to the URL to see diagnostic info.
                </pre>
              </details>
            ` : ''}
          </div>
        `;
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Parent phone storage (for parents page)
  if (document.body.getAttribute('data-page') === 'parents') {
    const phoneInput = document.getElementById('parent-phone');
    if (phoneInput) {
      try {
        const saved = localStorage.getItem('parentPhone');
        if (saved) phoneInput.value = saved;
      } catch {}

      phoneInput.addEventListener('change', () => {
        try {
          localStorage.setItem('parentPhone', phoneInput.value || '');
        } catch {}
      });
    }
  }
})();
