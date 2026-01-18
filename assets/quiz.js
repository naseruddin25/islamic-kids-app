(function(){
  'use strict';

  // Lesson audio mapping
  const lessonAudio = {
    'lesson-01': 'lesson-01-intentions.mp3'
  };

  // Shared quiz module
  const TeenDeenQuiz = {
    async initialize(lesson) {
      const quizSection = document.getElementById('quiz-section');
      const ctaContainer = document.getElementById('quiz-cta-container');
      const ctaButton = document.getElementById('quiz-cta-button');
      const questionsWrapper = document.getElementById('quiz-questions-wrapper');
      const optionsEl = document.getElementById('quiz-options');
      const resultEl = document.getElementById('quiz-result');
      const submitBtn = document.getElementById('quiz-submit');
      const retryBtn = document.getElementById('quiz-retry');
      const reviewBtn = document.getElementById('quiz-review');
      const backTopBtn = document.getElementById('quiz-back-to-top');

      if (!quizSection || !optionsEl || !submitBtn || !retryBtn || !reviewBtn || !backTopBtn) {
        console.warn('[Quiz] Missing quiz elements');
        return;
      }

      const state = {
        isSubmitted: false,
        hasReviewed: false,
        incorrectIds: [],
      };

      // Helper: button visibility controller
      const updateActions = () => {
        submitBtn.classList.toggle('hidden', state.isSubmitted);
        submitBtn.style.display = state.isSubmitted ? 'none' : 'inline-flex';

        reviewBtn.classList.toggle('hidden', !state.isSubmitted);
        reviewBtn.style.display = state.isSubmitted ? 'inline-flex' : 'none';

        retryBtn.classList.toggle('hidden', !state.isSubmitted);
        retryBtn.style.display = state.isSubmitted ? 'inline-flex' : 'none';

        backTopBtn.classList.toggle('hidden', !state.isSubmitted);
        backTopBtn.style.display = state.isSubmitted ? 'inline-flex' : 'none';
      };

      updateActions();

      const dataUrl = window.withBase ? window.withBase(`data/quizzes/${lesson.id}.json`) : `data/quizzes/${lesson.id}.json`;

      let quizData = null;
      try {
        const res = await fetch(dataUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        quizData = await res.json();
      } catch (err) {
        console.warn('[Quiz] No data quiz found for', lesson.id, '-', err.message);
        renderGenericQuiz(optionsEl, resultEl, submitBtn, retryBtn, lesson, state, updateActions, reviewBtn, backTopBtn, ctaContainer, ctaButton, questionsWrapper);
        return;
      }

      // Setup CTA reveal
      setupQuizCTAReveal(ctaContainer, ctaButton, questionsWrapper, { optionsEl, resultEl, submitBtn, retryBtn, reviewBtn, backTopBtn, lesson, quizData, state, updateActions, quizSection });
      
      // Render data-driven quiz
      renderDataQuiz({ optionsEl, resultEl, submitBtn, retryBtn, reviewBtn, backTopBtn, lesson, quizData, state, updateActions, quizSection });
    }
  };

  function setupQuizCTAReveal(ctaContainer, ctaButton, questionsWrapper, quizContext) {
    if (!ctaButton || !questionsWrapper) return;

    ctaButton.addEventListener('click', () => {
      // Hide CTA
      ctaContainer.style.display = 'none';
      
      // Show questions
      questionsWrapper.style.display = 'block';
      
      // Smooth scroll to first question
      setTimeout(() => {
        quizContext.optionsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  }

  function renderGenericQuiz(optionsEl, resultEl, submitBtn, retryBtn, lesson, state, updateActions, reviewBtn, backTopBtn, ctaContainer, ctaButton, questionsWrapper) {
    optionsEl.innerHTML = [
      {id:'a', text:'A kind action'},
      {id:'b', text:'A harmful habit'},
      {id:'c', text:'A random guess'}
    ].map((o) => `
      <label class="quiz-choice-label">
        <input type="radio" name="quiz" value="${o.id}" style="width: 20px; height: 20px; cursor: pointer; margin: 0; flex-shrink: 0;">
        <span style="font-size: var(--text-base);">${o.text}</span>
      </label>`).join('');

    // Setup CTA reveal for generic quiz
    if (ctaButton && questionsWrapper) {
      ctaButton.addEventListener('click', () => {
        ctaContainer.style.display = 'none';
        questionsWrapper.style.display = 'block';
        setTimeout(() => {
          optionsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
    }

    const resetUI = () => {
      state.isSubmitted = false;
      state.hasReviewed = false;
      state.incorrectIds = [];
      updateActions();
      if (resultEl) { resultEl.classList.add('hidden'); resultEl.style.display = 'none'; resultEl.textContent = ''; }
      document.querySelectorAll('input[name="quiz"]').forEach(r => { r.checked = false; r.disabled = false; });
    };

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
        document.querySelectorAll('input[name="quiz"]').forEach(r => r.disabled = true);
        const correct = chosen === 'a';
        showResultSimple(resultEl, correct ? 1 : 0, 1);
        state.isSubmitted = true;
        state.incorrectIds = correct ? [] : ['generic'];
        updateActions();
        resultEl.scrollIntoView({ behavior:'smooth', block:'start' });
        saveScore(lesson.id, correct ? 1 : 0, 1, lesson);
      };
    }

    if (retryBtn) {
      retryBtn.onclick = () => {
        resetUI();
        const certificateContainer = document.getElementById('certificate-container');
        if (certificateContainer) certificateContainer.innerHTML = '';
        optionsEl.scrollIntoView({ behavior:'smooth', block:'start' });
      };
    }

    if (reviewBtn) {
      reviewBtn.onclick = () => {
        if (state.incorrectIds.length === 0) {
          optionsEl.scrollIntoView({ behavior:'smooth', block:'start' });
          return;
        }
        const firstId = state.incorrectIds[0];
        const elem = document.querySelector(`[data-question-id="${firstId}"]`) || optionsEl;
        elem.scrollIntoView({ behavior:'smooth', block:'start' });
      };
    }

    if (backTopBtn) {
      backTopBtn.onclick = () => {
        optionsEl.scrollIntoView({ behavior:'smooth', block:'start' });
      };
    }
  }

  function scrollToFirstIncorrect(incorrectQIds) {
    if (incorrectQIds.length === 0) return;
    const firstId = incorrectQIds[0];
    const elem = document.querySelector(`.quiz-question-block[data-question-id="${firstId}"]`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      elem.style.boxShadow = '0 0 0 3px rgba(239, 71, 111, 0.3)';
      setTimeout(() => {
        elem.style.boxShadow = '';
      }, 2000);
    }
  }

  function renderDataQuiz({ optionsEl, resultEl, submitBtn, retryBtn, reviewBtn, backTopBtn, lesson, quizData, state, updateActions, quizSection }) {
    const questionsHTML = quizData.questions.map(q => `
      <div class="quiz-question-block" data-question-id="${q.id}" style="padding: 20px; background: var(--color-surface, #fff); border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-md, 12px);">
        <p style="margin: 0 0 16px 0; font-weight: 700; font-size: 1.05em; color: var(--color-text, #2f1b0f);">${q.question}</p>
        <div class="quiz-choices" style="display: flex; flex-direction: column; gap: 8px;">
          ${q.choices.map((text, idx) => `
            <label class="quiz-choice-label" data-choice-index="${idx}" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 150ms ease; min-height: 44px; user-select: none;">
              <input type="radio" name="${q.id}" value="${idx}" style="width: 20px; height: 20px; cursor: pointer; margin: 0; flex-shrink: 0;" />
              <span style="font-size: 1em; line-height: 1.5;">${String.fromCharCode(65+idx)}) ${text}</span>
            </label>
          `).join('')}
        </div>
        <div class="quiz-feedback hidden" style="display: none; margin-top: 16px; padding: 12px 16px; border-radius: var(--radius-sm, 8px); font-size: 0.95em; line-height: 1.6;"></div>
      </div>
    `).join('');

    optionsEl.innerHTML = `
      <div id="quiz-questions" style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 24px;">${questionsHTML}</div>
    `;

    const resetUI = () => {
      state.isSubmitted = false;
      state.hasReviewed = false;
      state.incorrectIds = [];
      updateActions();
      // Reset answers
      quizData.questions.forEach(q => {
        document.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => { radio.checked = false; radio.disabled = false; });
      });
      document.querySelectorAll('.quiz-feedback').forEach(fb => { fb.classList.add('hidden'); fb.style.display = 'none'; fb.innerHTML = ''; });
      document.querySelectorAll('.quiz-choice-label').forEach(label => {
        label.style.borderColor = 'var(--color-border, rgba(0,0,0,0.08))';
        label.style.background = 'transparent';
        label.style.color = 'inherit';
      });
      if (resultEl) {
        resultEl.classList.add('hidden');
        resultEl.style.display = 'none';
        resultEl.innerHTML = '';
      }
      const certificateContainer = document.getElementById('certificate-container');
      if (certificateContainer) certificateContainer.innerHTML = '';
    };

    const lockAnswers = () => {
      quizData.questions.forEach(q => {
        document.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => {
          radio.disabled = true;
        });
      });
    };

    submitBtn.onclick = () => {
      const answers = {};
      let allAnswered = true;

      quizData.questions.forEach(q => {
        const selected = document.querySelector(`input[name="${q.id}"]:checked`);
        if (selected) {
          answers[q.id] = Number(selected.value);
        } else {
          allAnswered = false;
        }
      });

      if (!allAnswered) {
        showResultsBox(resultEl, '⚠️ Please answer all questions before submitting.', 'warning');
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      let score = 0;
      const incorrectQIds = [];
      quizData.questions.forEach(q => {
        const selectedValue = answers[q.id];
        const isCorrect = selectedValue === q.correctIndex;
        if (isCorrect) {
          score++;
        } else {
          incorrectQIds.push(q.id);
        }
        const block = document.querySelector(`.quiz-question-block[data-question-id="${q.id}"]`);
        const feedback = block.querySelector('.quiz-feedback');
        const choices = block.querySelectorAll('.quiz-choice-label');
        feedback.classList.remove('hidden');
        feedback.style.display = 'block';
        feedback.style.background = isCorrect ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)';
        feedback.style.borderLeft = isCorrect ? '4px solid #06d6a0' : '4px solid #ef476f';
        feedback.style.color = isCorrect ? '#00a37a' : '#d0354a';
        feedback.innerHTML = `<strong>${isCorrect ? '✓ Correct' : '✗ Incorrect'}</strong><br>${q.explanation || ''}`;

        choices.forEach(label => {
          const idx = Number(label.getAttribute('data-choice-index'));
          if (idx === q.correctIndex) {
            label.style.borderColor = '#06d6a0';
            label.style.background = 'rgba(6, 214, 160, 0.08)';
          }
          if (idx === selectedValue && !isCorrect) {
            label.style.borderColor = '#ef476f';
            label.style.background = 'rgba(239, 71, 111, 0.08)';
          }
        });
      });

      const pass = score >= Math.ceil(quizData.questions.length * 0.7);
      showResultsBox(
        resultEl,
        `<div style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Score: ${score}/${quizData.questions.length}</div>${pass ? '<strong style="color: #06d6a0;">✓ PASSED</strong> — Great work!' : '<strong style="color: #ef476f;">Not quite.</strong> Review the explanations and try again.'}`,
        pass ? 'success' : 'retry'
      );

      saveScore(lesson.id, score, quizData.questions.length, lesson);

      if (pass && window.TeenDeenConfetti) {
        setTimeout(() => window.TeenDeenConfetti.celebrate(), 300);
      }

      lockAnswers();
      state.isSubmitted = true;
      state.incorrectIds = incorrectQIds;
      state.hasReviewed = false;
      updateActions();
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    reviewBtn.onclick = () => {
      state.hasReviewed = true;
      scrollToFirstIncorrect(state.incorrectIds);
    };

    retryBtn.onclick = () => {
      resetUI();
      optionsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    backTopBtn.onclick = () => {
      quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  function showResultSimple(resultEl, score, total){
    if (!resultEl) return;
    resultEl.classList.remove('hidden');
    resultEl.style.display = 'block';
    const ok = score === total;
    resultEl.textContent = `Score: ${score}/${total} ${ok ? '✓ Great job — fully correct.' : 'Keep going — review the lesson and try again.'}`;
    resultEl.style.color = ok ? 'var(--color-primary)' : 'var(--color-secondary)';
  }

  function showResultsBox(resultEl, message, type) {
    if (!resultEl) return;
    resultEl.classList.remove('hidden');
    resultEl.style.display = 'block';
    resultEl.innerHTML = `<div style="padding: 16px 20px; border-radius: var(--radius-md, 12px); ${getResultsStyle(type)}">${message}</div>`;
  }

  function getResultsStyle(type) {
    switch(type) {
      case 'success': return 'background: rgba(6, 214, 160, 0.1); border: 2px solid #06d6a0; color: #00a37a;';
      case 'warning': return 'background: rgba(255, 209, 102, 0.1); border: 2px solid #ffd166; color: #b88900;';
      case 'retry': return 'background: rgba(239, 71, 111, 0.1); border: 2px solid #ef476f; color: #d0354a;';
      default: return 'background: var(--color-surface, #fff); border: 2px solid var(--color-border, rgba(0,0,0,0.08));';
    }
  }

  function saveScore(lessonId, score, total, lesson) {
    try {
      const completed = new Set(JSON.parse(localStorage.getItem('completedLessons')||'[]'));
      completed.add(lessonId);
      localStorage.setItem('completedLessons', JSON.stringify(Array.from(completed)));
      const scores = JSON.parse(localStorage.getItem('lessonScores')||'{}');
      scores[lessonId] = { score, total, ts: Date.now() };
      localStorage.setItem('lessonScores', JSON.stringify(scores));
    } catch (err) {
      console.warn('[Quiz] Storage error:', err);
    }

    if (window.TeenDeenProgress) {
      window.TeenDeenProgress.completeLesson(lessonId, score, total);
    }

    if (score === total && window.TeenDeenCertificate) {
      try {
        const passed = window.TeenDeenCertificate.checkIfPassed(lessonId, score, total);
        if (passed) {
          const lessonTopic = (lesson.tags && lesson.tags.length > 0) ? lesson.tags[0] : '';
          window.TeenDeenCertificate.renderCertificatePanel({
            lessonId,
            lessonTitle: lesson.title || '',
            lessonTopic,
            score,
            total,
            passed: true
          });
        }
      } catch (certErr) {
        console.warn('[Certificate] Error:', certErr);
      }
    }
  }

  // Export
  window.TeenDeenQuiz = TeenDeenQuiz;
})();
