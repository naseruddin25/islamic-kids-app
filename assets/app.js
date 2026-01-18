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
    // Ensure we have the correct path
    let manifestUrl;
    if (window.withBase && typeof window.withBase === 'function') {
      manifestUrl = window.withBase('data/lessons.json');
    } else {
      // Fallback: construct URL manually
      const base = window.BASE_PATH || '/islamic-kids-app';
      manifestUrl = `${base}/data/lessons.json`;
    }
    
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
    const optionsEl = document.getElementById('quiz-options');
    const resultEl = document.getElementById('quiz-result');
    const submitBtn = document.getElementById('quiz-submit');
    const retryBtn = document.getElementById('quiz-retry');

    if (quizSection) quizSection.style.display = 'block';

    let quizScore = null; // null until answered
    let totalQuestions = 1;

    // Custom multi-question quiz for Lesson 1 (intentions)
    let questions = null;
    if (lesson.id === 'lesson-01') {
      questions = [
        {
          q: 'Q1. What makes an action count with Allah?',
          choices: [
            { val: 'A', text: 'How hard it looks' },
            { val: 'B', text: 'Who sees it' },
            { val: 'C', text: 'The intention behind it' },
            { val: 'D', text: 'How many people do it' }
          ],
          correct: 'C',
          explain: 'Actions are judged by intentions; Allah rewards sincerity.'
        },
        {
          q: 'Q2. If someone prays mainly to impress others, what’s the main problem?',
          choices: [
            { val: 'A', text: 'Prayer is always wrong' },
            { val: 'B', text: 'Their intention is not for Allah' },
            { val: 'C', text: 'They prayed at the wrong time' },
            { val: 'D', text: 'They didn’t pray long enough' }
          ],
          correct: 'B',
          explain: 'Worship should be for Allah, not for people’s approval.'
        },
        {
          q: 'Q3. Why did many scholars start their books with the teaching about intentions?',
          choices: [
            { val: 'A', text: 'It’s the easiest topic' },
            { val: 'B', text: 'It reminds people that “why” matters before “what”' },
            { val: 'C', text: 'It’s only for beginners' },
            { val: 'D', text: 'It’s a history lesson' }
          ],
          correct: 'B',
          explain: 'It sets the foundation: sincerity comes first.'
        },
        {
          q: 'Q4. Which is the best example of a sincere intention?',
          choices: [
            { val: 'A', text: 'Donating so people praise you' },
            { val: 'B', text: 'Helping someone so you can post it' },
            { val: 'C', text: 'Studying Islam to get closer to Allah' },
            { val: 'D', text: 'Praying because your friends are watching' }
          ],
          correct: 'C',
          explain: 'The key is doing it to please Allah, not people.'
        },
        {
          q: 'Q5. What’s a simple habit to improve sincerity?',
          choices: [
            { val: 'A', text: 'Never do good deeds in public' },
            { val: 'B', text: 'Check your intention before and during the action' },
            { val: 'C', text: 'Tell everyone your goals' },
            { val: 'D', text: 'Only do big actions' }
          ],
          correct: 'B',
          explain: 'Quick self-check keeps your heart aligned.'
        },
      ];
      totalQuestions = questions.length;
    }

    if (optionsEl) {
      if (questions) {
        // Render multi-question quiz
        optionsEl.innerHTML = questions.map((q, i) => {
          const name = `quiz-q${i+1}`;
          return `
            <div class="quiz-block" style="margin-bottom: 12px;">
              <div style="font-weight: 700; margin-bottom: 8px;">${q.q}</div>
              ${q.choices.map(c => `
                <label style="display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer;">
                  <input type="radio" name="${name}" value="${c.val}" style="width: 20px; height: 20px; cursor: pointer;">
                  <span>${c.val}) ${c.text}</span>
                </label>
              `).join('')}
              <div id="feedback-${i+1}" class="hidden" style="margin-top: 8px; font-size: 0.95em; color: var(--color-text-muted);"></div>
            </div>
          `;
        }).join('');
      } else {
        // Fallback single-question quiz for other lessons
        totalQuestions = 1;
        optionsEl.innerHTML = [
          {id:'a', text:'A kind action'},
          {id:'b', text:'A harmful habit'},
          {id:'c', text:'A random guess'}
        ].map((o) => `
          <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition-fast);">
            <input type="radio" name="quiz" value="${o.id}" style="width: 20px; height: 20px; cursor: pointer;">
            <span style="font-size: var(--text-base);">${o.text}</span>
          </label>`).join('');
      }
    }

    function showOverallResultText(score, total){
      if (!resultEl) return;
      resultEl.classList.remove('hidden');
      resultEl.style.display = 'block';
      const ok = score === total;
      resultEl.textContent = `Score: ${score}/${total} ${ok ? '✓ Great job — fully correct.' : 'Keep going — review the explanations and try again.'}`;
      resultEl.style.color = ok ? 'var(--color-primary)' : 'var(--color-secondary)';
    }

    if (submitBtn) {
      submitBtn.onclick = () => {
        // Multi-question path
        if (questions) {
          let answeredAll = true;
          let score = 0;
          questions.forEach((q, i) => {
            const value = (document.querySelector(`input[name=quiz-q${i+1}]:checked`)||{}).value;
            const fb = document.getElementById(`feedback-${i+1}`);
            if (!value) { answeredAll = false; if (fb){ fb.classList.add('hidden'); fb.style.display='none'; } return; }
            const correct = value === q.correct;
            if (correct) score++;
            if (fb) {
              fb.classList.remove('hidden');
              fb.style.display = 'block';
              fb.textContent = (correct ? '✓ Correct — ' : '✗ Not quite — ') + q.explain;
              fb.style.color = correct ? 'var(--color-primary)' : 'var(--color-secondary)';
            }
          });
          if (!answeredAll) {
            if (resultEl) {
              resultEl.classList.remove('hidden');
              resultEl.style.display = 'block';
              resultEl.textContent = 'Please answer all questions before submitting.';
              resultEl.style.color = 'var(--color-secondary)';
            }
            return;
          }
          quizScore = score;
          showOverallResultText(score, totalQuestions);
          if (retryBtn) { retryBtn.classList.remove('hidden'); retryBtn.style.display = 'inline-block'; }
          updateShareButtons();

          // Persist progress locally
          try {
            const completed = new Set(JSON.parse(localStorage.getItem('completedLessons')||'[]'));
            completed.add(lesson.id);
            localStorage.setItem('completedLessons', JSON.stringify(Array.from(completed)));
            const scores = JSON.parse(localStorage.getItem('lessonScores')||'{}');
            scores[lesson.id] = { score: quizScore, total: totalQuestions, ts: Date.now() };
            localStorage.setItem('lessonScores', JSON.stringify(scores));
            // Dedicated key for lesson-01
            try { localStorage.setItem('teenDeen.lesson-01.score', String(quizScore)); } catch {}
          } catch {}
          return;
        }

        // Fallback single-question path
        const chosen = (document.querySelector('input[name="quiz"]:checked')||{}).value;
        if(!chosen){ if (resultEl){ resultEl.classList.remove('hidden'); resultEl.style.display='block'; resultEl.textContent='Please choose an option.'; resultEl.style.color='var(--color-secondary)'; } return; }
        const correct = chosen === 'a';
        quizScore = correct ? 1 : 0;
        showOverallResultText(quizScore, 1);
        if (retryBtn) { retryBtn.classList.toggle('hidden', correct); retryBtn.style.display = correct ? 'none' : 'inline-block'; }
        updateShareButtons();
        try {
          const completed = new Set(JSON.parse(localStorage.getItem('completedLessons')||'[]'));
          completed.add(lesson.id);
          localStorage.setItem('completedLessons', JSON.stringify(Array.from(completed)));
          const scores = JSON.parse(localStorage.getItem('lessonScores')||'{}');
          scores[lesson.id] = { score: quizScore, total: 1, ts: Date.now() };
          localStorage.setItem('lessonScores', JSON.stringify(scores));
        } catch {}
      };
    }

    if (retryBtn) {
      retryBtn.onclick = () => {
        if (resultEl) { resultEl.classList.add('hidden'); resultEl.style.display = 'none'; }
        // Clear selections and feedback
        if (questions) {
          questions.forEach((q, i) => {
            const checked = document.querySelector(`input[name=quiz-q${i+1}]:checked`);
            if (checked) checked.checked = false;
            const fb = document.getElementById(`feedback-${i+1}`);
            if (fb) { fb.classList.add('hidden'); fb.style.display = 'none'; fb.textContent = ''; }
          });
        } else {
          (document.querySelector('input[name="quiz"]:checked')||{}).checked = false;
        }
        retryBtn.classList.add('hidden');
        retryBtn.style.display = 'none';
        quizScore = null;
      };
    }

    const pointsEl = document.getElementById('lesson-points');
    if (pointsEl) {
      // Custom key takeaways for Lesson 1
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
      // Include key takeaways in summary
      let takeaways = '';
      const liNodes = document.querySelectorAll('#lesson-points li');
      if (liNodes && liNodes.length) {
        takeaways = '\nKey Takeaways:' + Array.from(liNodes).map(li => `\n- ${li.textContent.trim()}`).join('');
      }
      return `Teen Deen — Lesson ${num}: ${lesson.title}\n${scoreLine}${takeaways}\n\n${prompt}`;
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
