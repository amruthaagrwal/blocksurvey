import { dimensions, questions, recommendations } from './questions.js';
import { calculateScores, getRecommendations, evaluateResponseQuality } from './scoring.js';
import { submitSurvey, checkEmployeeIdExists, getSupabase } from './supabase-client.js';

// --- Utility: Lazy Loader ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// --- State Management ---
let state = {
    currentSection: 'intro', // intro, demographics, survey, results
    currentQuestionIndex: 0,
    startTime: null,
    demographics: {},
    answers: {}, // { question_id: 1 or 0 }
};

const UI = {
    introSection: document.getElementById('section-intro'),
    demoSection: document.getElementById('section-demographics'),
    surveySection: document.getElementById('section-survey'),
    questionsList: document.getElementById('questions-list'),
    btnSubmit: document.getElementById('btn-submit-main'),
    validationMsg: document.getElementById('validation-msg'),
    resultsSection: document.getElementById('section-results'),
    
    // Progress
    progressBar: document.getElementById('progress-bar-fill'),
    progressText: document.getElementById('progress-text'),
    
    // Forms
    demoForm: document.getElementById('demographics-form'),
    
    // Toast
    toast: document.getElementById('toast')
};

// --- Initialization ---
export async function initSurvey() {
    loadState();
    attachEventListeners();
    try {
        await applySettings();
    } catch (error) {
        console.warn("Failed to load survey settings:", error);
    }
    renderCurrentSection();
}

async function applySettings() {
    const sb = getSupabase();
    if (!sb) return;

    const { data, error } = await sb
        .from('settings')
        .select('*')
        .eq('id', 'global_settings')
        .single();

    if (!error && data) {
        // Update Titles
        document.title = data.survey_title;
        const titles = document.querySelectorAll('.title');
        titles.forEach(t => t.textContent = data.survey_title);

        // Show Banner
        if (data.announcement_banner) {
            const banner = document.createElement('div');
            banner.className = 'announcement-banner';
            banner.textContent = data.announcement_banner;
            document.body.prepend(banner);
        }

        // Check Status & Deadline
        const now = new Date();
        const deadlinePassed = data.deadline && new Date(data.deadline) < now;
        
        if (!data.is_active || deadlinePassed) {
            const startBtn = document.getElementById('btn-start-survey');
            startBtn.disabled = true;
            startBtn.textContent = deadlinePassed ? "Survey Deadline Passed" : "Survey Currently Inactive";
            
            const introContent = document.querySelector('#section-intro .content-block');
            const msg = document.createElement('div');
            msg.className = 'error-message mt-4';
            msg.textContent = deadlinePassed ? 
                "We are no longer accepting responses for this survey as the deadline has passed." : 
                "This survey is currently closed by the administrator.";
            introContent.prepend(msg);
        }
    }
}

// --- Event Listeners ---
function attachEventListeners() {
    document.getElementById('btn-start-survey').addEventListener('click', () => {
        setSection('survey');
    });

    if (UI.btnSubmit) {
        UI.btnSubmit.addEventListener('click', submitFinalSurvey);
    }
    
    // Resume Prompt
    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            document.getElementById('resume-prompt').style.display = 'none';
        });
    }
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            localStorage.removeItem('surveyState');
            location.reload();
        });
    }
    
    // PDF Download
    document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        // Keyboard navigation (optional for single page, but we can support jumping?)
        // For now, let's keep it simple and remove the broken step-based listeners.
    });
}

// --- Local Storage & Auto Save ---
function saveState() {
    localStorage.setItem('surveyState', JSON.stringify(state));
    showToast('Progress Saved ✓');
}

function loadState() {
    const saved = localStorage.getItem('surveyState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.currentSection === 'results') {
                // If they already finished, clear and restart to prevent duplicate view,
                // or optionally show them their results again. We will restart to be safe.
                localStorage.removeItem('surveyState');
                return;
            }
            state = { ...state, ...parsed };
            // Show resume prompt if they have progress
            if (Object.keys(state.answers).length > 0) {
                document.getElementById('resume-prompt').style.display = 'flex';
            }
        } catch (e) {
            console.error("Failed to parse saved state", e);
        }
    }
}

// --- Navigation ---
function setSection(sectionId) {
    state.currentSection = sectionId;
    saveState();
    renderCurrentSection();
}

function renderCurrentSection() {
    UI.introSection.style.display = 'none';
    UI.demoSection.style.display = 'none';
    UI.surveySection.style.display = 'none';
    UI.resultsSection.style.display = 'none';

    window.scrollTo(0, 0);

    if (state.currentSection === 'intro') {
        UI.introSection.style.display = 'block';
    } else if (state.currentSection === 'survey') {
        UI.surveySection.style.display = 'block';
        if (!state.startTime) state.startTime = Date.now();
        renderAllQuestions();
        window.addEventListener('scroll', handleScrollProgress);
    } else if (state.currentSection === 'results') {
        UI.resultsSection.style.display = 'block';
        // Lazy load Chart.js before rendering results
        loadScript('https://cdn.jsdelivr.net/npm/chart.js').then(renderResults);
    }
}

