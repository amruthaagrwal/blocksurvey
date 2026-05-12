// scripts/theme.js

export function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const currentTheme = localStorage.getItem('theme');
    
    // Apply saved theme
    if (currentTheme) {
        document.documentElement.classList.add(currentTheme);
    }

    toggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark-theme')) {
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.classList.add('light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else if (document.documentElement.classList.contains('light-theme')) {
            document.documentElement.classList.remove('light-theme');
            document.documentElement.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        } else {
            // Default check based on prefers-color-scheme
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                document.documentElement.classList.add('light-theme');
                localStorage.setItem('theme', 'light-theme');
            } else {
                document.documentElement.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
            }
        }
    });
}
