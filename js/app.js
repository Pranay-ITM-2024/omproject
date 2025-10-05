// Main application logic
import {
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    requireAuth,
    formatDate,
    formatCurrency,
    truncateText,
    showNotification
} from './firebase.js';

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing app...'); // Debug log
    initializeTheme();
    initializeAuth();
    initializeMobileMenu();
    setupThemeToggle();
    
    // Debug: Add manual test function to window
    window.testTheme = function() {
        console.log('Manual theme test triggered');
        const current = document.documentElement.getAttribute('data-theme');
        console.log('Current theme:', current);
        toggleTheme();
    };
    
    console.log('App initialization complete'); // Debug log
});

function initializeApp() {
    // Check authentication status and update UI
    updateAuthState();

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize any page-specific functionality
    const currentPage = getCurrentPage();
    initializePageFeatures(currentPage);
}

async function updateAuthState() {
    // Wait for Firebase auth to initialize and settle
    setTimeout(() => {
        if (isAuthenticated()) {
            const user = getCurrentUser();
            const role = getCurrentUserRole();
            updateAuthUI(user, role);
            
            // Note: Page routing is handled by firebase.js auth state listener
            // No need to handle routing here to avoid conflicts
            console.log('App.js: Auth UI updated for authenticated user');
        } else {
            updateAuthUI(null, null);
            console.log('App.js: Auth UI updated for unauthenticated user');
        }
    }, 2000); // Increased delay to ensure Firebase auth has settled
}

// Note: Page authentication and routing is handled by firebase.js
// to avoid conflicts and redirect loops

// Handle page-specific authentication requirements
// function handlePageAuth(user, role) {
//     const currentPage = getCurrentPage();
//     
//     // Only redirect if specifically on login or signup pages (not dashboard)
//     if ((currentPage === 'login' || currentPage === 'signup') && window.location.pathname !== '/dashboard.html') {
//         console.log('Authenticated user on auth page, redirecting to dashboard');
//         window.location.href = '/dashboard.html';
//     }
// }

// Handle what to show when user is not authenticated
// function handleUnauthenticatedState() {
//     const currentPage = getCurrentPage();
//     const protectedPages = ['dashboard', 'seller', 'matching', 'admin'];
//     
//     if (protectedPages.includes(currentPage)) {
//         console.log('Unauthenticated user on protected page, redirecting to login');
//         window.location.href = '/login.html';
//     }
// }

function updateAuthUI(user, role) {
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const navUser = document.getElementById('nav-user');
    const userEmail = document.getElementById('user-email');
    const browseLink = document.querySelector('a[href*="browse"]');

    if (user) {
        // Update UI for authenticated user
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (navUser) navUser.style.display = 'flex';
        if (userEmail) userEmail.textContent = user.email;

        // Apply role-based CSS class to body
        document.body.className = '';
        if (role) {
            document.body.classList.add(`user-${role}`);
        }

        // Update navigation based on role
        if (browseLink && role) {
            updateNavigationForRole(role);
        }
    } else {
        // Update UI for non-authenticated user
        if (authSection) authSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (navUser) navUser.style.display = 'none';
        
        // Remove role classes from body
        document.body.className = '';
    }
}

function updateNavigationForRole(role) {
    // The navigation visibility is now handled by CSS classes
    // This function can be used for any additional role-specific navigation logic
    console.log(`Navigation updated for role: ${role}`);
    
    // Optional: Add any additional role-specific navigation features here
    // For example, highlighting certain sections, showing role-specific notifications, etc.
}

// Legacy function - now using CSS classes for role-based navigation
// function getRoleSpecificLinks(role) {
//     switch (role) {
//         case 'buyer':
//             return [
//                 { href: 'pages/matching.html', text: 'Smart Match' }
//             ];
//         case 'seller':
//             return [
//                 { href: 'pages/seller.html', text: 'Sell' },
//                 { href: 'pages/matching.html', text: 'Smart Match' }
//             ];
//         case 'admin':
//             return [
//                 { href: 'pages/admin.html', text: 'Admin' },
//                 { href: 'pages/seller.html', text: 'Sell' },
//                 { href: 'pages/matching.html', text: 'Smart Match' }
//             ];
//         default:
//             return [];
//     }
// }

function initializeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }
}

// Theme System - Simplified and Robust
let currentTheme = 'light';

function initializeTheme() {
    // Get saved theme or default to light
    currentTheme = localStorage.getItem('marketplace-theme') || 'light';
    console.log('Initializing theme:', currentTheme);
    applyTheme(currentTheme);
}

function setupThemeToggle() {
    console.log('Setting up theme toggle...');
    
    // Use event delegation to handle theme toggle
    document.addEventListener('click', function(e) {
        if (e.target.closest('#theme-toggle')) {
            console.log('Theme toggle clicked!');
            toggleTheme();
        }
    });
    
    // Also try direct binding
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        console.log('Found theme toggle button, adding direct listener');
        themeToggle.addEventListener('click', toggleTheme);
    } else {
        console.log('Theme toggle button not found, using delegation only');
    }
}

function toggleTheme() {
    console.log('Toggle theme called, current:', currentTheme);
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    console.log('Switching to:', currentTheme);
    applyTheme(currentTheme);
    localStorage.setItem('marketplace-theme', currentTheme);
}

function applyTheme(theme) {
    console.log('Applying theme:', theme);
    
    // Set data attribute on html element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also set a class on body for additional styling if needed
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
    
    // Update all theme icons on the page
    const themeIcons = document.querySelectorAll('#theme-icon, .theme-icon');
    themeIcons.forEach(icon => {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    });
    
    // Force style recalculation
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
    
    console.log('Theme applied. HTML data-theme:', document.documentElement.getAttribute('data-theme'));
    console.log('Body classes:', document.body.className);
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().split('.')[0];
    return page || 'index';
}

function initializePageFeatures(page) {
    switch (page) {
        case 'index':
            initializeHomePage();
            break;
        case 'dashboard':
            console.log('Dashboard page initialized');
            break;
        case 'browse':
            console.log('Browse page initialized');
            break;
        case 'seller':
            console.log('Seller page initialized');
            break;
        case 'matching':
            console.log('Matching page initialized');
            break;
        case 'admin':
            console.log('Admin page initialized');
            break;
        case 'support':
            console.log('Support page initialized');
            break;
        default:
            console.log(`Page ${page} initialized`);
            break;
    }
}

function initializeHomePage() {
    // Add smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation to feature cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    }, observerOptions);

    const featureCards = document.querySelectorAll('.feature-card, .step');
    featureCards.forEach(card => {
        observer.observe(card);
    });

    console.log('Home page initialized with animations');
}

// Utility functions
export function debounce(func, wait) {
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

export function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Error handling
export function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    showNotification(`Error: ${error.message || 'Something went wrong'}`, 'error');
}

// Export utility functions for backwards compatibility
export { formatDate, formatCurrency, truncateText, showNotification };
