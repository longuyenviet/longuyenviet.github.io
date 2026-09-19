/* filepath: assets/js/dark_mode.js */
// Dark Mode Toggle Functionality
(function() {
    const THEME_KEY = 'theme-preference';
    
    // Explicit choice wins; otherwise follow the operating system. Storage
    // can throw in private browsing, so every access is guarded.
    function storedTheme() {
        try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    }

    function systemTheme() {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'dark' : 'light';
    }

    function getThemePreference() {
        return storedTheme() || systemTheme();
    }

    function setThemePreference(theme) {
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    }
    
    // Apply theme to document
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button icons
        const darkIcon = document.querySelector('.dark-mode-icon');
        const lightIcon = document.querySelector('.light-mode-icon');
        
        var toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        }

        if (darkIcon && lightIcon) {
            if (theme === 'dark') {
                darkIcon.style.display = 'none';
                lightIcon.style.display = 'inline';
            } else {
                darkIcon.style.display = 'inline';
                lightIcon.style.display = 'none';
            }
        }
    }
    
    // Toggle between light and dark themes
    function toggleTheme() {
        const currentTheme = getThemePreference();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        setThemePreference(newTheme);
        applyTheme(newTheme);
        
        // Add smooth transition effect
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 300);
    }
    
    // Initialize theme on page load
    function initializeTheme() {
        const savedTheme = getThemePreference();
        applyTheme(savedTheme);
        
        // Add event listener to toggle button
        const toggleButton = document.getElementById('darkModeToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleTheme);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
        initializeTheme();
    }

    // Follow the OS if the visitor has never made an explicit choice.
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function () { if (!storedTheme()) applyTheme(systemTheme()); };
        if (mq.addEventListener) { mq.addEventListener('change', onChange); }
        else if (mq.addListener) { mq.addListener(onChange); }
    }
})();