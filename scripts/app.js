import { initSurvey } from './survey.js';
import { initAdmin } from './admin.js';
import { initTheme } from './theme.js';

let keyBuffer = "";
const HIDDEN_TRIGGER = "123456789";
const ADMIN_USERNAME = "Agarwal2026";
const ADMIN_PASSWORD = "Agarwal#2026";

export function initApp() {
    initTheme();
    initSurvey();
    setupHiddenTrigger();
    setupAdminLogin();

    const adminBtn = document.getElementById('btn-admin-access');
    if (adminBtn) adminBtn.addEventListener('click', showAdminLogin);

    const toggleBtn = document.getElementById('btn-toggle-password');
    const pwdInput = document.getElementById('login-password');
    if (toggleBtn && pwdInput) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = pwdInput.type === 'password';
            pwdInput.type = isHidden ? 'text' : 'password';
            toggleBtn.textContent = isHidden ? '🙈' : '👁️';
        });
    }
}

function setupHiddenTrigger() {
    document.addEventListener('keydown', (e) => {
        // Append character to buffer
        keyBuffer += e.key;
        
        // Keep buffer size same as trigger
        if (keyBuffer.length > HIDDEN_TRIGGER.length) {
            keyBuffer = keyBuffer.substring(1);
        }
        
        // Check for match
        if (keyBuffer === HIDDEN_TRIGGER) {
            showAdminLogin();
            keyBuffer = ""; // reset
        }
    });

    // Also support a hidden click sequence (e.g., clicking the logo 5 times)
    let logoClicks = 0;
    const logo = document.querySelector('.logo-text');
    if (logo) {
        logo.addEventListener('click', () => {
            logoClicks++;
            if (logoClicks === 9) {
                showAdminLogin();
                logoClicks = 0;
            }
            setTimeout(() => { logoClicks = 0; }, 3000);
        });
    }
}

function showAdminLogin() {
    const overlay = document.getElementById('admin-login-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function setupAdminLogin() {
    const loginForm = document.getElementById('admin-login-form');
    const closeBtn = document.getElementById('btn-close-admin-login');
    const logoutBtn = document.getElementById('admin-logout');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Success
                errorDiv.style.display = 'none';
                document.getElementById('admin-login-overlay').style.display = 'none';
                enterAdminDashboard();
            } else {
                // Fail
                errorDiv.textContent = "Invalid master credentials.";
                errorDiv.style.display = 'block';
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('admin-login-overlay').style.display = 'none';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('admin-dashboard-overlay').style.display = 'none';
            window.location.reload(); // Hard reset for security
        });
    }
}

function enterAdminDashboard() {
    document.getElementById('admin-dashboard-overlay').style.display = 'flex';
    // Initialize admin logic if not already done
    initAdmin();
}
