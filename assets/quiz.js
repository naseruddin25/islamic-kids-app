(function(){
  'use strict';

  // Shared quiz module
  const TeenDeenQuiz = {
    async initialize(lesson) {
      const quizSection = document.getElementById('quiz-section');
      const optionsEl = document.getElementById('quiz-options');
      const resultEl = document.getElementById('quiz-result');
      const submitBtn = document.getElementById('quiz-submit');
      const retryBtn = document.getElementById('quiz-retry');

      if (!quizSection || !optionsEl) {
        console.warn('[Quiz] Missing quiz container elements');
        return;
      }

      quizSection.style.display = 'block';

      const dataUrl = window.withBase ? window.withBase(`data/quizzes/${lesson.id}.json`) : `data/quizzes/${lesson.id}.json`;

      let quizData = null;
      try {
        const res = await fetch(dataUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        quizData = await res.json();
      } catch (err) {
        console.warn('[Quiz] No data quiz found for', lesson.id, '-', err.message);
        // Fallback to generic one-question quiz
        renderGenericQuiz(optionsEl, resultEl, submitBtn, retryBtn, lesson);
        return;
      }

      // Render data-driven quiz
      renderDataQuiz(optionsEl, resultEl, submitBtn, retryBtn, lesson, quizData);
    }
  };

  function renderGenericQuiz(optionsEl, resultEl, submitBtn, retryBtn, lesson) {
    optionsEl.innerHTML = [
      {id:'a', text:'A kind action'},
      {id:'b', text:'A harmful habit'},
      {id:'c', text:'A random guess'}
    ].map((o) => `
      <label class="quiz-choice-label">
        <input type="radio" name="quiz" value="${o.id}" style="width: 20px; height: 20px; cursor: pointer; margin: 0; flex-shrink: 0;">
        <span style="font-size: var(--text-base);">${o.text}</span>
      </label>`).join('');

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
        showResultSimple(resultEl, correct ? 1 : 0, 1);
        if (retryBtn) { 
          retryBtn.classList.toggle('hidden', correct); 
          retryBtn.style.display = correct ? 'none' : 'inline-block'; 
        }
        saveScore(lesson.id, correct ? 1 : 0, 1, lesson);
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
      };
    }
  }

  function scrollToFirstIncorrect(incorrectQIds) {
    if (incorrectQIds.length === 0) return;
    const firstId = incorrectQIds[0];
    const elem = document.querySelector(`.quiz-question-block[data-question-id="${firstId}"]`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.style.boxShadow = '0 0 0 3px rgba(239, 71, 111, 0.3)';
      setTimeout(() => {
        elem.style.boxShadow = '';
      }, 2000);
    }
  }

  function renderDataQuiz(optionsEl, resultEl, submitBtn, retryBtn, lesson, quizData) {
    const questionsHTML = quizData.questions.map(q => `
      <div class="quiz-question-block" data-question-id="${q.id}" style="padding: 20px; background: var(--color-surface, #fff); border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-md, 12px);">
        <p style="margin: 0 0 16px 0; font-weight: 700; font-size: 1.05em; color: var(--color-text, #2f1b0f);">${q.question}</p>
        <div class="quiz-choices" style="display: flex; flex-direction: column; gap: 8px;">
          ${q.choices.map((text, idx) => `
            <label class="quiz-choice-label" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 2px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 150ms ease; min-height: 44px; user-select: none;">
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
      <div id="quiz-results" class="hidden" style="display: none; margin-bottom: 24px;"></div>
      <div id="quiz-actions" style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button id="quiz-submit-btn" class="quiz-btn quiz-btn-primary">Submit Quiz</button>
        <button id="quiz-review-btn" class="quiz-btn quiz-btn-secondary hidden" style="display: none;">Review Answers</button>
        <button id="quiz-retry-btn" class="quiz-btn quiz-btn-secondary hidden" style="display: none;">Try Again</button>
      </div>
    `;

    const submitDataBtn = document.getElementById('quiz-submit-btn');
    const reviewDataBtn = document.getElementById('quiz-review-btn');
    const retryDataBtn = document.getElementById('quiz-retry-btn');

    submitDataBtn.addEventListener('click', () => {
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
        showResultsBox('⚠️ Please answer all questions before submitting.', 'warning');
        return;
      }

      let score = 0;
      const incorrectQIds = [];
      quizData.questions.forEach(q => {
        const isCorrect = answers[q.id] === q.correctIndex;
        if (isCorrect) {
          score++;
        } else {
          incorrectQIds.push(q.id);
        }
        const block = document.querySelector(`.quiz-question-block[data-question-id="${q.id}"]`);
        const feedback = block.querySelector('.quiz-feedback');
        feedback.classList.remove('hidden');
        feedback.style.display = 'block';
        feedback.style.background = isCorrect ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)';
        feedback.style.borderLeft = isCorrect ? '4px solid #06d6a0' : '4px solid #ef476f';
        feedback.style.color = isCorrect ? '#00a37a' : '#d0354a';
        feedback.innerHTML = `<strong>${isCorrect ? '✓ Correct' : '✗ Incorrect'}</strong><br>${q.explanation || ''}`;
      });

      const pass = score >= Math.ceil(quizData.questions.length * 0.7);
      showResultsBox(
        `<div style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Score: ${score}/${quizData.questions.length}</div>${pass ? '<strong style="color: #06d6a0;">✓ PASSED</strong> — Great work!' : '<strong style="color: #ef476f;">Not quite.</strong> Review the explanations and try again.'}`,
        pass ? 'success' : 'retry'
      );

      saveScore(lesson.id, score, quizData.questions.length, lesson);

      if (pass && window.TeenDeenConfetti) {
        setTimeout(() => window.TeenDeenConfetti.celebrate(), 300);
      }

      // Toggle action buttons
      submitDataBtn.style.display = 'none';
      if (incorrectQIds.length > 0) {
        reviewDataBtn.style.display = 'inline-flex';
        reviewDataBtn.onclick = () => scrollToFirstIncorrect(incorrectQIds);
      }
      retryDataBtn.style.display = 'inline-flex';
    });

    reviewDataBtn.addEventListener('click', () => {
      // Review button already has click handler, but ensure focus
      scrollToFirstIncorrect(
        Array.from(document.querySelectorAll('.quiz-feedback'))
          .filter(fb => fb.style.color === '#d0354a')
          .map(fb => fb.closest('.quiz-question-block').dataset.questionId)
      );
    });

    retryDataBtn.addEventListener('click', () => {
      quizData.questions.forEach(q => {
        document.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => radio.checked = false);
      });
      document.querySelectorAll('.quiz-feedback').forEach(fb => { fb.classList.add('hidden'); fb.style.display = 'none'; });
      const resultsDiv = document.getElementById('quiz-results');
      resultsDiv.style.display = 'none';
      reviewDataBtn.style.display = 'none';
      submitDataBtn.style.display = 'inline-flex';
      retryDataBtn.style.display = 'none';
    });
  }

  function showResultSimple(resultEl, score, total){
    if (!resultEl) return;
    resultEl.classList.remove('hidden');
    resultEl.style.display = 'block';
    const ok = score === total;
    resultEl.textContent = `Score: ${score}/${total} ${ok ? '✓ Great job — fully correct.' : 'Keep going — review the lesson and try again.'}`;
    resultEl.style.color = ok ? 'var(--color-primary)' : 'var(--color-secondary)';
  }

  function showResultsBox(message, type) {
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<div style="padding: 16px 20px; border-radius: var(--radius-md, 12px); ${getResultsStyle(type)}">${message}</div>`;
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
          window.TeenDeenCertificate.renderCertificatePanel({
            lessonId,
            lessonTitle: lesson.title || '',
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
