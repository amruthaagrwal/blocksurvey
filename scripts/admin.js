// scripts/admin.js
import { getSupabase, adminLogin, adminLogout, getSession } from './supabase-client.js';
import { exportToCSV, exportToExcel } from './export.js';
import { dimensions } from './questions.js';

// --- Utility: Lazy Loader ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') return resolve();
        if (document.querySelector(`script[src="${src}"]`)) {
            // Script tag exists but may still be loading
            const check = setInterval(() => {
                if (typeof Chart !== 'undefined') { clearInterval(check); resolve(); }
            }, 50);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

let rawRespondents = [];
let rawDimensionScores = [];
let sortConfig = { key: 'created_at', direction: 'desc' };
let charts = {}; // To store chart instances for cleanup

const UI = {
    btnLogout: document.getElementById('admin-logout'),
    navItems: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    
    // Stats
    statTotal: document.getElementById('stat-total'),
    statAvgScore: document.getElementById('stat-avg-score'),
    statHighScore: document.getElementById('stat-high-score'),
    statAvgTime: document.getElementById('stat-avg-time'),
    
    // Filters
    searchInput: document.getElementById('search-input'),
    filterRegion: document.getElementById('filter-region'),
    filterVertical: document.getElementById('filter-vertical'),
    filterQuality: document.getElementById('filter-quality'),
    
    // Table
    tbody: document.getElementById('respondents-tbody'),
    btnExport: document.getElementById('btn-export-csv'),
    btnExportExcel: document.getElementById('btn-export-excel'),
    settingsForm: document.getElementById('admin-settings-form'),

    // Modal
    detailsModal: document.getElementById('details-modal'),
    detailsContent: document.getElementById('details-content'),
    btnCloseDetails: document.getElementById('btn-close-details'),
};

export async function initAdmin() {
    attachEventListeners();
    fetchData();
}

function attachEventListeners() {
    UI.navItems.forEach(item => {
        item.addEventListener('click', () => {
            UI.navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            UI.viewSections.forEach(v => v.style.display = 'none');
            const target = document.getElementById(targetId);
            if (target) target.style.display = 'block';
        });
    });

    // Filtering
    [UI.searchInput, UI.filterRegion, UI.filterVertical, UI.filterQuality].forEach(el => {
        if (el) el.addEventListener('input', renderTable);
    });

    UI.btnExport.addEventListener('click', () => handleExport('csv'));
    UI.btnExportExcel.addEventListener('click', () => handleExport('excel'));

    UI.btnCloseDetails.addEventListener('click', () => {
        UI.detailsModal.style.display = 'none';
    });

    UI.settingsForm.addEventListener('submit', handleSettingsSubmit);
}

async function fetchData() {
    const sb = getSupabase();
    if (!sb) {
        console.warn('Supabase not configured; using mock data for admin dashboard.');
        rawRespondents = [];
        rawDimensionScores = [];
        updateOverview();
        renderTable();
        renderAnalytics();
        fetchSettings();
        return;
    }
    
    try {
        const { data: respondents, error: rError } = await sb.from('respondents').select('*');
        if (rError) throw rError;
        rawRespondents = respondents || [];

        const { data: scores, error: sError } = await sb.from('dimension_scores').select('*');
        if (sError) throw sError;
        rawDimensionScores = scores || [];

        await loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        updateOverview();
        renderTable();
        fetchSettings();
        renderAnalytics();
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        alert(`Failed to load dashboard data: ${error.message || 'Unknown Error'}. Please ensure Supabase RLS allows read access.`);
    }
}

function updateOverview() {
    if (rawRespondents.length === 0) return;
    UI.statTotal.textContent = rawRespondents.length;
    
    const avgScore = rawRespondents.reduce((acc, r) => acc + (r.total_score || 0), 0) / rawRespondents.length;
    UI.statAvgScore.textContent = Math.round(avgScore);
    
    const maxScore = Math.max(...rawRespondents.map(r => r.total_score || 0));
    UI.statHighScore.textContent = maxScore;
    
    const avgTime = rawRespondents.reduce((acc, r) => acc + (r.duration_seconds || 0), 0) / rawRespondents.length;
    UI.statAvgTime.textContent = `${Math.floor(avgTime/60)}m ${Math.round(avgTime%60)}s`;

    // Overview Chart (Averages per Dimension)
    const dimStats = {};
    rawDimensionScores.forEach(s => {
        if (!dimStats[s.dimension_name]) dimStats[s.dimension_name] = { sum: 0, count: 0 };
        dimStats[s.dimension_name].sum += s.score;
        dimStats[s.dimension_name].count++;
    });

    const labels = Object.keys(dimStats);
    const averages = labels.map(l => dimStats[l].sum / dimStats[l].count);

    const ctx = document.getElementById('overview-chart');
    if (ctx) {
        if (charts.overview) charts.overview.destroy();
        charts.overview = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg Score',
                    data: averages,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)'
                }]
            },
            options: { scales: { y: { beginAtZero: true, max: 10 } } }
        });
    }
}

