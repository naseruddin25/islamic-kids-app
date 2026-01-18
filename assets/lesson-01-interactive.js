/**
 * LESSON 01 INTERACTIVE - Quiz, Reflect, and Sharing
 * This script handles all interactivity for Lesson 1 (Intentions/Niyyah)
 * - Quiz with 5 MCQs
 * - Reflect section with localStorage persistence
 * - Results sharing (Copy/Email/Share)
 * 
 * ONLY ACTIVATES FOR LESSON-01, DOES NOT INTERFERE WITH OTHER LESSONS
 */

(function() {
  'use strict';

  // Check if we're on lesson-01 page
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get('id');
  
  if (lessonId !== 'lesson-01') {
    console.log('[Lesson 01 Interactive] Not lesson-01, skipping initialization');
    return; // Exit early if not lesson-01
  }

  // Prevent duplicate initialization
  if (window.__teenDeenLesson01Init) return;
  window.__teenDeenLesson01Init = true;

  console.log('[Lesson 01 Interactive] Initializing for lesson-01...');

  // Quiz configuration
  const QUIZ_CONFIG = {
    lessonId: 'lesson-01',
    lessonTitle: 'Intentions: Why You Do What You Do',
    passThreshold: 4,
    questions: [
      {
        id: 'q1',
        question: 'Q1. What makes an action count with Allah?',
        choices: [
          { value: 'A', text: 'How hard it looks' },
          { value: 'B', text: 'Who sees it' },
          { value: 'C', text: 'The intention behind it' },
          { value: 'D', text: 'How many people do it' }
        ],
        correct: 'C',
        explanation: 'Allah judges actions by intention, not appearance.'
      },
      {
        id: 'q2',
        question: 'Q2. If someone prays mainly to impress others, what's the main problem?',
        choices: [
          { value: 'A', text: 'Prayer is always wrong' },
          { value: 'B', text: 'Their intention is not for Allah' },
          { value: 'C', text: 'They prayed at the wrong time' },
          { value: 'D', text: 'They didn't pray long enough' }
        ],
        correct: 'B',
        explanation: 'Showing off removes sincerity, which removes reward.'
      },
      {
        id: 'q3',
        question: 'Q3. Why did many scholars start their books with the teaching about intentions?',
        choices: [
          { value: 'A', text: 'It's the easiest topic' },
          { value: 'B', text: 'It reminds people that "why" matters before "what"' },
          { value: 'C', text: 'It's only for beginners' },
          { value: 'D', text: 'It's a history lesson' }
        ],
        correct: 'B',
        explanation: 'It sets the foundation that "why" comes before "what."'
      },
      {
        id: 'q4',
        question: 'Q4. Which is the best example of a sincere intention?',
        choices: [
          { value: 'A', text: 'Donating so people praise you' },
          { value: 'B', text: 'Helping someone so you can post it' },
          { value: 'C', text: 'Studying Islam to get closer to Allah' },
          { value: 'D', text: 'Praying because your friends are watching' }
        ],
        correct: 'C',
        explanation: 'Sincerity means doing it for Allah alone.'
      },
      {
        id: 'q5',
        question: 'Q5. What's a simple habit to improve sincerity?',
        choices: [
          { value: 'A', text: 'Never do good deeds in public' },
          { value: 'B', text: 'Check your intention before and during the action' },
          { value: 'C', text: 'Tell everyone your goals' },
          { value: 'D', text: 'Only do big actions' }
        ],
        correct: 'B',
        explanation: 'Regular self-checks protect the heart.'
      }
    ]
  };

  // State
  let quizState = {
    submitted: false,
    score: null,
    answers: {},
    passed: false
  };

  // Initialize when DOM is ready and quiz-options element exists
  function init() {
    console.log('[Lesson 01 Interactive] Waiting for quiz-options element...');
    
    // Wait for quiz-options element to exist (app.js creates this)
    const checkQuizOptions = setInterval(() => {
      const quizOptions = document.getElementById('quiz-options');
      
      if (quizOptions) {
        clearInterval(checkQuizOptions);
        console.log('[Lesson 01 Interactive] quiz-options found, rendering custom quiz');
        
        // Make sure parent section is visible
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) {
          quizSection.style.display = 'block';
        }
        
        renderQuiz();
        initReflectSection();
        loadSavedData();
      }
    }, 50);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkQuizOptions);
      if (!document.getElementById('quiz-options')) {
        console.error('[Lesson 01 Interactive] Timeout: quiz-options element never appeared. Check lesson.html template.');
      }
    }, 5000);
  }

  // Render quiz UI - replaces the content of quiz-options element
  function renderQuiz() {
    const quizOptions = document.getElementById('quiz-options');
    if (!quizOptions) {
      console.error('[Lesson 01 Interactive] quiz-options element not found');
      return;
    }

    const quizHTML = `
      <!-- Quiz Questions -->
      <div id="quiz-questions" style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 24px;">
        ${QUIZ_CONFIG.questions.map((q, index) => renderQuestion(q, index)).join('')}
      </div>

      <!-- Results Area -->
      <div id="quiz-results" class="hidden" style="display: none; margin-bottom: 24px;"></div>

      <!-- Quiz Actions -->
      <div id="quiz-actions" style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button id="quiz-submit-btn" class="quiz-btn quiz-btn-primary">
          Submit Quiz
        </button>
        <button id="quiz-retry-btn" class="quiz-btn quiz-btn-secondary hidden" style="display: none;">
          Try Again
        </button>
      </div>

      <!-- Sharing Area (shown after submit) -->
      <div id="quiz-sharing" class="hidden" style="display: none; margin-top: 24px; padding: 20px; background: var(--color-bg-warm, #fff7ec); border-radius: var(--radius-md, 12px); border: 2px solid var(--color-primary, #ff9f43);">
        <h4 style="margin: 0 0 16px 0; font-size: 1.1em; color: var(--color-text, #2f1b0f);">
          📤 Share Your Results
        </h4>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
          <label style="display: block;">
            <span style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 0.9em; color: var(--color-text-muted, #6c5a4d);">
              Your Name (optional for sharing)
            </span>
            <input 
              type="text" 
              id="student-name-input" 
              placeholder="Enter your name"
              style="width: 100%; padding: 12px; border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-sm, 8px); font-family: inherit; font-size: 1em;"
            />
          </label>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="share-copy-btn" class="quiz-btn quiz-btn-secondary">
            📋 Copy Results
          </button>
          <button id="share-email-btn" class="quiz-btn quiz-btn-secondary">
            ✉️ Email Results
          </button>
          <button id="share-web-btn" class="quiz-btn quiz-btn-secondary hidden" style="display: none;">
            🔗 Share
          </button>
        </div>
        <div id="share-status" style="margin-top: 12px; font-size: 0.9em; color: var(--color-text-muted, #6c5a4d);"></div>
      </div>
    `;

    // Replace quiz-options content
    quizOptions.innerHTML = quizHTML;
    console.log('[Lesson 01 Interactive] Quiz HTML injected into quiz-options');

    // Add event listeners
    document.getElementById('quiz-submit-btn').addEventListener('click', handleSubmit);
    document.getElementById('quiz-retry-btn').addEventListener('click', handleRetry);
    document.getElementById('share-copy-btn').addEventListener('click', handleCopyResults);
    document.getElementById('share-email-btn').addEventListener('click', handleEmailResults);
    const shareWebBtn = document.getElementById('share-web-btn');
    if (navigator.share) {
      shareWebBtn.style.display = 'inline-flex';
      shareWebBtn.classList.remove('hidden');
      shareWebBtn.addEventListener('click', handleWebShare);
    }

    // Add input listener for student name persistence
    document.getElementById('student-name-input').addEventListener('input', debounce((e) => {
      saveToLocalStorage('teenDeen.studentName', e.target.value.trim());
    }, 500));
  }

  // Render individual question
  function renderQuestion(q, index) {
    return `
      <div class="quiz-question-block" data-question-id="${q.id}" style="padding: 20px; background: var(--color-surface, #fff); border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-md, 12px);">
        <p style="margin: 0 0 16px 0; font-weight: 700; font-size: 1.05em; color: var(--color-text, #2f1b0f);">
          ${q.question}
        </p>
        <div class="quiz-choices" style="display: flex; flex-direction: column; gap: 8px;">
          ${q.choices.map(choice => `
            <label class="quiz-choice-label" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 150ms ease; min-height: 44px; user-select: none;">
              <input 
                type="radio" 
                name="${q.id}" 
                value="${choice.value}" 
                style="width: 20px; height: 20px; cursor: pointer; margin: 0; flex-shrink: 0;"
              />
              <span style="font-size: 1em; line-height: 1.5;">
                ${choice.value}) ${choice.text}
              </span>
            </label>
          `).join('')}
        </div>
        <div class="quiz-feedback hidden" style="display: none; margin-top: 16px; padding: 12px 16px; border-radius: var(--radius-sm, 8px); font-size: 0.95em; line-height: 1.6;"></div>
      </div>
    `;
  }

  // Handle quiz submission
  function handleSubmit() {
    console.log('[Quiz] Submit clicked');

    // Validate all questions answered
    const answers = {};
    let allAnswered = true;

    QUIZ_CONFIG.questions.forEach(q => {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      if (selected) {
        answers[q.id] = selected.value;
      } else {
        allAnswered = false;
      }
    });

    if (!allAnswered) {
      showResults('⚠️ Please answer all questions before submitting.', 'warning');
      return;
    }

    // Calculate score
    let score = 0;
    QUIZ_CONFIG.questions.forEach(q => {
      if (answers[q.id] === q.correct) {
        score++;
      }
    });

    // Update state
    quizState.submitted = true;
    quizState.score = score;
    quizState.answers = answers;
    quizState.passed = score >= QUIZ_CONFIG.passThreshold;

    // Show feedback for each question
    QUIZ_CONFIG.questions.forEach(q => {
      const block = document.querySelector(`.quiz-question-block[data-question-id="${q.id}"]`);
      const feedback = block.querySelector('.quiz-feedback');
      const isCorrect = answers[q.id] === q.correct;

      feedback.classList.remove('hidden');
      feedback.style.display = 'block';
      feedback.style.background = isCorrect ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)';
      feedback.style.borderLeft = isCorrect ? '4px solid #06d6a0' : '4px solid #ef476f';
      feedback.style.color = isCorrect ? '#00a37a' : '#d0354a';
      feedback.innerHTML = `
        <strong>${isCorrect ? '✓ Correct' : '✗ Incorrect'}</strong><br>
        ${q.explanation}
      `;
    });

    // Show overall results
    const passText = quizState.passed ? 
      `<strong style="color: #06d6a0;">✓ PASSED</strong> — Great work!` : 
      `<strong style="color: #ef476f;">Not quite.</strong> Review the explanations and try again.`;
    
    showResults(
      `<div style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Score: ${score}/${QUIZ_CONFIG.questions.length}</div>${passText}`,
      quizState.passed ? 'success' : 'retry'
    );

    // Save to localStorage
    saveToLocalStorage('teenDeen.lesson-01.score', score);
    saveToLocalStorage('teenDeen.lesson-01.passed', quizState.passed);
    saveToLocalStorage('teenDeen.lesson-01.completedAt', new Date().toISOString());

    // Also save to legacy format for compatibility
    try {
      const completed = new Set(JSON.parse(localStorage.getItem('completedLessons') || '[]'));
      completed.add('lesson-01');
      localStorage.setItem('completedLessons', JSON.stringify(Array.from(completed)));
      
      const scores = JSON.parse(localStorage.getItem('lessonScores') || '{}');
      scores['lesson-01'] = { score: score, total: QUIZ_CONFIG.questions.length, ts: Date.now() };
      localStorage.setItem('lessonScores', JSON.stringify(scores));
    } catch (err) {
      console.warn('[Quiz] Legacy storage failed:', err);
    }

    // Update UI
    document.getElementById('quiz-submit-btn').classList.add('hidden');
    document.getElementById('quiz-submit-btn').style.display = 'none';
    document.getElementById('quiz-retry-btn').classList.remove('hidden');
    document.getElementById('quiz-retry-btn').style.display = 'inline-flex';
    
    // Show sharing section
    const sharingSection = document.getElementById('quiz-sharing');
    sharingSection.classList.remove('hidden');
    sharingSection.style.display = 'block';

    // Trigger confetti celebration
    if (quizState.passed && window.TeenDeenConfetti) {
      setTimeout(() => window.TeenDeenConfetti.celebrate(), 300);
    }

    // Update progress tracking
    if (window.TeenDeenProgress) {
      try {
        window.TeenDeenProgress.completeLesson(QUIZ_CONFIG.lessonId, score, QUIZ_CONFIG.questions.length);
      } catch (err) {
        console.warn('[Quiz] Progress tracking error:', err);
      }
    }

    // Trigger certificate if passed
    if (quizState.passed && window.TeenDeenCertificate) {
      try {
        window.TeenDeenCertificate.checkIfPassed(QUIZ_CONFIG.lessonId, score, QUIZ_CONFIG.questions.length);
        window.TeenDeenCertificate.renderCertificatePanel({
          lessonId: QUIZ_CONFIG.lessonId,
          lessonTitle: QUIZ_CONFIG.lessonTitle,
          score: score,
          total: QUIZ_CONFIG.questions.length,
          passed: true
        });
      } catch (err) {
        console.warn('[Quiz] Certificate integration error:', err);
      }
    }
  }

  // Handle retry
  function handleRetry() {
    console.log('[Quiz] Retry clicked');

    // Clear all radio selections
    QUIZ_CONFIG.questions.forEach(q => {
      const radios = document.querySelectorAll(`input[name="${q.id}"]`);
      radios.forEach(radio => radio.checked = false);
    });

    // Hide all feedback
    document.querySelectorAll('.quiz-feedback').forEach(fb => {
      fb.classList.add('hidden');
      fb.style.display = 'none';
      fb.innerHTML = '';
    });

    // Hide results
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.classList.add('hidden');
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';

    // Hide sharing section
    const sharingSection = document.getElementById('quiz-sharing');
    sharingSection.classList.add('hidden');
    sharingSection.style.display = 'none';

    // Reset state
    quizState = {
      submitted: false,
      score: null,
      answers: {},
      passed: false
    };

    // Update buttons
    document.getElementById('quiz-submit-btn').classList.remove('hidden');
    document.getElementById('quiz-submit-btn').style.display = 'inline-flex';
    document.getElementById('quiz-retry-btn').classList.add('hidden');
    document.getElementById('quiz-retry-btn').style.display = 'none';
  }

  // Show results message
  function showResults(message, type) {
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.classList.remove('hidden');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div style="padding: 16px 20px; border-radius: var(--radius-md, 12px); ${getResultsStyle(type)}">
        ${message}
      </div>
    `;
  }

  // Get results styling
  function getResultsStyle(type) {
    switch(type) {
      case 'success':
        return 'background: rgba(6, 214, 160, 0.1); border: 2px solid #06d6a0; color: #00a37a;';
      case 'warning':
        return 'background: rgba(255, 209, 102, 0.1); border: 2px solid #ffd166; color: #b88900;';
      case 'retry':
        return 'background: rgba(239, 71, 111, 0.1); border: 2px solid #ef476f; color: #d0354a;';
      default:
        return 'background: var(--color-surface, #fff); border: 2px solid var(--color-border, rgba(0,0,0,0.08));';
    }
  }

  // Initialize reflection section
  function initReflectSection() {
    const reflectSection = document.getElementById('reflect-section');
    if (!reflectSection) return;

    const textareas = reflectSection.querySelectorAll('textarea');
    textareas.forEach((textarea, index) => {
      const storageKey = `teenDeen.lesson-01.reflect.${index}`;
      
      // Load saved value
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) textarea.value = saved;
      } catch (err) {
        console.warn('[Reflect] Load error:', err);
      }

      // Save on input with debounce
      textarea.addEventListener('input', debounce((e) => {
        saveToLocalStorage(storageKey, e.target.value);
      }, 500));
    });
  }

  // Load saved data
  function loadSavedData() {
    try {
      const savedName = localStorage.getItem('teenDeen.studentName');
      const nameInput = document.getElementById('student-name-input');
      if (savedName && nameInput) {
        nameInput.value = savedName;
      }
    } catch (err) {
      console.warn('[Load] Error loading saved data:', err);
    }
  }

  // Build results text for sharing
  function buildResultsText() {
    const studentName = document.getElementById('student-name-input').value.trim() || 'Student';
    const completedAt = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `Teen Deen — Lesson Completed

Student: ${studentName}
Lesson: ${QUIZ_CONFIG.lessonTitle}
Result: ${quizState.passed ? 'PASSED' : 'COMPLETED'}
Score: ${quizState.score}/${QUIZ_CONFIG.questions.length}
Date: ${completedAt}

Key takeaway: Actions are judged by intentions. Pause and check your heart before you pray, give charity, or learn Qur'an.

—
Teen Deen • Islamic Learning for Teens
`;
  }

  // Handle copy results
  async function handleCopyResults() {
    const resultsText = buildResultsText();
    const statusDiv = document.getElementById('share-status');

    try {
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resultsText);
        statusDiv.textContent = '✓ Copied to clipboard!';
        statusDiv.style.color = '#06d6a0';
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = resultsText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        statusDiv.textContent = '✓ Copied!';
        statusDiv.style.color = '#06d6a0';
      }

      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    } catch (err) {
      console.error('[Share] Copy failed:', err);
      statusDiv.textContent = '✗ Copy failed. Please select and copy manually.';
      statusDiv.style.color = '#ef476f';
    }
  }

  // Handle email results
  function handleEmailResults() {
    const resultsText = buildResultsText();
    const subject = `Teen Deen — ${QUIZ_CONFIG.lessonTitle} Results`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(resultsText)}`;
    
    try {
      window.location.href = mailtoLink;
      const statusDiv = document.getElementById('share-status');
      statusDiv.textContent = '✓ Opening email app...';
      statusDiv.style.color = '#06d6a0';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    } catch (err) {
      console.error('[Share] Email failed:', err);
    }
  }

  // Handle Web Share API
  async function handleWebShare() {
    const resultsText = buildResultsText();
    const statusDiv = document.getElementById('share-status');

    try {
      await navigator.share({
        title: `Teen Deen — ${QUIZ_CONFIG.lessonTitle}`,
        text: resultsText
      });
      statusDiv.textContent = '✓ Shared successfully!';
      statusDiv.style.color = '#06d6a0';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Share] Web Share failed:', err);
        statusDiv.textContent = '✗ Share cancelled or failed';
        statusDiv.style.color = '#ef476f';
        setTimeout(() => {
          statusDiv.textContent = '';
        }, 3000);
      }
    }
  }

  // Utility: Save to localStorage with error handling
  function saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[Storage] Failed to save ${key}:`, err);
    }
  }

  // Utility: Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
