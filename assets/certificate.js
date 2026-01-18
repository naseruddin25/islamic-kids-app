/**
 * CERTIFICATE.JS - Certificate of Completion Generation
 * Generates downloadable PDF and PNG certificates for completed lessons
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    passThreshold: 4, // Minimum score to pass (out of 5)
    storageKeys: {
      studentName: 'teenDeen.studentName',
      scorePrefix: 'teenDeen.',
      passedSuffix: '.passed',
      completedAtSuffix: '.completedAt'
    }
  };

  // State
  const state = {
    currentLesson: null,
    initialized: false
  };

  /**
   * Initialize certificate system
   */
  function initCertificate() {
    if (state.initialized) return;
    console.log('[Certificate] Initializing...');
    state.initialized = true;
  }

  /**
   * Check if student passed the lesson
   */
  function checkIfPassed(lessonId, score, total) {
    const passed = score >= config.passThreshold;
    
    // Store pass status and completion date
    try {
      localStorage.setItem(
        config.storageKeys.scorePrefix + lessonId + config.storageKeys.passedSuffix,
        passed.toString()
      );
      
      if (passed) {
        const now = new Date().toISOString();
        localStorage.setItem(
          config.storageKeys.scorePrefix + lessonId + config.storageKeys.completedAtSuffix,
          now
        );
      }
    } catch (e) {
      console.warn('[Certificate] Could not save pass status:', e);
    }
    
    return passed;
  }

  /**
   * Render certificate panel on the page
   */
  function renderCertificatePanel({ lessonId, lessonTitle, score, total, passed }) {
    // Check if panel already exists
    if (document.getElementById('certificate-panel')) {
      console.log('[Certificate] Panel already exists');
      return;
    }

    if (!passed) {
      console.log('[Certificate] Not passed, no certificate panel');
      return;
    }

    state.currentLesson = { lessonId, lessonTitle, score, total };

    // Find where to insert (after quiz section)
    const quizSection = document.getElementById('quiz-section');
    if (!quizSection) {
      console.warn('[Certificate] Quiz section not found');
      return;
    }

    // Create certificate panel
    const panel = document.createElement('section');
    panel.className = 'content-section';
    panel.id = 'certificate-panel';
    panel.innerHTML = `
      <div class="certificate-panel">
        <div class="certificate-header">
          <span class="certificate-icon">🎓</span>
          <h3 class="certificate-title">Congratulations! You Passed!</h3>
        </div>
        
        <p class="certificate-description">
          You've successfully completed this lesson with a score of <strong>${score}/${total}</strong>. 
          Generate your personalized certificate to celebrate your achievement!
        </p>
        
        <div>
          <label for="student-name-input" style="display: block; font-weight: 600; margin-bottom: 8px;">
            Your Name:
          </label>
          <input 
            type="text" 
            id="student-name-input" 
            class="certificate-name-input"
            placeholder="Enter your full name"
            value="${getSavedStudentName()}"
          >
          <div id="name-error" class="certificate-error certificate-hidden"></div>
        </div>
        
        <div class="certificate-actions">
          <button id="generate-pdf-btn" class="certificate-btn certificate-btn-primary">
            <span>📄</span>
            <span>Download PDF Certificate</span>
          </button>
          
          <button id="generate-png-btn" class="certificate-btn certificate-btn-secondary">
            <span>🖼️</span>
            <span>Download PNG</span>
          </button>
          
          <button id="share-certificate-btn" class="certificate-btn certificate-btn-share certificate-hidden">
            <span>📤</span>
            <span>Share</span>
          </button>
        </div>
        
        <div id="certificate-success" class="certificate-success certificate-hidden">
          <span>✅</span>
          <span>Certificate generated successfully!</span>
        </div>
      </div>
    `;

    // Insert after quiz section
    quizSection.parentNode.insertBefore(panel, quizSection.nextSibling);

    // Attach event listeners
    attachCertificateListeners();

    // Show share button if Web Share API is supported
    if (navigator.share) {
      const shareBtn = document.getElementById('share-certificate-btn');
      if (shareBtn) {
        shareBtn.classList.remove('certificate-hidden');
      }
    }

    console.log('[Certificate] Panel rendered');
  }

  /**
   * Get saved student name from localStorage
   */
  function getSavedStudentName() {
    try {
      return localStorage.getItem(config.storageKeys.studentName) || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Save student name to localStorage
   */
  function saveStudentName(name) {
    try {
      localStorage.setItem(config.storageKeys.studentName, name);
    } catch (e) {
      console.warn('[Certificate] Could not save student name:', e);
    }
  }

  /**
   * Validate student name
   */
  function validateName(name) {
    const trimmed = name.trim();
    
    if (!trimmed || trimmed.length < 2) {
      return { valid: false, error: 'Please enter your full name (at least 2 characters)' };
    }
    
    return { valid: true, name: trimmed };
  }

  /**
   * Attach event listeners to certificate buttons
   */
  function attachCertificateListeners() {
    const pdfBtn = document.getElementById('generate-pdf-btn');
    const pngBtn = document.getElementById('generate-png-btn');
    const shareBtn = document.getElementById('share-certificate-btn');

    if (pdfBtn) pdfBtn.addEventListener('click', handleGeneratePDF);
    if (pngBtn) pngBtn.addEventListener('click', handleGeneratePNG);
    if (shareBtn) shareBtn.addEventListener('click', handleShare);
  }

  /**
   * Handle PDF generation
   */
  async function handleGeneratePDF() {
    const nameInput = document.getElementById('student-name-input');
    const errorDiv = document.getElementById('name-error');
    const btn = document.getElementById('generate-pdf-btn');
    
    const validation = validateName(nameInput.value);
    
    if (!validation.valid) {
      errorDiv.textContent = validation.error;
      errorDiv.classList.remove('certificate-hidden');
      nameInput.focus();
      return;
    }
    
    errorDiv.classList.add('certificate-hidden');
    saveStudentName(validation.name);
    
    // Show loading
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
      await generateCertificatePDF(validation.name);
      showSuccess();
    } catch (error) {
      console.error('[Certificate] PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /**
   * Handle PNG generation
   */
  async function handleGeneratePNG() {
    const nameInput = document.getElementById('student-name-input');
    const errorDiv = document.getElementById('name-error');
    const btn = document.getElementById('generate-png-btn');
    
    const validation = validateName(nameInput.value);
    
    if (!validation.valid) {
      errorDiv.textContent = validation.error;
      errorDiv.classList.remove('certificate-hidden');
      nameInput.focus();
      return;
    }
    
    errorDiv.classList.add('certificate-hidden');
    saveStudentName(validation.name);
    
    // Show loading
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
      await generateCertificatePNG(validation.name);
      showSuccess();
    } catch (error) {
      console.error('[Certificate] PNG generation failed:', error);
      alert('Failed to generate PNG. Please try again.');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /**
   * Handle share
   */
  async function handleShare() {
    const nameInput = document.getElementById('student-name-input');
    const errorDiv = document.getElementById('name-error');
    const btn = document.getElementById('share-certificate-btn');
    
    const validation = validateName(nameInput.value);
    
    if (!validation.valid) {
      errorDiv.textContent = validation.error;
      errorDiv.classList.remove('certificate-hidden');
      nameInput.focus();
      return;
    }
    
    errorDiv.classList.add('certificate-hidden');
    saveStudentName(validation.name);
    
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
      await shareCertificate(validation.name);
    } catch (error) {
      console.error('[Certificate] Share failed:', error);
      alert('Failed to share certificate. Please download it instead.');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /**
   * Generate PDF certificate using jsPDF
   */
  async function generateCertificatePDF(studentName) {
    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
      throw new Error('jsPDF library not loaded');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const { lessonId, lessonTitle, score, total } = state.currentLesson;
    const completedDate = getCompletionDate(lessonId);

    // Certificate dimensions
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Draw border
    doc.setDrawColor(255, 209, 102); // Primary color
    doc.setLineWidth(3);
    doc.rect(margin, margin, width - 2 * margin, height - 2 * margin);
    
    doc.setLineWidth(1);
    doc.rect(margin + 5, margin + 5, width - 2 * (margin + 5), height - 2 * (margin + 5));

    // Teen Deen logo text
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 159, 67); // Orange
    doc.text('Teen Deen', width / 2, margin + 20, { align: 'center' });

    // Certificate of Completion
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(47, 27, 15); // Dark text
    doc.text('Certificate of Completion', width / 2, margin + 40, { align: 'center' });

    // Decorative line
    doc.setDrawColor(6, 214, 160); // Secondary color
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 40, margin + 45, width / 2 + 40, margin + 45);

    // This certifies that
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 90, 77); // Muted text
    doc.text('This certifies that', width / 2, margin + 58, { align: 'center' });

    // Student name
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 159, 67); // Orange
    doc.text(studentName, width / 2, margin + 72, { align: 'center' });

    // has successfully completed
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 90, 77);
    doc.text('has successfully completed', width / 2, margin + 85, { align: 'center' });

    // Lesson title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(47, 27, 15);
    doc.text(lessonTitle, width / 2, margin + 98, { align: 'center' });

    // Lesson ID
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(108, 90, 77);
    doc.text(`(${lessonId})`, width / 2, margin + 106, { align: 'center' });

    // Score and date
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(47, 27, 15);
    doc.text(`Score: ${score}/${total}`, width / 2 - 30, height - margin - 20, { align: 'center' });
    doc.text(`Date: ${completedDate}`, width / 2 + 30, height - margin - 20, { align: 'center' });

    // Save PDF
    const filename = `TeenDeen-Certificate-${lessonId}-${studentName.replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);

    console.log('[Certificate] PDF generated:', filename);
  }

  /**
   * Generate PNG certificate using Canvas
   */
  async function generateCertificatePNG(studentName) {
    const { lessonId, lessonTitle, score, total } = state.currentLesson;
    const completedDate = getCompletionDate(lessonId);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1122; // A4 landscape at 96 DPI
    canvas.height = 794;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Teen Deen logo
    ctx.fillStyle = '#ff9f43';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Teen Deen', canvas.width / 2, 130);

    // Certificate of Completion
    ctx.fillStyle = '#2f1b0f';
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 220);

    // Decorative line
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, 240);
    ctx.lineTo(canvas.width / 2 + 150, 240);
    ctx.stroke();

    // This certifies that
    ctx.fillStyle = '#6c5a4d';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('This certifies that', canvas.width / 2, 300);

    // Student name
    ctx.fillStyle = '#ff9f43';
    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillText(studentName, canvas.width / 2, 370);

    // has successfully completed
    ctx.fillStyle = '#6c5a4d';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('has successfully completed', canvas.width / 2, 430);

    // Lesson title
    ctx.fillStyle = '#2f1b0f';
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.fillText(lessonTitle, canvas.width / 2, 490);

    // Lesson ID
    ctx.fillStyle = '#6c5a4d';
    ctx.font = 'italic 24px Arial, sans-serif';
    ctx.fillText(`(${lessonId})`, canvas.width / 2, 525);

    // Score and date
    ctx.fillStyle = '#2f1b0f';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText(`Score: ${score}/${total}`, canvas.width / 2 - 150, canvas.height - 80);
    ctx.fillText(`Date: ${completedDate}`, canvas.width / 2 + 150, canvas.height - 80);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TeenDeen-Certificate-${lessonId}-${studentName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[Certificate] PNG generated');
    }, 'image/png');
  }

  /**
   * Share certificate using Web Share API
   */
  async function shareCertificate(studentName) {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    const { lessonId, lessonTitle, score, total } = state.currentLesson;

    // Generate PDF as blob
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Same certificate generation as PDF (reusing logic)
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 20;
    const completedDate = getCompletionDate(lessonId);

    doc.setDrawColor(255, 209, 102);
    doc.setLineWidth(3);
    doc.rect(margin, margin, width - 2 * margin, height - 2 * margin);
    doc.setLineWidth(1);
    doc.rect(margin + 5, margin + 5, width - 2 * (margin + 5), height - 2 * (margin + 5));

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 159, 67);
    doc.text('Teen Deen', width / 2, margin + 20, { align: 'center' });

    doc.setFontSize(32);
    doc.setTextColor(47, 27, 15);
    doc.text('Certificate of Completion', width / 2, margin + 40, { align: 'center' });

    doc.setDrawColor(6, 214, 160);
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 40, margin + 45, width / 2 + 40, margin + 45);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 90, 77);
    doc.text('This certifies that', width / 2, margin + 58, { align: 'center' });

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 159, 67);
    doc.text(studentName, width / 2, margin + 72, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 90, 77);
    doc.text('has successfully completed', width / 2, margin + 85, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(47, 27, 15);
    doc.text(lessonTitle, width / 2, margin + 98, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(108, 90, 77);
    doc.text(`(${lessonId})`, width / 2, margin + 106, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(47, 27, 15);
    doc.text(`Score: ${score}/${total}`, width / 2 - 30, height - margin - 20, { align: 'center' });
    doc.text(`Date: ${completedDate}`, width / 2 + 30, height - margin - 20, { align: 'center' });

    // Get PDF as blob
    const pdfBlob = doc.output('blob');
    const filename = `TeenDeen-Certificate-${lessonId}-${studentName.replace(/\s+/g, '-')}.pdf`;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    // Share
    try {
      await navigator.share({
        files: [file],
        title: 'Teen Deen Certificate',
        text: `I completed "${lessonTitle}" with a score of ${score}/${total}!`
      });
      console.log('[Certificate] Shared successfully');
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }

  /**
   * Get formatted completion date
   */
  function getCompletionDate(lessonId) {
    try {
      const dateStr = localStorage.getItem(
        config.storageKeys.scorePrefix + lessonId + config.storageKeys.completedAtSuffix
      );
      
      if (dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (e) {
      console.warn('[Certificate] Could not get completion date:', e);
    }
    
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Show success message
   */
  function showSuccess() {
    const successDiv = document.getElementById('certificate-success');
    if (successDiv) {
      successDiv.classList.remove('certificate-hidden');
      setTimeout(() => {
        successDiv.classList.add('certificate-hidden');
      }, 5000);
    }
  }

  // Expose public API
  window.TeenDeenCertificate = {
    init: initCertificate,
    checkIfPassed: checkIfPassed,
    renderCertificatePanel: renderCertificatePanel
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCertificate);
  } else {
    initCertificate();
  }
})();
