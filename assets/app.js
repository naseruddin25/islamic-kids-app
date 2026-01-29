/**
 * APP.JS - Enhanced lesson loading with progress tracking and interactive features
 * 
 * IMPORTANT: Quiz rendering is handled by assets/quiz.js (TeenDeenQuiz)
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

  // Lesson audio mapping - supports male/female narrators
  const lessonAudio = {
    'lesson-01': {
      male: 'lesson-01-intentions-male.mp3',
      female: 'lesson-01-intentions-female.mp3'
    },
    'lesson-02': {
      male: 'lesson-02-importance-of-knowlege-male.mp3',
      female: 'lesson-02-importance-of-knowlege-female.mp3'
    },
    'lesson-03': {
      male: 'lesson-03-islamic-belief-male.mp3',
      female: 'lesson-03-islamic-belief-female.mp3'
    }
    // Add more lessons here as needed
  };

  const readLastLesson = () => {
    try { return localStorage.getItem('lastLessonId'); } catch { return null; }
  };
  
  const writeLastLesson = (id) => { 
    try { localStorage.setItem('lastLessonId', id); } catch {} 
  };

  async function loadLessons() {
    // Get base path - support both withBase function and manual path construction
    let manifestUrl;
    if (window.withBase && typeof window.withBase === 'function') {
      manifestUrl = window.withBase('data/lessons.json');
    } else {
      // Fallback: detect GitHub Pages path from window.location
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const base = pathSegments[0] === 'islamic-kids-app' ? '/islamic-kids-app' : '';
      manifestUrl = `${base}/data/lessons.json`;
    }
    
    try {
      console.log('[loadLessons] Fetching from:', manifestUrl);
      const res = await fetch(manifestUrl, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Validate lessons data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid lessons data format');
      }
      
      const lessons = data.lessons || [];
      
      if (!Array.isArray(lessons)) {
        throw new Error('Lessons data is not an array');
      }
      
      console.log('[loadLessons] Loaded', lessons.length, 'lessons');
      
      if (window.updateDebugInfo) {
        window.updateDebugInfo({ lessonsCount: lessons.length });
      }
      
      return lessons;
      
    } catch (error) {
      console.error('[loadLessons] Error:', error);
      
      if (window.updateDebugInfo) {
        window.updateDebugInfo({ 
          lastError: `${error.message}\n\nAttempted URL: ${manifestUrl}\nBase path: ${window.BASE_PATH || '(auto-detected)'}` 
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

  function renderAudioPlayer(lessonId) {
    const audioConfig = lessonAudio[lessonId];
    const audioContainer = document.getElementById('audio-player-container');
    
    if (!audioContainer || !audioConfig) {
      console.log('[Audio] No audio configured for lesson:', lessonId);
      return;
    }

    // Resolve base path for GitHub Pages - consistent with other path resolution
    const getBasePath = () => {
      if (window.withBase && typeof window.withBase === 'function') {
        return window.withBase('');
      }
      // Detect GitHub Pages path from window.location
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      return pathSegments[0] === 'islamic-kids-app' ? '/islamic-kids-app' : '';
    };

    const basePath = getBasePath();

    audioContainer.innerHTML = `
      <div class="audio-player-wrapper">
        <div>
          <label for="narrator-select">🎤 Narrator:</label>
          <select id="narrator-select">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; width: 100%; flex-wrap: wrap;">
          <label style="display: block; font-weight: 600; font-size: 0.95em; color: var(--color-text); white-space: nowrap;">🎧 Listen:</label>
          <audio id="lesson-audio" controls preload="metadata" playsinline webkit-playsinline crossorigin="anonymous" style="flex: 1; min-width: 200px; max-width: 100%;">
            <source id="audio-source" src="" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </div>
        
        <div id="audio-error" class="audio-error"></div>
        <a id="audio-fallback-link" class="audio-fallback" href="" target="_blank" rel="noopener">Open audio in new tab</a>
      </div>
    `;

    const audioElement = document.getElementById('lesson-audio');
    const sourceElement = document.getElementById('audio-source');
    const narratorSelect = document.getElementById('narrator-select');
    const errorDiv = document.getElementById('audio-error');
    const fallbackLink = document.getElementById('audio-fallback-link');

    const showError = (msg) => {
      errorDiv.textContent = msg;
      errorDiv.classList.add('visible');
    };

    const clearError = () => {
      errorDiv.textContent = '';
      errorDiv.classList.remove('visible');
    };

    const runHeadCheck = async () => {
      const audioUrl = audioElement.src;
      try {
        const response = await fetch(audioUrl, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok) {
          console.warn('[Audio] HEAD request failed:', response.status, audioUrl);
          showError(`Audio file not found (${response.status}): ${audioUrl}`);
        } else {
          console.log('[Audio] File verified with HEAD request:', audioUrl);
        }
      } catch (err) {
        console.warn('[Audio] HEAD fetch error:', err);
      }
    };

    // Set initial audio source
    const setAudioSource = (narrator) => {
      if (audioConfig[narrator]) {
        const audioUrl = `${basePath}/audio/${audioConfig[narrator]}`;
        audioElement.src = audioUrl;
        if (sourceElement) sourceElement.src = audioUrl;
        if (fallbackLink) {
          fallbackLink.href = audioUrl;
          fallbackLink.style.display = 'inline-block';
        }
        console.log('[Audio] Set narrator to:', narrator, '| src:', audioUrl);
        clearError();
        audioElement.load();
        
        // Run verification check (non-blocking)
        runHeadCheck();
      } else {
        console.warn('[Audio] No audio file found for narrator:', narrator);
        showError(`Audio not available for ${narrator} narrator`);
      }
    };

    // Initial setup with male narrator
    setAudioSource('male');

    // Narrator dropdown change handler
    narratorSelect.addEventListener('change', (e) => {
      const wasPlaying = !audioElement.paused;
      const currentTime = audioElement.currentTime;
      
      setAudioSource(e.target.value);
      
      // Restore playback position
      audioElement.currentTime = currentTime;
      
      if (wasPlaying) {
        // Use promise-based play with error handling
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('[Audio] Auto-play after narrator change failed:', err.message);
            // Don't show error - user can manually click play
          });
        }
      }
    });

    // Audio event listeners for debugging and error handling
    audioElement.addEventListener('loadedmetadata', () => {
      console.log('[Audio] Loaded metadata | duration:', audioElement.duration);
      clearError();
    });

    audioElement.addEventListener('canplay', () => {
      console.log('[Audio] Can play');
    });

    audioElement.addEventListener('play', () => {
      console.log('[Audio] Playing');
    });

    audioElement.addEventListener('pause', () => {
      console.log('[Audio] Paused');
    });

    audioElement.addEventListener('error', (e) => {
      console.error('Audio error', audioElement.src, audioElement.error);
      const audioUrl = audioElement.src || sourceElement.src;
      let errorMsg = 'Audio failed to load. ';
      
      if (audioElement.error) {
        switch (audioElement.error.code) {
          case audioElement.error.MEDIA_ERR_ABORTED:
            errorMsg += 'Playback was aborted.';
            break;
          case audioElement.error.MEDIA_ERR_NETWORK:
            errorMsg += 'Network error. Check file: ' + audioUrl;
            break;
          case audioElement.error.MEDIA_ERR_DECODE:
            errorMsg += 'Audio file could not be decoded.';
            break;
          case audioElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg += 'Audio format not supported or file not found: ' + audioUrl;
            break;
          default:
            errorMsg += 'Unknown error.';
        }
      }
      
      showError(errorMsg);
    });
  }

  function renderLesson(){
    const { id } = getQuery();
    console.log('[renderLesson] Attempting to load lesson id:', id);
    
    if(!id){
      document.getElementById('lesson-title').textContent = 'Lesson not found';
      document.getElementById('lesson-body').innerHTML = 'Missing lesson id. <a href="./" class="cta-btn" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      return;
    }
    
    const lesson = findLessonById(id);
    if(!lesson){
      console.error('[renderLesson] Lesson not found in manifest:', id);
      document.getElementById('lesson-title').textContent = 'Lesson not found';
      document.getElementById('lesson-body').innerHTML = 'This lesson doesn\'t exist or hasn\'t loaded yet. <a href="./" class="cta-btn" style="margin-top:12px; display:inline-block;">Back to lessons</a>';
      return;
    }
    
    state.currentLesson = lesson;
    console.log('[renderLesson] Rendering lesson:', lesson.title);
    
    writeLastLesson(id);
    document.getElementById('lesson-title').textContent = `${lesson.number}. ${lesson.title}`;
    document.getElementById('lesson-meta').textContent = `${lesson.minutes} min • ${lesson.tags.join(', ')}`;
    
    // Render audio player if available
    renderAudioPlayer(lesson.id);

    // Build content URL with fallback
    let contentUrl;
    if (window.withBase && typeof window.withBase === 'function') {
      contentUrl = window.withBase(`lessons/content/${lesson.id}.html`);
    } else {
      // Fallback: detect GitHub Pages path
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const base = pathSegments[0] === 'islamic-kids-app' ? '/islamic-kids-app' : '';
      contentUrl = `${base}/lessons/content/${lesson.id}.html`;
    }
    
    console.log('[renderLesson] Content URL:', contentUrl);
    
    if (window.updateDebugInfo) {
      window.updateDebugInfo({ lessonId: id, contentUrl });
    }
    
    // Hide old TTS UI on lesson pages (we're using new MP3 audio player instead)
    const ttsContainer = document.getElementById('tts-container');
    if (ttsContainer) {
      ttsContainer.style.display = 'none';
      console.log('[renderLesson] Hiding old TTS UI; using new audio player instead');
    }

    // Load lesson content
    (async () => {
      try {
        const res = await fetch(contentUrl, { cache: 'no-store' });
        if (res.ok) {
          const html = await res.text();
          if (html && html.trim().length > 0) {
            document.getElementById('lesson-body').innerHTML = html;
          } else {
            throw new Error('Empty content received');
          }
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        console.warn('[Content] Failed to load lesson content:', err.message);
        const lessonBodyEl = document.getElementById('lesson-body');
        if (lessonBodyEl) {
          lessonBodyEl.innerHTML = `
            <div style="padding: 20px; background: rgba(255, 209, 102, 0.1); border: 2px solid #ffd166; border-radius: var(--radius-md); text-align: center;">
              <p style="color: var(--color-text); font-size: 1.025em; margin-bottom: 12px;">
                ⚠️ Lesson content failed to load.
              </p>
              <p style="color: var(--color-text-muted); font-size: 0.95em; margin-bottom: 16px;">
                Please refresh the page or try again later.
              </p>
              <button class="btn-inline" onclick="location.reload()" style="margin: 0 auto;">
                🔄 Refresh Page
              </button>
            </div>
          `;
        }
      }
    })();

    const tagsEl = document.getElementById('lesson-tags');
    if (tagsEl) {
      tagsEl.innerHTML = (lesson.tags||[]).map(t => `<span class=\"chip\">${t}</span>`).join('');
    }

    // Delegate to shared quiz module
    setTimeout(() => {
      if (window.TeenDeenQuiz && typeof window.TeenDeenQuiz.initialize === 'function') {
        console.log('[Quiz] Initializing quiz for lesson:', lesson.id);
        window.TeenDeenQuiz.initialize(lesson);
      } else {
        console.warn('[Quiz] TeenDeenQuiz not available; no quiz will be rendered.');
      }
    }, 250);

    // Setup key takeaways
    const pointsEl = document.getElementById('lesson-points');
    if (pointsEl) {
      if (lesson.id === 'lesson-01') {
        pointsEl.innerHTML = `
          <li>Actions are judged by intentions.</li>
          <li>Allah looks at your heart (intention) before your actions.</li>
          <li>Riya' (showing off) can destroy deeds—keep your worship sincere.</li>
          <li>Pause and ask: "Who am I really doing this for?"</li>`;
      } else if (lesson.id === 'lesson-03') {
        // Lesson 03 has its own comprehensive Key Takeaway section in the content
        pointsEl.closest('.content-section').style.display = 'none';
      } else {
        pointsEl.innerHTML = `
          <li>Read carefully and think critically</li>
          <li>Connect ideas to your daily life</li>
          <li>Discuss what you learned with someone you trust</li>`;
      }
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
      console.log('[init] Lessons loaded:', state.lessons.length);
      
      if(page === 'lesson'){
        try {
          renderLesson();
        } catch (err) {
          console.error('[renderLesson] Error:', err);
          const lessonTitle = document.getElementById('lesson-title');
          const lessonBody = document.getElementById('lesson-body');
          if (lessonTitle) lessonTitle.textContent = 'Error rendering lesson';
          if (lessonBody) lessonBody.innerHTML = `<p>An error occurred while loading the lesson.</p><p><strong>${err.message}</strong></p><a href=\"./\" class=\"cta-btn\" style=\"display: inline-block; margin-top: 12px;\">Back to Lessons</a>`;
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
        const grid = document.getElementById('lessons-grid');
        if (grid) {
          grid.innerHTML = `
            <div class=\"no-lessons\">
              <p class=\"no-lessons-title\">⚠️ ${offline ? 'Offline' : 'Error Loading Lessons'}</p>
              <p class=\"no-lessons-text\">${offline ? 
                'You\'re offline. Reconnect to load lessons.' : 
                'Unable to load lessons. Please check your connection and try again.'
              }</p>
              <button class=\"btn-inline\" id=\"retry-lessons\" style=\"margin-top: 12px;\">🔄 Retry</button>
            </div>
          `;
          const retryBtn = document.getElementById('retry-lessons');
          if (retryBtn) retryBtn.addEventListener('click', () => location.reload());
        }
      }
    });
  }

  // Start the app when DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
