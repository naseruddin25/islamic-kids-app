// ==========================================
// MAIN.JS - Filtering & Interaction Logic
// ==========================================

(function() {
  // Use the centralized base path helper
  const withBase = window.BasePath ? window.BasePath.withBase : (p) => p;
  
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
    
    // Determine correct link based on current page
    const currentPage = document.body.getAttribute('data-page');
    const lessonLink = currentPage === 'home' 
      ? withBase(`lessons/lesson.html?id=${encodeURIComponent(lesson.id)}`)
      : withBase(`lesson.html?id=${encodeURIComponent(lesson.id)}`);
    
    return `
      <a href="${lessonLink}" class="card">
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

    if (!grid) return; // Guard for pages without lessons grid

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
      const count = filteredLessons.length;
      if (statusEl) {
        statusEl.textContent = state.currentSearch ? `Showing ${count} result(s)` : '';
      }
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
          const currentPage = document.body.getAttribute('data-page');
          const lessonLink = currentPage === 'home'
            ? withBase(`lessons/lesson.html?id=${encodeURIComponent(filtered[0].id)}`)
            : withBase(`lesson.html?id=${encodeURIComponent(filtered[0].id)}`);
          window.location.href = lessonLink;
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
        window.location.href = withBase('lessons/');
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
    const lessonsUrl = withBase('assets/lessons.json');
    
    try {
      console.log(`[main.js] Fetching lessons from: ${lessonsUrl}`);
      const res = await fetch(lessonsUrl);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} when fetching ${lessonsUrl}`);
      }
      
      const data = await res.json();
      console.log(`[main.js] Successfully loaded ${(data.lessons || []).length} lessons`);
      
      return data.lessons || [];
    } catch (err) {
      console.error('[main.js] Failed to load lessons:', err);
      throw new Error(`Failed to load lessons from ${lessonsUrl}: ${err.message}`);
    }
  }

  async function init() {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        const swUrl = withBase('sw.js');
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
      
      // Debug logging
      if (window.BasePath && window.BasePath.isDebugMode()) {
        console.log('[main.js] Initialization complete');
        console.log('[main.js] Total lessons:', state.allLessons.length);
        console.log('[main.js] Completed lessons:', state.completedLessons.size);
      }
    } catch (err) {
      console.error('[main.js Init Error]', err);
      const grid = document.getElementById('lessons-grid');
      if (grid) {
        const errorDetails = window.BasePath ? `
          <details style="margin-top:12px;">
            <summary style="cursor:pointer;color:#666;">Technical details</summary>
            <pre style="margin-top:8px;font-size:0.85em;color:#666;white-space:pre-wrap;">Error: ${err.message}
Base Path: ${window.BasePath.getBase() || '(root)'}
Current Location: ${window.location.href}
Add ?debug=1 to URL for more details.</pre>
          </details>
        ` : '';
        
        grid.innerHTML = `
          <div class="no-lessons">
            <p class="no-lessons-title">Error loading lessons</p>
            <p class="no-lessons-text">Please refresh the page or check your connection.</p>
            ${errorDetails}
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
