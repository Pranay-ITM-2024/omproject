// Universal Theme System - Works on all pages
(function() {
    'use strict';
    
    console.log('🎨 Universal theme system loading...');
    
    // Apply saved theme immediately (before DOM loads)
    const savedTheme = localStorage.getItem('marketplace-theme') || 'light';
    console.log('📱 Applying saved theme:', savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('theme-dark');
    }
    
    // Function to update theme
    function updateTheme(theme) {
        console.log('🔄 Updating theme to:', theme);
        
        // Set attribute and class
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${theme}`);
        
        // Update all theme icons
        const themeIcons = document.querySelectorAll('#theme-icon, .theme-icon');
        themeIcons.forEach(icon => {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
        
        // Save to localStorage
        localStorage.setItem('marketplace-theme', theme);
        
        console.log('✅ Theme updated successfully');
    }
    
    // Function to toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        updateTheme(newTheme);
    }
    
    // Set up when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupThemeToggle);
    } else {
        setupThemeToggle();
    }
    
    function setupThemeToggle() {
        console.log('🔧 Setting up theme toggle...');
        
        // Update icon for current theme
        updateTheme(savedTheme);
        
        // Add click listeners to all theme toggle buttons
        const themeToggles = document.querySelectorAll('#theme-toggle, .theme-toggle');
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Theme toggle clicked!');
                toggleTheme();
            });
        });
        
        // Also use event delegation for dynamically created buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('#theme-toggle, .theme-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Theme toggle clicked via delegation!');
                toggleTheme();
            }
        });
        
        console.log('✅ Theme toggle setup complete');
    }
    
    // Make functions globally available
    window.toggleTheme = toggleTheme;
    window.updateTheme = updateTheme;
    
    // Test function
    window.testTheme = function() {
        console.log('🧪 Testing theme system...');
        console.log('Current theme:', document.documentElement.getAttribute('data-theme'));
        toggleTheme();
    };
    
    console.log('🎨 Universal theme system loaded');
})();