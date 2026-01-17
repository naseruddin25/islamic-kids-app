(function(){
  const page = document.body.getAttribute('data-page');
  const ASSET_PREFIX = (page === 'lessons' || page === 'lesson') ? '../' : '';
  const LESSONS_URL = ASSET_PREFIX + 'assets/lessons.json';
  const SW_URL = ASSET_PREFIX + 'sw.js';

  const state = {
    lessons: [],
    lastLessonId: null
  };

  const readLastLesson = () => {
    try { return localStorage.getItem('lastLessonId'); } catch { return null; }
  };
  const writeLastLesson = (id) => { try { localStorage.setItem('lastLessonId', id); } catch {} };

  async function loadLessons(){
    try {
      const res = await fetch(LESSONS_URL);
      if(!res.ok) throw new Error('Failed to load lessons');
      const data = await res.json();
      return data.lessons || [];
    } catch(e) {
      // Fallback: try alternate path
      const altPath = ASSET_PREFIX ? 'assets/lessons.json' : '../assets/lessons.json';
      const res = await fetch(altPath);
      if(!res.ok) throw new Error('Failed to load lessons from fallback path');
      const data = await res.json();
      return data.lessons || [];
    }
  }

  function renderFeatured(container){
    const featured = state.lessons.slice(0, 3);
    container.innerHTML = featured.map(l => `
      <a class="card" href="lessons/lesson.html?id=${encodeURIComponent(l.id)}">
        <div class="badge">Lesson ${l.number}</div>
        <h3>${l.title}</h3>
        <p class="meta">${l.minutes} min • ${l.tags.join(', ')}</p>
      </a>
    `).join('');
  }

  function filterLessons(query){
    const q = (query||'').trim().toLowerCase();
    if(!q) return state.lessons;
    return state.lessons.filter(l =>
      String(l.number).includes(q) ||
      l.title.toLowerCase().includes(q) ||
      (l.tags||[]).some(t => t.toLowerCase().includes(q))
    );
  }

  function renderLessonsList(container, statusEl, query){
    const list = filterLessons(query);
    statusEl.textContent = query ? `Showing ${list.length} result(s) for "${query}"` : '';
    if(list.length === 0){
      container.innerHTML = `
        <div class="card error-card">
          <strong>No lessons found</strong>
          <p>Try a different search term or browse all lessons.</p>
        </div>`;
      return;
    }
    container.innerHTML = list.map(l => `
      <a class="card" href="lesson.html?id=${encodeURIComponent(l.id)}">
        <div class="badge">Lesson ${l.number}</div>
        <h3>${l.title}</h3>
        <p class="meta">${l.minutes} min • ${l.tags.join(', ')}</p>
      </a>
    `).join('');
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
    document.getElementById('lesson-body').textContent = `This is a brief, friendly overview to introduce: ${lesson.title}.`;

    const tagsEl = document.getElementById('lesson-tags');
    tagsEl.innerHTML = (lesson.tags||[]).map(t => `<span class="chip">${t}</span>`).join('');

    // Simple quiz stub
    const quizEl = document.getElementById('quiz');
    const optionsEl = document.getElementById('quiz-options');
    const resultEl = document.getElementById('quiz-result');
    const submitBtn = document.getElementById('quiz-submit');
    const retryBtn = document.getElementById('quiz-retry');
    let quizScore = null; // null until answered
    const totalQuestions = 1;

    quizEl.classList.remove('hidden');
    optionsEl.innerHTML = [
      {id:'a', text:'A kind action'},
      {id:'b', text:'A harmful habit'},
      {id:'c', text:'A random guess'}
    ].map((o,i) => `
      <label>
        <input type="radio" name="quiz" value="${o.id}">
        <span>${o.text}</span>
      </label>`).join('');

    function showResult(ok){
      resultEl.classList.remove('hidden');
      resultEl.textContent = ok ? 'Nice! That’s a gentle, thoughtful choice.' : 'Almost! Try again and think about kindness and sincerity.';
    }

    submitBtn.onclick = () => {
      const chosen = (document.querySelector('input[name="quiz"]:checked')||{}).value;
      if(!chosen){ showResult(false); return; }
      const correct = chosen === 'a';
      showResult(correct);
      quizScore = correct ? 1 : 0;
      retryBtn.classList.toggle('hidden', correct);
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

    retryBtn.onclick = () => {
      resultEl.classList.add('hidden');
      (document.querySelector('input[name="quiz"]:checked')||{}).checked = false;
      retryBtn.classList.add('hidden');
      quizScore = null;
    };

    const pointsEl = document.getElementById('lesson-points');
    pointsEl.innerHTML = `
      <li>Keep lessons short and positive</li>
      <li>Ask how the topic shows up in daily life</li>
      <li>Celebrate effort and kindness</li>`;

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
      const prompt = 'Ask me: What’s one thing I learned today?';
      // Keep under ~320 chars
      return `Islamic Kids App — Lesson ${num}: ${lesson.title}\n${scoreLine}\n${prompt}`;
    }

    function buildEmailLink(summary){
      const subject = `Islamic Kids App — Lesson ${lesson.number} Results`;
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
      return mailto;
    }

    function buildSmsLink(text, phoneNullable){
      const ua = (navigator.userAgent||'');
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const num = phoneNullable ? `sms:${phoneNullable}` : 'sms:';
      // iOS prefers &body, Android prefers ?body
      const sep = isIOS ? '&' : '?';
      return `${num}${sep}body=${encodeURIComponent(text)}`;
    }

    async function shareCopy(summary){
      try {
        if(navigator.clipboard && navigator.clipboard.writeText){
          await navigator.clipboard.writeText(summary);
          alert('Results copied. You can paste them into any app.');
        } else {
          // Fallback
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
              await navigator.share({ title: 'Islamic Kids App', text: summary, url: location.href });
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

  function onSearch(inputEl, navigate){
    inputEl.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter') navigate(inputEl.value);
    });
    inputEl.addEventListener('change', ()=> navigate(inputEl.value));
  }

  function init(){
    // Register service worker (best-effort)
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register(SW_URL).catch(()=>{});
    }
    state.lastLessonId = readLastLesson();
    loadLessons().then(ls => {
      state.lessons = ls;
      if(page === 'home'){
        const featuredEl = document.getElementById('home-featured');
        renderFeatured(featuredEl);
        const resumeBtn = document.getElementById('cta-resume');
        if(state.lastLessonId){
          resumeBtn.classList.remove('hidden');
          resumeBtn.href = `lessons/lesson.html?id=${encodeURIComponent(state.lastLessonId)}`;
        }
        const homeSearch = document.getElementById('home-search');
        onSearch(homeSearch, (q)=>{
          location.href = `lessons/?q=${encodeURIComponent(q)}`;
        });
        // Progress panel
        const progressCountEl = document.getElementById('progress-count');
        if(progressCountEl){
          try {
            const completed = JSON.parse(localStorage.getItem('completedLessons')||'[]');
            progressCountEl.textContent = completed.length;
          } catch { progressCountEl.textContent = '0'; }
        }
      }
      if(page === 'lessons'){
        const statusEl = document.getElementById('lessons-status');
        const listEl = document.getElementById('lesson-list');
        const { q } = getQuery();
        // Show loading state initially
        listEl.innerHTML = '<div class="card"><strong>Loading lessons…</strong><p class="small">Please wait a moment.</p></div>';
        renderLessonsList(listEl, statusEl, q);
        const input = document.getElementById('lessons-search');
        input.value = q || '';
        onSearch(input, (val)=>{
          renderLessonsList(listEl, statusEl, val);
          const params = new URLSearchParams(location.search);
          if(val) params.set('q', val); else params.delete('q');
          const url = `${location.pathname}?${params.toString()}`;
          history.replaceState(null, '', url);
        });
      }
      if(page === 'lesson'){
        renderLesson();
      }
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
      console.error(err);
      const offline = !navigator.onLine;
      if(page === 'home'){
        const featuredEl = document.getElementById('home-featured');
        featuredEl.innerHTML = `<div class="card error-card"><strong>${offline?'Offline':'Oops'}</strong><p>${offline?'You’re offline. Already opened content is available. Reconnect to load new lessons.':'Couldn’t load lessons right now. Please refresh.'}</p></div>`;
      }
      if(page === 'lessons'){
        const statusEl = document.getElementById('lessons-status');
        const listEl = document.getElementById('lesson-list');
        statusEl.textContent = '';
        listEl.innerHTML = `<div class="card error-card"><strong>${offline?'Offline':'Oops'}</strong><p>${offline?'You’re offline. Already opened content is available. Reconnect to load new lessons.':'Couldn’t load lessons right now. Please refresh.'}</p></div>`;
      }
      if(page === 'lesson'){
        document.getElementById('lesson-title').textContent = offline?'Offline':'Something went wrong';
        document.getElementById('lesson-body').innerHTML = offline?'You\'re offline. Reconnect to load lesson content. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>':'Couldn\'t load lesson data. <a href="./" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
