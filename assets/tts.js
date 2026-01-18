/**
 * TTS.JS - Text-to-Speech Read Aloud Feature for Teen Deen
 * Uses Web Speech API (SpeechSynthesis)
 */

(function() {
  'use strict';

  // Check for SpeechSynthesis support
  if (!('speechSynthesis' in window)) {
    console.warn('[TTS] SpeechSynthesis not supported in this browser');
    return;
  }

  // State management
  const state = {
    synth: window.speechSynthesis,
    voices: [],
    currentUtterance: null,
    currentIndex: 0,
    elements: [],
    isPlaying: false,
    isPaused: false,
    rate: 1.0,
    selectedVoice: null,
    initialized: false
  };

  // Configuration
  const config = {
    storageKeys: {
      rate: 'teenDeen.tts.rate',
      voice: 'teenDeen.tts.voiceName'
    },
    selectors: {
      lessonContent: '#lesson-body',
      fallbacks: ['article', 'main .card']
    }
  };

  /**
   * Initialize TTS system
   */
  function initTTS() {
    if (state.initialized) return;
    
    console.log('[TTS] Initializing...');
    
    // Load saved preferences
    loadPreferences();
    
    // Load voices
    loadVoices();
    
    // Handle voices changed event (some browsers load voices asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Insert reader bar
    insertReaderBar();
    
    state.initialized = true;
    console.log('[TTS] Initialized successfully');
  }

  /**
   * Load user preferences from localStorage
   */
  function loadPreferences() {
    try {
      const savedRate = localStorage.getItem(config.storageKeys.rate);
      if (savedRate) {
        state.rate = parseFloat(savedRate);
      }
      
      const savedVoice = localStorage.getItem(config.storageKeys.voice);
      if (savedVoice) {
        state.selectedVoice = savedVoice;
      }
    } catch (e) {
      console.warn('[TTS] Could not load preferences:', e);
    }
  }

  /**
   * Save user preferences to localStorage
   */
  function savePreferences() {
    try {
      localStorage.setItem(config.storageKeys.rate, state.rate.toString());
      if (state.selectedVoice) {
        localStorage.setItem(config.storageKeys.voice, state.selectedVoice);
      }
    } catch (e) {
      console.warn('[TTS] Could not save preferences:', e);
    }
  }

  /**
   * Load available voices
   */
  function loadVoices() {
    state.voices = state.synth.getVoices();
    
    if (state.voices.length === 0) {
      console.warn('[TTS] No voices available yet');
      return;
    }
    
    console.log('[TTS] Loaded', state.voices.length, 'voices');
    
    // Populate voice selector if it exists
    const voiceSelect = document.getElementById('tts-voice');
    if (voiceSelect) {
      populateVoiceSelector(voiceSelect);
    }
  }

  /**
   * Populate voice selector dropdown
   */
  function populateVoiceSelector(select) {
    select.innerHTML = '';
    
    // Group voices by language
    const enVoices = state.voices.filter(v => v.lang.startsWith('en'));
    const otherVoices = state.voices.filter(v => !v.lang.startsWith('en'));
    
    if (enVoices.length > 0) {
      const enGroup = document.createElement('optgroup');
      enGroup.label = 'English';
      enVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name === state.selectedVoice) {
          option.selected = true;
        }
        enGroup.appendChild(option);
      });
      select.appendChild(enGroup);
    }
    
    if (otherVoices.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = 'Other Languages';
      otherVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name === state.selectedVoice) {
          option.selected = true;
        }
        otherGroup.appendChild(option);
      });
      select.appendChild(otherGroup);
    }
  }

  /**
   * Insert reader bar into the page
   */
  function insertReaderBar() {
    // Check if we're on a lesson page
    const isLessonPage = window.location.pathname.includes('/lessons/') || 
                         window.location.pathname.includes('/lesson');
    
    if (!isLessonPage) {
      console.log('[TTS] Not a lesson page, skipping reader bar');
      return;
    }
    
    // Check if bar already exists
    if (document.getElementById('tts-reader-bar')) {
      console.log('[TTS] Reader bar already exists');
      return;
    }
    
    // Find lesson content
    const contentEl = findLessonContent();
    if (!contentEl) {
      console.warn('[TTS] Could not find lesson content element');
      return;
    }
    
    // Create reader bar
    const readerBar = createReaderBar();
    
    // Insert before content
    contentEl.parentElement.insertBefore(readerBar, contentEl);
    
    // Attach event listeners
    attachEventListeners();
    
    console.log('[TTS] Reader bar inserted');
  }

  /**
   * Find the lesson content element
   */
  function findLessonContent() {
    // Try primary selector
    let el = document.querySelector(config.selectors.lessonContent);
    if (el) return el;
    
    // Try fallbacks
    for (const selector of config.selectors.fallbacks) {
      el = document.querySelector(selector);
      if (el) return el;
    }
    
    return null;
  }

  /**
   * Create reader bar HTML element
   */
  function createReaderBar() {
    const bar = document.createElement('div');
    bar.id = 'tts-reader-bar';
    bar.className = 'reader-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Read Aloud Controls');
    
    bar.innerHTML = `
      <div class="reader-bar-content">
        <div class="reader-bar-label">
          <span class="reader-icon">🔊</span>
          <span class="reader-title">Read Aloud</span>
        </div>
        
        <div class="reader-controls">
          <button id="tts-play" class="reader-btn reader-btn-primary" aria-label="Play">
            <span class="btn-icon">▶</span>
            <span class="btn-text">Play</span>
          </button>
          
          <button id="tts-pause" class="reader-btn" aria-label="Pause" disabled>
            <span class="btn-icon">⏸</span>
            <span class="btn-text">Pause</span>
          </button>
          
          <button id="tts-resume" class="reader-btn" aria-label="Resume" disabled style="display: none;">
            <span class="btn-icon">▶</span>
            <span class="btn-text">Resume</span>
          </button>
          
          <button id="tts-stop" class="reader-btn" aria-label="Stop" disabled>
            <span class="btn-icon">⏹</span>
            <span class="btn-text">Stop</span>
          </button>
        </div>
        
        <div class="reader-settings">
          <div class="reader-setting">
            <label for="tts-rate" class="setting-label">
              Speed: <span id="tts-rate-value">1.0x</span>
            </label>
            <input 
              id="tts-rate" 
              type="range" 
              min="0.8" 
              max="1.2" 
              step="0.1" 
              value="${state.rate}"
              aria-label="Reading speed"
              class="rate-slider"
            >
          </div>
          
          <div class="reader-setting reader-setting-voice">
            <label for="tts-voice" class="setting-label">Voice:</label>
            <select id="tts-voice" aria-label="Select voice" class="voice-select">
              <option value="">Loading voices...</option>
            </select>
          </div>
        </div>
      </div>
    `;
    
    return bar;
  }

  /**
   * Attach event listeners to controls
   */
  function attachEventListeners() {
    const playBtn = document.getElementById('tts-play');
    const pauseBtn = document.getElementById('tts-pause');
    const resumeBtn = document.getElementById('tts-resume');
    const stopBtn = document.getElementById('tts-stop');
    const rateSlider = document.getElementById('tts-rate');
    const voiceSelect = document.getElementById('tts-voice');
    
    if (playBtn) playBtn.addEventListener('click', handlePlay);
    if (pauseBtn) pauseBtn.addEventListener('click', handlePause);
    if (resumeBtn) resumeBtn.addEventListener('click', handleResume);
    if (stopBtn) stopBtn.addEventListener('click', handleStop);
    
    if (rateSlider) {
      rateSlider.addEventListener('input', handleRateChange);
      updateRateDisplay();
    }
    
    if (voiceSelect) {
      voiceSelect.addEventListener('change', handleVoiceChange);
      // Populate voices if already loaded
      if (state.voices.length > 0) {
        populateVoiceSelector(voiceSelect);
      }
    }
  }

  /**
   * Extract readable text from lesson content
   */
  function extractReadableElements() {
    const contentEl = findLessonContent();
    if (!contentEl) {
      console.warn('[TTS] Cannot extract text - content element not found');
      return [];
    }
    
    const elements = [];
    
    // Get all paragraphs, headings, and list items
    const selectors = 'p, h1, h2, h3, h4, h5, h6, li, blockquote';
    const nodes = contentEl.querySelectorAll(selectors);
    
    nodes.forEach(node => {
      const text = node.textContent.trim();
      
      // Skip empty elements, buttons, and inputs
      if (!text || node.matches('button, input, select, textarea')) {
        return;
      }
      
      // Skip very short text (likely metadata)
      if (text.length < 3) {
        return;
      }
      
      elements.push({
        element: node,
        text: text
      });
    });
    
    console.log('[TTS] Extracted', elements.length, 'readable elements');
    return elements;
  }

  /**
   * Handle Play button
   */
  function handlePlay() {
    console.log('[TTS] Play clicked');
    
    // Extract elements if not already done
    if (state.elements.length === 0) {
      state.elements = extractReadableElements();
    }
    
    if (state.elements.length === 0) {
      alert('Nothing to read on this page.');
      return;
    }
    
    // Start reading from beginning
    state.currentIndex = 0;
    state.isPlaying = true;
    state.isPaused = false;
    
    updateButtonStates();
    speakCurrentElement();
  }

  /**
   * Handle Pause button
   */
  function handlePause() {
    console.log('[TTS] Pause clicked');
    
    if (state.synth.speaking) {
      state.synth.pause();
      state.isPaused = true;
      updateButtonStates();
    }
  }

  /**
   * Handle Resume button
   */
  function handleResume() {
    console.log('[TTS] Resume clicked');
    
    if (state.isPaused) {
      state.synth.resume();
      state.isPaused = false;
      updateButtonStates();
    }
  }

  /**
   * Handle Stop button
   */
  function handleStop() {
    console.log('[TTS] Stop clicked');
    
    state.synth.cancel();
    state.isPlaying = false;
    state.isPaused = false;
    state.currentIndex = 0;
    
    // Remove all highlights
    clearAllHighlights();
    
    updateButtonStates();
  }

  /**
   * Handle rate slider change
   */
  function handleRateChange(e) {
    state.rate = parseFloat(e.target.value);
    updateRateDisplay();
    savePreferences();
    
    // If currently speaking, update the rate
    if (state.currentUtterance) {
      state.currentUtterance.rate = state.rate;
    }
  }

  /**
   * Handle voice selection change
   */
  function handleVoiceChange(e) {
    state.selectedVoice = e.target.value;
    savePreferences();
    console.log('[TTS] Voice changed to:', state.selectedVoice);
  }

  /**
   * Update rate display
   */
  function updateRateDisplay() {
    const display = document.getElementById('tts-rate-value');
    if (display) {
      display.textContent = state.rate.toFixed(1) + 'x';
    }
  }

  /**
   * Update button states based on current state
   */
  function updateButtonStates() {
    const playBtn = document.getElementById('tts-play');
    const pauseBtn = document.getElementById('tts-pause');
    const resumeBtn = document.getElementById('tts-resume');
    const stopBtn = document.getElementById('tts-stop');
    
    if (state.isPlaying && !state.isPaused) {
      // Currently playing
      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) {
        pauseBtn.disabled = false;
        pauseBtn.style.display = 'inline-flex';
      }
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (stopBtn) stopBtn.disabled = false;
    } else if (state.isPaused) {
      // Paused
      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) {
        resumeBtn.disabled = false;
        resumeBtn.style.display = 'inline-flex';
      }
      if (stopBtn) stopBtn.disabled = false;
    } else {
      // Stopped
      if (playBtn) playBtn.disabled = false;
      if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.style.display = 'inline-flex';
      }
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (stopBtn) stopBtn.disabled = true;
    }
  }

  /**
   * Speak current element
   */
  function speakCurrentElement() {
    if (state.currentIndex >= state.elements.length) {
      // Finished reading all elements
      console.log('[TTS] Finished reading');
      handleStop();
      return;
    }
    
    const item = state.elements[state.currentIndex];
    
    // Clear previous highlight
    clearAllHighlights();
    
    // Highlight current element
    item.element.classList.add('tts-active');
    
    // Scroll into view
    item.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = state.rate;
    
    // Set voice if selected
    if (state.selectedVoice) {
      const voice = state.voices.find(v => v.name === state.selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    // Handle end of utterance
    utterance.onend = () => {
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        speakCurrentElement();
      }
    };
    
    // Handle errors
    utterance.onerror = (event) => {
      console.error('[TTS] Speech error:', event);
      handleStop();
    };
    
    state.currentUtterance = utterance;
    state.synth.speak(utterance);
    
    console.log('[TTS] Speaking element', state.currentIndex + 1, 'of', state.elements.length);
  }

  /**
   * Clear all highlight classes
   */
  function clearAllHighlights() {
    state.elements.forEach(item => {
      item.element.classList.remove('tts-active');
    });
  }

  /**
   * Cleanup on page unload
   */
  function cleanup() {
    console.log('[TTS] Cleaning up...');
    if (state.synth.speaking) {
      state.synth.cancel();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTTS);
  } else {
    initTTS();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

})();
