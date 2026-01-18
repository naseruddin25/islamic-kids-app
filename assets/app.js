/**
 * APP.JS - Enhanced lesson loading with progress tracking and interactive features
 */

(function(){
  'use strict';

  if (window.__teenDeenAppInit) return;
  window.__teenDeenAppInit = true;

  const page = document.body.getAttribute('data-page');
  
  const state = {
    lessons: [],
    lastLessonId: null,
    currentLesson: null
  };

  const readLastLesson = () => {
    try { return localStorage.getItem('lastLessonId'); } catch { return null; }
  };
  
  const writeLastLesson = (id) => { 
    try { localStorage.setItem('lastLessonId', id); } catch {} 
  };

  /**
   * Load lessons manifest using base path resolver
   */
  async function loadLessons() {
    let manifestUrl;
    if (window.withBase && typeof window.withBase === 'function') {
      manifestUrl = window.withBase('data/lessons.json');
    } else {
      const base = window.BASE_PATH || '/islamic-kids-app';
      manifestUrl = `${base}/data/lessons.json`;
    }
    
    try {
      console.log('[loadLessons] Fetching from:', manifestUrl);
      const res = await fetch(manifestUrl, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('[loadLessons] Loaded', (data.lessons || []).length, 'lessons');
      
      if (window.updateDebugInfo) {
        window.updateDebugInfo({ lessonsCount: (data.lessons || []).length });
      }
      
      return data.lessons || [];
      
    } catch (error) {
      console.error('[loadLessons] Error:', error);
      
      if (window.updateDebugInfo) {
        window.updateDebugInfo({ 
          lastError: `${error.message}\n\nAttempted URL: ${manifestUrl}\nBase path: ${window.BASE_PATH || '(none)'}` 
        });
      }
      
      throw new Error(`Failed to load lessons from ${manifestUrl}: ${error.message}`);
    }
  }

  function findLessonById(id){
    return state.lessons.find(l => l.id === id);
  }

  function getQuery(){
    const params = new URLSearchParams(location.search);
    return {
      id: params.get('id') || undefined,
      q: params.get('q') || ''
    };
  }

  function renderLesson(){
    const { id } = getQuery();
    console.log('[renderLesson] Attempting to load lesson id:', id);
    
    if(!id){
      document.getElementById('lesson-title').textContent = 'Lesson not found';
      document.getElementById('lesson-body').innerHTML = 'Missing lesson id. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      return;
    }
    const lesson = findLessonById(id);
    if(!lesson){
      console.error('[renderLesson] Lesson not found in manifest:', id);
      document.getElementById('lesson-title').textContent = 'Lesson not found';
      document.getElementById('lesson-body').innerHTML = 'This lesson doesn\'t exist or hasn\'t loaded yet. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      return;
    }
    
    state.currentLesson = lesson;
    console.log('[renderLesson] Rendering lesson:', lesson.title);
    
    writeLastLesson(id);
    document.getElementById('lesson-title').textContent = `${lesson.number}. ${lesson.title}`;
    document.getElementById('lesson-meta').textContent = `${lesson.minutes} min • ${lesson.tags.join(', ')}`;
    
    // Build content URL with fallback
    let contentUrl;
    if (window.withBase && typeof window.withBase === 'function') {
      contentUrl = window.withBase(`lessons/content/${lesson.id}.html`);
    } else {
      const base = window.BASE_PATH || '/islamic-kids-app';
      contentUrl = `${base}/lessons/content/${lesson.id}.html`;
    }
    
    console.log('[renderLesson] Content URL:', contentUrl);
    
    if (window.updateDebugInfo) {
      window.updateDebugInfo({ lessonId: id, contentUrl });
    }
    
    // Load lesson content
    (async () => {
      try {
        const res = await fetch(contentUrl, { cache: 'no-store' });
        if (res.ok) {
          const html = await res.text();
          document.getElementById('lesson-body').innerHTML = html;
          
          // Initialize TTS after content loads
          if (window.TeenDeenTTS) {
            setTimeout(() => {
              const initialized = window.TeenDeenTTS.initialize('.lesson-content');
              if (initialized && document.getElementById('tts-container')) {
                window.TeenDeenTTS.renderControls('#tts-container');
              }
            }, 500);
          }
        } else {
          document.getElementById('lesson-body').textContent = `This is a brief, friendly overview to introduce: ${lesson.title}.`;
        }
      } catch (err) {
        console.warn('[Content] Load error:', err);
        document.getElementById('lesson-body').textContent = `This is a brief, friendly overview to introduce: ${lesson.title}.`;
      }
    })();

    const tagsEl = document.getElementById('lesson-tags');
    if (tagsEl) {
      tagsEl.innerHTML = (lesson.tags||[]).map(t => `<span class="chip">${t}</span>`).join('');
    }

    // Setup quiz - but give interactive scripts a chance to run first
    setTimeout(() => {
      setupQuiz(lesson);
    }, 100);

    // Setup reflection section for lesson-01
    setupReflectionSection(lesson);

    // Setup key takeaways
    const pointsEl = document.getElementById('lesson-points');
    if (pointsEl) {
      if (lesson.id === 'lesson-01') {
        pointsEl.innerHTML = `
          <li>Actions are judged by intentions — sincerity matters most.</li>
          <li>Do good for Allah, not for likes or attention.</li>
          <li>Build the habit of checking your intention before and during any deed.</li>`;
      } else {
        pointsEl.innerHTML = `
          <li>Read carefully and think critically</li>
          <li>Connect ideas to your daily life</li>
          <li>Discuss what you learned with someone you trust</li>`;
      }
    }
  }

  function setupReflectionSection(lesson) {
    const reflectSection = document.getElementById('reflect-section');
    if (!reflectSection) return;

    // Show reflection section for lesson-01
    if (lesson.id === 'lesson-01') {
      reflectSection.style.display = 'block';
      console.log('[Reflection] Section enabled for lesson-01');
    } else {
      reflectSection.style.display = 'none';
    }
  }

  function setupQuiz(lesson) {
    const quizSection = document.getElementById('quiz-section');
    const optionsEl = document.getElementById('quiz-options');
    const resultEl = document.getElementById('quiz-result');
    const submitBtn = document.getElementById('quiz-submit');
    const retryBtn = document.getElementById('quiz-retry');

    // Always show quiz section
    if (quizSection) quizSection.style.display = 'block';

    let quizScore = null;
    let totalQuestions = 1;

    if (optionsEl) {
      // Check if lesson-01 interactive script already handled the quiz
      if (lesson.id === 'lesson-01') {
        // Check if the interactive script has already rendered content
        if (optionsEl.children.length > 0 && 
            !optionsEl.innerHTML.includes('Loading interactive quiz')) {
          console.log('[Quiz] Interactive quiz already rendered for lesson-01');
          return;
        }
        
        // If not, show a better loading message and let interactive script take over
        totalQuestions = 5;
        optionsEl.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--color-text-muted);">
            <div style="font-size: 2em; margin-bottom: 16px;">📝</div>
            <p style="font-style: italic; margin-bottom: 8px;">Loading interactive quiz...</p>
            <p style="font-size: 0.9em;">If this takes more than a few seconds, try refreshing the page.</p>
          </div>
        `;
        console.log('[Quiz] Waiting for interactive script to render lesson-01 quiz');
        return;
      } else {
        totalQuestions = 1;
        optionsEl.innerHTML = [
          {id:'a', text:'A kind action'},
          {id:'b', text:'A harmful habit'},
          {id:'c', text:'A random guess'}
        ].map((o) => `
          <label class="quiz-choice-label">
            <input type="radio" name="quiz" value="${o.id}" style="width: 20px; height: 20px; cursor: pointer; margin: 0; flex-shrink: 0;">
            <span style="font-size: var(--text-base);">${o.text}</span>
          </label>`).join('');
      }
    }

    function showResult(score, total){
      if (!resultEl) return;
      resultEl.classList.remove('hidden');
      resultEl.style.display = 'block';
      const ok = score === total;
      resultEl.textContent = `Score: ${score}/${total} ${ok ? '✓ Great job — fully correct.' : 'Keep going — review the lesson and try again.'}`;
      resultEl.style.color = ok ? 'var(--color-primary)' : 'var(--color-secondary)';
    }

    if (submitBtn) {
      submitBtn.onclick = () => {
        const chosen = (document.querySelector('input[name="quiz"]:checked')||{}).value;
        if(!chosen){ 
          if (resultEl){ 
            resultEl.classList.remove('hidden'); 
            resultEl.style.display='block'; 
            resultEl.textContent='Please choose an option.'; 
            resultEl.style.color='var(--color-secondary)'; 
          } 
          return; 
        }
        
        const correct = chosen === 'a';
        quizScore = correct ? 1 : 0;
        showResult(quizScore, 1);
        
        if (retryBtn) { 
          retryBtn.classList.toggle('hidden', correct); 
          retryBtn.style.display = correct ? 'none' : 'inline-block'; 
        }
        
        // Save to legacy storage
        try {
          const completed = new Set(JSON.parse(localStorage.getItem('completedLessons')||'[]'));
          completed.add(lesson.id);
          localStorage.setItem('completedLessons', JSON.stringify(Array.from(completed)));
          const scores = JSON.parse(localStorage.getItem('lessonScores')||'{}');
          scores[lesson.id] = { score: quizScore, total: 1, ts: Date.now() };
          localStorage.setItem('lessonScores', JSON.stringify(scores));
        } catch {}

        // Update progress tracking
        if (window.TeenDeenProgress) {
          window.TeenDeenProgress.completeLesson(lesson.id, quizScore, totalQuestions);
        }

        // Celebrate if passed
        if (correct && window.TeenDeenConfetti) {
          setTimeout(() => window.TeenDeenConfetti.celebrate(), 300);
        }

        // Show certificate if passed
        if (quizScore === 1 && window.TeenDeenCertificate) {
          try {
            const passed = window.TeenDeenCertificate.checkIfPassed(lesson.id, quizScore, 1);
            if (passed) {
              window.TeenDeenCertificate.renderCertificatePanel({
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                score: quizScore,
                total: 1,
                passed: true
              });
            }
          } catch (certErr) {
            console.warn('[Certificate] Error:', certErr);
          }
        }
      };
    }

    if (retryBtn) {
      retryBtn.onclick = () => {
        if (resultEl) { 
          resultEl.classList.add('hidden'); 
          resultEl.style.display = 'none'; 
        }
        const checked = document.querySelector('input[name="quiz"]:checked');
        if (checked) checked.checked = false;
        retryBtn.classList.add('hidden');
        retryBtn.style.display = 'none';
        quizScore = null;
      };
    }
  }

  function init(){
    // Register service worker
    if('serviceWorker' in navigator){
      const swUrl = window.withBase ? window.withBase('sw.js') : 'sw.js';
      navigator.serviceWorker.register(swUrl).catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
    }
    
    state.lastLessonId = readLastLesson();
    
    loadLessons().then(ls => {
      state.lessons = ls;
      
      if(page === 'lesson'){
        try {
          renderLesson();
        } catch (err) {
          console.error('[renderLesson] Error:', err);
          const lessonTitle = document.getElementById('lesson-title');
          const lessonBody = document.getElementById('lesson-body');
          if (lessonTitle) lessonTitle.textContent = 'Error rendering lesson';
          if (lessonBody) lessonBody.innerHTML = `<p>An error occurred while loading the lesson.</p><p><strong>${err.message}</strong></p><a href="./" class="cta-btn" style="display: inline-block; margin-top: 12px;">Back to Lessons</a>`;
        }
      }
      
      // Update progress count on home/parents page
      if(page === 'home' || page === 'parents'){
        if (window.TeenDeenProgress) {
          const stats = window.TeenDeenProgress.getStats();
          const progressCount = document.getElementById('progress-count');
          if (progressCount) {
            progressCount.textContent = stats.completedCount;
          }
        }
        
        const input = document.getElementById('parent-phone');
        if(input){
          try {
            const prev = localStorage.getItem('parentPhone');
            if(prev) input.value = prev;
          } catch {}
          input.addEventListener('change', ()=>{
            const val = input.value.trim();
            try { localStorage.setItem('parentPhone', val || ''); } catch {}
          });
        }
      }
      
    }).catch(err => {
      console.error('[loadLessons error]', err);
      const offline = !navigator.onLine;
      
      if (offline) {
        console.warn('[init] Device is offline. Service worker may still provide cached content.');
      }
      
      if (page !== 'lesson') {
        const errorMsg = err.message || 'Unknown error';
        console.error(`Could not load lessons: ${errorMsg}`);
      }
    });
  }

  // Listen for badge events
  window.addEventListener('teendeen:badge-earned', (e) => {
    console.log('[Badge] Earned:', e.detail);
    if (window.TeenDeenConfetti) {
      window.TeenDeenConfetti.celebrate();
    }
    // Could show toast notification here
  });

  // Start the app when DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