function renderTable() {
    const term = UI.searchInput.value.toLowerCase();
    const regionFilter = UI.filterRegion.value.trim().toLowerCase();
    const vertical = UI.filterVertical.value;
    const quality = UI.filterQuality.value;

    const filtered = rawRespondents.filter(r => {
        const matchSearch = r.full_name?.toLowerCase().includes(term) || r.employee_id?.toLowerCase().includes(term);
        const matchRegion = regionFilter ? (r.region && r.region.toLowerCase().includes(regionFilter)) : true;
        const matchVertical = vertical ? r.vertical === vertical : true;
        const matchQuality = quality ? r.quality_flag === quality : true;
        return matchSearch && matchRegion && matchVertical && matchQuality;
    });

    filtered.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    UI.tbody.innerHTML = filtered.map((r, i) => `
        <tr>
            <td>${r.employee_id || '-'}</td>
            <td><strong>${r.full_name || 'Anonymous'}</strong></td>
            <td>${r.vertical || '-'}</td>
            <td>${r.region || '-'}</td>
            <td>${r.total_score}</td>
            <td><span class="quality-badge quality-${(r.quality_flag || 'Good').toLowerCase()}">${r.quality_flag || '-'}</span></td>
            <td>${new Date(r.created_at).toLocaleDateString()}</td>
            <td style="display:flex; gap:0.4rem; align-items:center;">
                <button class="btn-view-details" onclick="window.viewRespondentDetails('${r.id}')">View</button>
                <button class="btn-delete-row" onclick="window.deleteRespondent('${r.id}', '${(r.full_name || 'Respondent ' + (i+1))?.replace(/'/g, "\\'")}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.viewRespondentDetails = async (id) => {
    const respondent = rawRespondents.find(r => r.id === id);
    const sb = getSupabase();
    
    UI.detailsContent.innerHTML = '<div class="loading-spinner">Loading respondent data...</div>';
    UI.detailsModal.style.display = 'flex';

    try {
        // Fetch detailed scores and ALL 110 answers
        const [{ data: scores }, { data: answers }] = await Promise.all([
            sb.from('dimension_scores').select('*').eq('respondent_id', id),
            sb.from('responses').select('*').eq('respondent_id', id).order('question_number', { ascending: true })
        ]);

        // Calculate Strengths and Blockages
        const sortedScores = [...scores].sort((a, b) => b.score - a.score);
        const strengths = sortedScores.slice(0, 3).map(s => s.dimension_name);
        const blockages = [...sortedScores].reverse().slice(0, 3).map(s => s.dimension_name);

        UI.detailsContent.innerHTML = `
            <div class="details-grid">
                <div class="details-main">
                    <section class="mb-4">
                        <h3 class="section-subtitle">Participant Profile</h3>
                        <div class="profile-grid-detailed">
                            <div class="profile-item"><strong>Full Name:</strong> ${respondent.full_name || 'Anonymous'}</div>
                            <div class="profile-item"><strong>Employee ID:</strong> ${respondent.employee_id || '-'}</div>
                        </div>
                    </section>

                    <div class="analysis-row-detailed mb-4">
                        <div class="analysis-box strength-box">
                            <h4>Top 3 Strengths</h4>
                            <ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                        </div>
                        <div class="analysis-box blockage-box">
                            <h4>Top 3 Blockages</h4>
                            <ul>${blockages.map(s => `<li>${s}</li>`).join('')}</ul>
                        </div>
                    </div>
                    
                    <section class="mb-4">
                        <h3 class="section-subtitle">Dimension-wise Scores</h3>
                        <div class="scores-table-container">
                            <table class="mini-table">
                                <thead><tr><th>Dimension</th><th>Score</th><th>Interpretation</th></tr></thead>
                                <tbody>
                                    ${scores.map(s => `
                                        <tr>
                                            <td>${s.dimension_name}</td>
                                            <td><strong>${s.score}/10</strong></td>
                                            <td><span class="status-${s.interpretation.toLowerCase().replace(/ /g, '-')}">${s.interpretation}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section class="mb-4">
                        <h3 class="section-subtitle">Individual Responses (110 Items)</h3>
                        <div class="responses-raw-grid">
                            ${answers.map(a => `
                                <div class="response-chip ${a.answer === 1 ? 'res-yes' : 'res-no'}">
                                    <span class="q-num">Q${a.question_number}:</span>
                                    <span class="q-ans">${a.answer === 1 ? 'Yes' : 'No'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                </div>
                
                <div class="details-side">
                    <div class="stat-card glass-card">
                        <h3>Total Score</h3>
                        <div class="stat-value">${respondent.total_score}</div>
                        <p class="text-muted">out of 110</p>
                    </div>
                    <div class="stat-card glass-card mt-3">
                        <h3>Quality Check</h3>
                        <div class="quality-badge quality-${respondent.quality_flag.toLowerCase()}">${respondent.quality_flag}</div>
                        <p class="text-muted small mt-2">Duration: ${Math.floor(respondent.duration_seconds/60)}m ${respondent.duration_seconds%60}s</p>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        UI.detailsContent.innerHTML = `<div class="error-message">Error loading details: ${err.message}</div>`;
    }
};

window.deleteRespondent = async (id, name) => {
    const confirmed = window.confirm(`Delete response from "${name}"?\n\nThis will permanently remove all their answers and scores. This cannot be undone.`);
    if (!confirmed) return;

    const sb = getSupabase();
    if (!sb) { alert('Supabase not configured.'); return; }

    try {
        // Delete child records first to avoid FK constraint errors
        const { error: rErr } = await sb.from('responses').delete().eq('respondent_id', id);
        if (rErr) throw rErr;

        const { error: sErr } = await sb.from('dimension_scores').delete().eq('respondent_id', id);
        if (sErr) throw sErr;

        const { error: dErr } = await sb.from('respondents').delete().eq('id', id);
        if (dErr) throw dErr;

        // Remove from local data arrays and re-render
        rawRespondents = rawRespondents.filter(r => r.id !== id);
        rawDimensionScores = rawDimensionScores.filter(s => s.respondent_id !== id);

        updateOverview();
        renderTable();
        renderAnalytics();

        // Show brief success toast
        const toast = document.createElement('div');
        toast.textContent = `✓ Deleted response from "${name}"`;
        toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:0.75rem 1.5rem;border-radius:8px;z-index:99999;font-weight:600;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

    } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete: ' + err.message);
    }
};

function renderAnalytics() {
    // 1. CH vs SFM Comparison
    const verticalStats = { CH: { sum: 0, count: 0 }, SFM: { sum: 0, count: 0 } };
    rawRespondents.forEach(r => {
        if (verticalStats[r.vertical]) {
            verticalStats[r.vertical].sum += r.total_score;
            verticalStats[r.vertical].count++;
        }
    });

    const ctxV = document.getElementById('vertical-distribution-chart'); // Match index.html ID
    if (ctxV) {
        if (charts.vertical) charts.vertical.destroy();
        charts.vertical = new Chart(ctxV, {
            type: 'pie',
            data: {
                labels: ['CH (Corporate)', 'SFM (Sales Force)'],
                datasets: [{
                    data: [verticalStats.CH.count, verticalStats.SFM.count],
                    backgroundColor: ['#3b82f6', '#10b981']
                }]
            }
        });
    }

    // Dimension Heatmap
    const dimMap = {};
    rawDimensionScores.forEach(d => {
        if (!dimMap[d.dimension_name]) dimMap[d.dimension_name] = { sum: 0, count: 0 };
        dimMap[d.dimension_name].sum += d.score;
        dimMap[d.dimension_name].count++;
    });

    const heatmap = document.getElementById('heatmap-container');
    if (heatmap) {
        heatmap.innerHTML = Object.entries(dimMap).map(([name, data]) => {
            const avg = data.sum / data.count;
            const color = avg >= 8 ? '#10b981' : (avg >= 5 ? '#f59e0b' : '#ef4444');
            return `<div class="heatmap-cell" style="background:${color}33; border-left:4px solid ${color}">
                <strong>${name}</strong><br>${avg.toFixed(1)}
            </div>`;
        }).join('');
    }
}

async function handleExport(format) {
    const sb = getSupabase();
    if (!sb) {
        alert("Supabase not configured. Cannot export full research data.");
        return;
    }

    // Show loading indicator
    const originalText = format === 'excel' ? UI.btnExportExcel.textContent : UI.btnExport.textContent;
    const btn = format === 'excel' ? UI.btnExportExcel : UI.btnExport;
    btn.textContent = "Processing...";
    btn.disabled = true;

    try {
        // Fetch ALL individual answers for ALL respondents to include in export
        const { data: allAnswers, error: aError } = await sb.from('responses').select('*').order('question_number', { ascending: true });
        if (aError) throw aError;

        // Create a reverse map for dimensions (Name -> Key)
        const nameToKey = {};
        Object.entries(dimensions).forEach(([key, data]) => {
            nameToKey[data.name] = key;
        });

        const data = rawRespondents.map(r => {
            const scores = rawDimensionScores.filter(s => s.respondent_id === r.id);
            const answers = allAnswers.filter(a => a.respondent_id === r.id);
            
            const exportFields = {};
            
            // Map scores
            scores.forEach(s => {
                const key = nameToKey[s.dimension_name];
                if (key) {
                    exportFields[`Dim_${key}`] = s.score;
                    exportFields[`Dim_${key}_Interp`] = s.interpretation;
                }
            });

            // Calculate Strengths/Blockages for this respondent
            const sorted = [...scores].sort((a, b) => b.score - a.score);
            exportFields['top_strengths'] = sorted.slice(0, 3).map(s => s.dimension_name).join(', ');
            exportFields['top_blockages'] = [...sorted].reverse().slice(0, 3).map(s => s.dimension_name).join(', ');

            // Map all 110 individual answers
            answers.forEach(a => {
                exportFields[`Q${a.question_number}`] = a.answer === 1 ? 'Yes' : 'No';
            });

            return { ...r, ...exportFields };
        });

        if (format === 'excel') {
            await exportToExcel(data);
        } else {
            exportToCSV(data);
        }
    } catch (err) {
        console.error("Export Error:", err);
        alert("Failed to prepare research export: " + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function fetchSettings() {
    const sb = getSupabase();
    const { data } = await sb.from('settings').select('*').eq('id', 'global_settings').single();
    if (data) {
        document.getElementById('set-survey-title').value = data.survey_title;
        document.getElementById('set-is-active').value = data.is_active.toString();
        document.getElementById('set-banner').value = data.announcement_banner || '';
    }
}

async function handleSettingsSubmit(e) {
    e.preventDefault();
    const sb = getSupabase();
    const formData = new FormData(UI.settingsForm);
    const { error } = await sb.from('settings').update({
        survey_title: formData.get('survey_title'),
        is_active: formData.get('is_active') === 'true',
        announcement_banner: formData.get('announcement_banner')
    }).eq('id', 'global_settings');
    
    if (error) alert(error.message);
    else alert("Settings saved!");
}
