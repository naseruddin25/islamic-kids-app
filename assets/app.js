/**
 * APP.JS - Lesson loading, quiz, and sharing logic with GitHub Pages support
 */

(function(){
  'use strict';

  const page = document.body.getAttribute('data-page');
  
  const state = {
    lessons: [],
    lastLessonId: null
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
    const manifestUrl = window.withBase ? 
      window.withBase('data/lessons.json') : 
      'data/lessons.json';
    
    try {
      console.log('[loadLessons] Fetching from:', manifestUrl);
      const res = await fetch(manifestUrl);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('[loadLessons] Loaded', (data.lessons || []).length, 'lessons');
      
      // Update debug info
      if (window.updateDebugInfo) {
        window.updateDebugInfo({ lessonsCount: (data.lessons || []).length });
      }
      
      return data.lessons || [];
      
    } catch (error) {
      console.error('[loadLessons] Error:', error);
      
      // Update debug info with error
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
    if(!id){
      document.getElementById('lesson-title').textContent = 'Lesson not found';
      document.getElementById('lesson-body').innerHTML = 'Missing lesson id. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      return;
    }
    const lesson = findLessonById(id);
    if(!lesson){
      document.getElementById('lesson-title').textContent = 'Lesson not found';
      document.getElementById('lesson-body').innerHTML = 'This lesson doesn\'t exist or hasn\'t loaded yet. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      return;
    }
    
    writeLastLesson(id);
    document.getElementById('lesson-title').textContent = `${lesson.number}. ${lesson.title}`;
    document.getElementById('lesson-meta').textContent = `${lesson.minutes} min • ${lesson.tags.join(', ')}`;
    // Try to load lesson content from a partial HTML if available
    const contentUrl = window.withBase ? window.withBase(`lessons/content/${lesson.id}.html`) : `lessons/content/${lesson.id}.html`;
    if (window.updateDebugInfo) {
      window.updateDebugInfo({ lessonId: id, contentUrl });
    }
    
    (async () => {
      try {
        const res = await fetch(contentUrl);
        if (res.ok) {
          const html = await res.text();
          document.getElementById('lesson-body').innerHTML = html;
        } else {
          document.getElementById('lesson-body').textContent = `This is a brief, friendly overview to introduce: ${lesson.title}.`;
        }
      } catch {
        document.getElementById('lesson-body').textContent = `This is a brief, friendly overview to introduce: ${lesson.title}.`;
      }
    })();

    const tagsEl = document.getElementById('lesson-tags');
    if (tagsEl) {
      tagsEl.innerHTML = (lesson.tags||[]).map(t => `<span class="chip">${t}</span>`).join('');
    }

    // Show and setup quiz
    const quizSection = document.getElementById('quiz-section');
    const quizEl = document.getElementById('quiz');
    const optionsEl = document.getElementById('quiz-options');
    const resultEl = document.getElementById('quiz-result');
    const submitBtn = document.getElementById('quiz-submit');
    const retryBtn = document.getElementById('quiz-retry');
    
    if (quizSection) quizSection.style.display = 'block';
    
    let quizScore = null; // null until answered
    const totalQuestions = 1;

    if (optionsEl) {
      optionsEl.innerHTML = [
        {id:'a', text:'A kind action'},
        {id:'b', text:'A harmful habit'},
        {id:'c', text:'A random guess'}
      ].map((o,i) => `
        <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition-fast);">
          <input type="radio" name="quiz" value="${o.id}" style="width: 20px; height: 20px; cursor: pointer;">
          <span style="font-size: var(--text-base);">${o.text}</span>
        </label>`).join('');
    }

    function showResult(ok){
      if (resultEl) {
        resultEl.classList.remove('hidden');
        resultEl.style.display = 'block';
        resultEl.textContent = ok ? '✓ Correct! Strong understanding. Well done.' : '✗ Review recommended. Think about the core concepts and try again.';
        resultEl.style.color = ok ? 'var(--color-primary)' : 'var(--color-secondary)';
      }
    }

    if (submitBtn) {
      submitBtn.onclick = () => {
        const chosen = (document.querySelector('input[name="quiz"]:checked')||{}).value;
        if(!chosen){ showResult(false); return; }
        const correct = chosen === 'a';
        showResult(correct);
        quizScore = correct ? 1 : 0;
        if (retryBtn) {
          retryBtn.classList.toggle('hidden', correct);
          retryBtn.style.display = correct ? 'none' : 'inline-block';
        }
        updateShareButtons();

        // Persist progress locally
        try {
          const completed = new Set(JSON.parse(localStorage.getItem('completedLessons')||'[]'));
          completed.add(lesson.id);
          localStorage.setItem('completedLessons', JSON.stringify(Array.from(completed)));
          const scores = JSON.parse(localStorage.getItem('lessonScores')||'{}');
          scores[lesson.id] = { score: quizScore, total: totalQuestions, ts: Date.now() };
          localStorage.setItem('lessonScores', JSON.stringify(scores));
        } catch {}
      };
    }

    if (retryBtn) {
      retryBtn.onclick = () => {
        if (resultEl) {
          resultEl.classList.add('hidden');
          resultEl.style.display = 'none';
        }
        (document.querySelector('input[name="quiz"]:checked')||{}).checked = false;
        retryBtn.classList.add('hidden');
        retryBtn.style.display = 'none';
        quizScore = null;
      };
    }

    const pointsEl = document.getElementById('lesson-points');
    if (pointsEl) {
      pointsEl.innerHTML = `
        <li>Read carefully and think critically</li>
        <li>Connect ideas to your daily life</li>
        <li>Discuss what you learned with someone you trust</li>`;
    }

    // Share buttons: Copy, Email, SMS, Web Share
    const btnCopy = document.getElementById('btn-copy');
    const btnEmail = document.getElementById('btn-email');
    const btnSms = document.getElementById('btn-sms');
    const btnShare = document.getElementById('btn-share');

    function isMobileLike(){
      const ua = (navigator.userAgent||'');
      const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer:coarse)').matches;
      return /Android|iPhone|iPad|iPod/i.test(ua) || coarse;
    }

    function buildResultsSummary({ lesson, score, total, chosen }){
      const num = lesson.number.toString().padStart(2,'0');
      const scoreLine = (score===null) ? `Score: —/${total}.` : `Score: ${score}/${total}.`;
      const prompt = 'One question to discuss: What stood out to you in this lesson?';
      return `Teen Deen — Lesson ${num}: ${lesson.title}\n${scoreLine}\n${prompt}`;
    }

    function buildEmailLink(summary){
      const subject = `Teen Deen — Lesson ${lesson.number} Results`;
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
      return mailto;
    }

    function buildSmsLink(text, phoneNullable){
      const ua = (navigator.userAgent||'');
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const num = phoneNullable ? `sms:${phoneNullable}` : 'sms:';
      const sep = isIOS ? '&' : '?';
      return `${num}${sep}body=${encodeURIComponent(text)}`;
    }

    async function shareCopy(summary){
      try {
        if(navigator.clipboard && navigator.clipboard.writeText){
          await navigator.clipboard.writeText(summary);
          alert('Results copied. You can paste them into any app.');
        } else {
          const ok = window.confirm('Copy not available. Click OK to see the text, then copy manually.');
          if(ok) alert(summary);
        }
      } catch {
        alert('Unable to copy. Please select and copy manually.');
      }
    }

    function updateShareButtons(){
      const chosen = (document.querySelector('input[name="quiz"]:checked')||{}).value || null;
      const summary = buildResultsSummary({ lesson, score: quizScore, total: totalQuestions, chosen });

      // Email
      const emailLink = buildEmailLink(summary);
      btnEmail.onclick = () => { location.href = emailLink; };

      // Copy
      btnCopy.onclick = () => { shareCopy(summary); };

      // SMS (conditional show)
      const showSms = isMobileLike();
      btnSms.classList.toggle('hidden', !showSms);
      const storedPhone = (()=>{ try { return localStorage.getItem('parentPhone'); } catch { return null; } })();
      const smsLink = buildSmsLink(summary, storedPhone || null);
      btnSms.onclick = () => {
        try {
          location.href = smsLink;
        } catch {
          alert('Your device may not support Text sharing. Please use Copy Results.');
        }
      };

      // Web Share API
      if(btnShare){
        const hasWebShare = !!navigator.share;
        btnShare.classList.toggle('hidden', !hasWebShare);
        if(hasWebShare){
          btnShare.onclick = async () => {
            try {
              await navigator.share({ title: 'Teen Deen', text: summary, url: location.href });
            } catch {
              shareCopy(summary);
            }
          };
        }
      }
    }

    // Initialize share buttons immediately (before answering)
    updateShareButtons();
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
        renderLesson();
      }
      
      // Update progress count on parents page
      if(page === 'parents'){
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
      const errorMsg = err.message || 'Unknown error';
      const basePath = window.BASE_PATH || '(not set)';
      
      if(page === 'lesson'){
        document.getElementById('lesson-title').textContent = offline ? 'Offline' : 'Error loading lesson';
        document.getElementById('lesson-body').innerHTML = offline ? 
          'You\'re offline. Reconnect to load this lesson. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>' : 
          `
            <p>Unable to load lesson content.</p>
            <details style="margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.05); border-radius: 4px;">
              <summary style="cursor: pointer; font-weight: 600;">Technical Details</summary>
              <pre style="margin-top: 8px; font-size: 0.85em; white-space: pre-wrap; color: #666;">
Error: ${errorMsg}

Base Path: ${basePath}
Current Location: ${window.location.pathname}

Suggestion: Add ?debug=1 to the URL to see diagnostic overlay.
              </pre>
            </details>
            <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>
          `;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