// --- Demographics Form ---
async function handleDemoSubmit(e) {
    e.preventDefault();
    
    // ─── 1. Custom Validation ────────────────────────────────────────────
    const form = UI.demoForm;
    const errorBanner = document.getElementById('demo-error-banner');
    const missingFields = [];

    // Clear previous error states
    form.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
    document.getElementById('langs-error').style.display = 'none';
    document.getElementById('skills-error').style.display = 'none';
    document.getElementById('langs-group').classList.remove('field-invalid');
    document.getElementById('skills-group').classList.remove('field-invalid');
    errorBanner.style.display = 'none';
    errorBanner.innerHTML = '';

    // Check all required inputs/selects/textareas
    const requiredEls = form.querySelectorAll('[required]');
    requiredEls.forEach(el => {
        const val = el.value.trim();
        if (!val) {
            el.classList.add('field-invalid');
            const labelEl = el.closest('.form-group')?.querySelector('label');
            const labelText = labelEl ? labelEl.childNodes[0].textContent.trim() : el.name;
            missingFields.push(labelText);
        }
    });

    // Check Languages Known checkbox group (at least one required)
    const langs = form.querySelectorAll('input[name="languages_known"]:checked');
    if (langs.length === 0) {
        document.getElementById('langs-error').style.display = 'inline';
        document.getElementById('langs-group').classList.add('field-invalid');
        missingFields.push('Languages Known');
    }

    // Check Computer Skills checkbox group (at least one required)
    const skills = form.querySelectorAll('input[name="computer_skills"]:checked');
    if (skills.length === 0) {
        document.getElementById('skills-error').style.display = 'inline';
        document.getElementById('skills-group').classList.add('field-invalid');
        missingFields.push('Computer Skills');
    }

    // If any missing, show banner and scroll to first error
    if (missingFields.length > 0) {
        errorBanner.style.display = 'block';
        errorBanner.innerHTML = `
            <strong>⚠ Please fill in all required fields (${missingFields.length} missing):</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem;">
                ${missingFields.map(f => `<li>${f}</li>`).join('')}
            </ul>
        `;
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Also focus first invalid element
        const firstInvalid = form.querySelector('.field-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
    }

    // ─── 2. Collect & Submit ─────────────────────────────────────────────
    const formData = new FormData(form);
    const demographics = Object.fromEntries(formData.entries());
    demographics.languages_known = formData.getAll('languages_known').map(v =>
        v === 'Other' ? (document.getElementById('lang-other-input').value.trim() || 'Other') : v
    );
    demographics.computer_skills = formData.getAll('computer_skills').map(v =>
        v === 'Other' ? (document.getElementById('skill-other-input').value.trim() || 'Other') : v
    );
    // Remove helper-only fields that are NOT columns in the DB
    delete demographics.languages_known_other;
    delete demographics.computer_skills_other;
    
    const btn = document.getElementById('btn-proceed-assessment');
    btn.disabled = true;
    btn.textContent = 'Checking...';
    
    try {
        const exists = await checkEmployeeIdExists(demographics.employee_id);
        if (exists) {
            alert("This Employee ID has already submitted an assessment.");
            btn.disabled = false;
            btn.textContent = 'Proceed to Assessment →';
            return;
        }
        
        state.demographics = demographics;
        setSection('survey');
    } catch (error) {
        alert("An error occurred verifying your Employee ID. Please check your connection.");
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Proceed to Assessment →';
    }
}

// --- Question Handling ---
function renderAllQuestions() {
    UI.questionsList.innerHTML = '';
    
    // Render all questions in a continuous list without dimension grouping (to avoid bias)
    questions.forEach((q, index) => {
        const qElement = document.createElement('div');
        qElement.className = 'question-item';
        qElement.id = `q-item-${q.id}`;
        
        const isAnswered = state.answers[q.id] !== undefined;
        if (!isAnswered) qElement.classList.add('unanswered');

        qElement.innerHTML = `
            <div class="question-row">
                <div class="question-text-small">${index + 1}. ${q.text}</div>
                <div class="options-group">
                    <button class="choice-btn ${state.answers[q.id] === 1 ? 'selected-yes' : ''}" 
                            onclick="window.surveyAction.handleChoice(${q.id}, 1)">Yes</button>
                    <button class="choice-btn ${state.answers[q.id] === 0 ? 'selected-no' : ''}" 
                            onclick="window.surveyAction.handleChoice(${q.id}, 0)">No</button>
                </div>
            </div>
        `;
        UI.questionsList.appendChild(qElement);
    });

    updateProgress();
}

// Global hook for the buttons since we are using innerHTML strings
window.surveyAction = {
    handleChoice: (qId, val) => {
        state.answers[qId] = val;
        saveState();
        
        // Update UI
        const item = document.getElementById(`q-item-${qId}`);
        item.classList.remove('unanswered');
        item.classList.remove('unanswered-pulse');
        
        const btns = item.querySelectorAll('.choice-btn');
        btns[0].className = `choice-btn ${val === 1 ? 'selected-yes' : ''}`;
        btns[1].className = `choice-btn ${val === 0 ? 'selected-no' : ''}`;
        
        updateProgress();
    }
};

function handleScrollProgress() {
    if (state.currentSection !== 'survey') return;
    
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    // Smoothly update the progress bar based on scroll
    // We mix it with answered count to give the most accurate feeling
    const answeredCount = Object.keys(state.answers).length;
    const totalCount = questions.length;
    const answeredPercent = (answeredCount / totalCount) * 100;
    
    // Use the maximum of scroll and answered to ensure progress always looks forward
    const displayedPercent = Math.max(scrolled, answeredPercent);
    UI.progressBar.style.width = `${displayedPercent}%`;
}



function updateProgress() {
    const total = questions.length;
    const answered = Object.keys(state.answers).length;
    const percentage = (answered / total) * 100;
    
    UI.progressBar.style.width = `${percentage}%`;
    UI.progressText.textContent = `${answered} / ${total} Questions Answered`;
}

// --- Submission ---
async function submitFinalSurvey() {
    // Find unanswered questions
    const unansweredIndices = [];
    questions.forEach((q, index) => {
        if (state.answers[q.id] === undefined) {
            unansweredIndices.push(index);
        }
    });

    if (unansweredIndices.length > 0) {
        UI.validationMsg.style.display = 'block';
        UI.validationMsg.textContent = `Please answer all questions. You have ${unansweredIndices.length} questions remaining.`;
        
        // Highlight and jump to the first unanswered question
        const firstMissing = questions[unansweredIndices[0]].id;
        const element = document.getElementById(`q-item-${firstMissing}`);
        
        // Add pulse effect to all unanswered questions
        unansweredIndices.forEach(idx => {
            const qId = questions[idx].id;
            document.getElementById(`q-item-${qId}`).classList.add('unanswered-pulse');
        });

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    UI.validationMsg.style.display = 'none';

    const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const qualityFlag = evaluateResponseQuality(state.answers, durationSeconds);
    const scores = calculateScores(state.answers);

    // Prepare data payload
    const payload = {
        respondent: {
            start_time: new Date(state.startTime).toISOString(),
            end_time: new Date().toISOString(),
            duration_seconds: durationSeconds,
            total_score: scores.totalScore,
            quality_flag: qualityFlag
        },
        responses: Object.entries(state.answers).map(([qId, ans]) => ({
            question_number: parseInt(qId),
            answer: ans
        })),
        dimensionScores: scores.dimensionScores
    };

    UI.btnSubmit.disabled = true;
    UI.btnSubmit.textContent = 'Submitting...';

    try {
        const result = await submitSurvey(payload);

        if (result.success) {
            state.scores = scores; // Save scores to state for results page
            setSection('results');
            localStorage.removeItem('surveyState'); // Clear local storage to prevent resubmission
        } else {
            throw new Error(result.error?.message || "Database error");
        }
    } catch (error) {
        console.error("Submission Error:", error);
        alert("Error submitting survey: " + error.message + "\nPlease check your connection and try again.");
        UI.btnSubmit.disabled = false;
        UI.btnSubmit.textContent = 'Submit Assessment';
    }
}

// --- Results Rendering ---
function renderResults() {
    const { totalScore, dimensionScores, topStrengths, topBlockages } = state.scores;
    
    // 1. Total Score Text
    const scoreText = document.getElementById('score-text');
    if (scoreText) scoreText.textContent = `${totalScore} / 110`;
    
    // 2. Clear previous dynamic content if any
    const interpSummary = document.getElementById('interpretation-summary');
    const strengthsList = document.getElementById('strengths-list');
    const blockagesList = document.getElementById('blockages-list');
    
    if (interpSummary) interpSummary.innerHTML = '';
    if (strengthsList) strengthsList.innerHTML = '';
    if (blockagesList) blockagesList.innerHTML = '';

    // 3. Render Strengths Cards
    strengthsList.innerHTML = topStrengths.map(s => `
        <div class="result-card strength-area" style="border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 1.25rem; margin-bottom: 1rem; border-radius: 8px;">
            <h4 style="color: #10b981; font-size: 1.1rem;">${s.dimension_name} (${s.score}/10)</h4>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; font-style: italic; color: var(--text-muted);">${s.description}</p>
            <p style="font-size: 0.95rem; margin-top: 0.75rem; font-weight: 500;">${s.strengthMsg}</p>
        </div>
    `).join('');
    
    // 4. Render Blockages Cards
    blockagesList.innerHTML = topBlockages.map(b => `
        <div class="result-card blockage-area" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05); padding: 1.25rem; margin-bottom: 1rem; border-radius: 8px;">
            <h4 style="color: #ef4444; font-size: 1.1rem;">${b.dimension_name} (${b.score}/10)</h4>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; font-style: italic; color: var(--text-muted);">${b.description}</p>
            <p style="font-size: 0.95rem; margin-top: 0.75rem; font-weight: 500;"><strong>Why it's a blockage:</strong> ${b.blockageMsg}</p>
        </div>
    `).join('');

    // 5. Narrative & Suggestions Roadmap
    if (interpSummary) {
        interpSummary.innerHTML = `
            <div class="analysis-roadmap">
                <h3 style="margin-bottom: 1rem;">Analysis & Development Roadmap</h3>
                <p class="narrative-text">
                    Your assessment reveals primary strengths in <strong>${topStrengths.map(s => s.dimension_name).join(', ')}</strong>. 
                    Targeting <strong>${topBlockages.map(b => b.dimension_name).join(', ')}</strong> will provide the highest return on your personal development efforts.
                </p>
                
                <div class="roadmap-box mt-4" style="background: var(--secondary); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 1.25rem; color: var(--primary);">💡 Personalized Improvement Tips</h4>
                    ${topBlockages.map(b => `
                        <div style="margin-bottom: 1.5rem;">
                            <h5 style="color: var(--text-color); margin-bottom: 0.5rem;">${b.dimension_name}:</h5>
                            <ul style="padding-left: 1.5rem; color: var(--text-muted);">
                                ${getRecommendations(b.dimension_key, b.score).map(tip => `<li style="margin-bottom: 0.4rem;">${tip}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 6. Dimension Breakdown Table (Insert into PDF content)
    const existingTable = document.getElementById('full-dimension-table');
    if (existingTable) existingTable.remove();
    
    const tableDiv = document.createElement('div');
    tableDiv.id = 'full-dimension-table';
    tableDiv.className = 'glass-card p-4 mt-4';
    tableDiv.innerHTML = `
        <h3 style="margin-bottom: 1.5rem;">Dimension Performance Matrix</h3>
        <div class="table-responsive">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); text-align: left; background: rgba(0,0,0,0.05);">
                        <th style="padding: 1rem;">Dimension</th>
                        <th style="padding: 1rem; text-align: center;">Score</th>
                        <th style="padding: 1rem; text-align: center;">%</th>
                        <th style="padding: 1rem; text-align: right;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${dimensionScores.map(d => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 1rem; font-weight: 600;">${d.dimension_name}</td>
                            <td style="padding: 1rem; text-align: center;">${d.score}/10</td>
                            <td style="padding: 1rem; text-align: center;">${d.percentage}%</td>
                            <td style="padding: 1rem; text-align: right;">
                                <span style="color: ${d.score >= 8 ? '#10b981' : (d.score >= 5 ? '#f59e0b' : '#ef4444')}; font-weight: 700;">
                                    ${d.interpretation}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    document.getElementById('pdf-content').appendChild(tableDiv);

    // 7. Radar Chart
    renderRadarChart(dimensionScores);
    
    // 8. Wire up PDF Button
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
        btnPdf.onclick = downloadPDF;
    }
}

function renderRadarChart(dimensionScores) {
    const ctx = document.getElementById('results-chart');
    if (!ctx) return;
    
    const labels = dimensionScores.map(d => d.dimension_name);
    const data = dimensionScores.map(d => d.score);
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dimension Score',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 2 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- Utility ---
function showToast(msg) {
    UI.toast.textContent = msg;
    UI.toast.classList.add('show');
    setTimeout(() => {
        UI.toast.classList.remove('show');
    }, 3000);
}

async function downloadPDF() {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    const cleanEmpId = 'blockage_survey';
    
    const opt = {
      margin:       [10, 5, 10, 5],
      filename:     `Blockage_Survey_Report_${cleanEmpId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    try {
        showToast("Generating PDF report...");
        
        // Load html2pdf if not already present
        if (!window.html2pdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
        }
        
        // Wait a tiny bit for all renders to settle
        await new Promise(r => setTimeout(r, 500));
        
        if (window.html2pdf) {
            await window.html2pdf().set(opt).from(element).save();
            showToast("PDF Downloaded Successfully!");
        } else {
            throw new Error("PDF library failed to load.");
        }
    } catch (err) {
        console.error("PDF Error:", err);
        alert("Failed to generate PDF. You can try taking a screenshot or printing the page (Ctrl+P).");
    }
}
