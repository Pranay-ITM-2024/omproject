// Firebase Configuration and Setup
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_7Q3zFCAU-NpZ24UKtz-DkkIwFHCgICU",
    authDomain: "finaldestination-e3b5a.firebaseapp.com",
    projectId: "finaldestination-e3b5a",
    storageBucket: "finaldestination-e3b5a.firebasestorage.app",
    messagingSenderId: "1004171999317",
    appId: "1:1004171999317:web:f36c584200d2f85df23cdc",
    measurementId: "G-EJVP6S98C8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Debug Firebase initialization
console.log('Firebase initialized successfully');
console.log('Auth object:', auth);
console.log('Firestore object:', db);

// Note: Auth state change listener is handled below in the main logic section
// to avoid duplicate listeners that cause infinite loops

// Export Firebase services
export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, updateDoc, deleteDoc };

// Auth state management
let currentUser = null;
let userRole = null;
let isRedirecting = false; // Flag to prevent redirect loops
let authInitialized = false; // Track if auth has been initialized

// Listen for auth state changes (single listener to prevent conflicts)
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed. User:', user ? user.uid : 'None');
    console.log('Current page:', window.location.pathname);
    
    // Update current user state
    currentUser = user;

    if (user) {
        console.log('User is authenticated, fetching role...');
        
        // Get user role from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                userRole = userDoc.data().role;
                console.log('User role found:', userRole);
            } else {
                console.log('No user document found in Firestore, user may need to complete profile');
                userRole = null;
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            userRole = null;
        }

        // Update UI based on auth state
        updateAuthUI(user, userRole);
        
        // Handle page-specific routing only once after initialization
        if (!authInitialized && !isRedirecting) {
            console.log('Checking if redirect is needed...');
            handlePostLoginRouting(user, userRole);
            authInitialized = true;
        }
    } else {
        console.log('User is not authenticated');
        userRole = null;
        updateAuthUI(null, null);
        
        // Handle logout routing only if not already redirecting
        if (!isRedirecting) {
            handleLogoutRouting();
        }
    }
});

// Reset auth initialized flag when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, resetting auth state');
    isRedirecting = false;
    authInitialized = false;
    
    // If we're on dashboard, mark as initialized to prevent redirects
    if (window.location.pathname.includes('dashboard')) {
        console.log('On dashboard page, marking auth as initialized');
        authInitialized = true;
    }
});

// Reset redirect flag on page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !window.location.pathname.includes('dashboard')) {
        console.log('Page visible again, resetting redirect flag');
        isRedirecting = false;
    }
});

// Handle routing after successful login
function handlePostLoginRouting(user, role) {
    // Prevent multiple redirects
    if (isRedirecting) {
        console.log('Already redirecting, skipping handlePostLoginRouting');
        return;
    }
    
    const currentPage = window.location.pathname;
    console.log('Checking post-login routing for page:', currentPage);
    
    // Check if user is on login or signup pages
    const isOnAuthPage = currentPage.includes('login.html') || 
                        currentPage.includes('signup.html');
    
    // Only redirect if on auth pages and not already on dashboard
    if (isOnAuthPage && !currentPage.includes('dashboard')) {
        console.log('User logged in from auth page, redirecting to dashboard...');
        isRedirecting = true;
        
        // Small delay to prevent race conditions
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 500);
    } else {
        console.log('User is not on auth page or already on dashboard, no redirect needed. Current page:', currentPage);
    }
}

// Handle routing after logout
function handleLogoutRouting() {
    // Prevent multiple redirects
    if (isRedirecting) {
        console.log('Already redirecting, skipping handleLogoutRouting');
        return;
    }
    
    const currentPage = window.location.pathname;
    console.log('Checking logout routing for page:', currentPage);
    
    // If user is on a protected page, redirect to home
    const protectedPages = ['dashboard.html', 'seller.html', 'matching.html', 'admin.html'];
    const isOnProtectedPage = protectedPages.some(page => currentPage.includes(page));
    
    if (isOnProtectedPage) {
        console.log('User logged out from protected page, redirecting to home...');
        isRedirecting = true;
        setTimeout(() => {
            window.location.replace('/');
        }, 100);
    } else {
        console.log('User is not on protected page, no redirect needed. Current page:', currentPage);
    }
}

// Update UI based on authentication state
function updateAuthUI(user, role) {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const userEmail = document.getElementById('user-email');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (user && navUser) {
        // User is logged in
        if (navAuth) navAuth.style.display = 'none';
        if (navUser) navUser.style.display = 'flex';
        if (userEmail) userEmail.textContent = user.email;

        // Add logout functionality
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                try {
                    console.log('Logging out user...');
                    await signOut(auth);
                    // Clear any cached data
                    currentUser = null;
                    userRole = null;
                    console.log('User logged out successfully');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            };
        }
    } else {
        // User is not logged in
        if (navAuth) navAuth.style.display = 'flex';
        if (navUser) navUser.style.display = 'none';
    }
}

// Utility function to get current user (with fallback)
export function getCurrentUser() {
    return currentUser || auth.currentUser;
}

// Utility function to get current user role
export function getCurrentUserRole() {
    return userRole;
}

// Utility function to check if user is authenticated
export function isAuthenticated() {
    return currentUser !== null || auth.currentUser !== null;
}

// Utility function to check if user has specific role
export function hasRole(role) {
    return userRole === role;
}

// Enhanced require authentication with retry mechanism
export function requireAuth() {
    // First check: immediate auth state
    if (currentUser !== null) {
        console.log('Auth check passed: user is authenticated');
        return true;
    }
    
    // Second check: Firebase auth object directly
    if (auth.currentUser) {
        console.log('Auth detected via Firebase auth object, syncing state');
        currentUser = auth.currentUser; // Sync the state
        return true;
    }
    
    // If no authentication found, redirect to login (only if not already redirecting)
    if (!isRedirecting) {
        console.log('No authentication found, redirecting to login');
        isRedirecting = true;
        
        // Add a small delay to prevent race conditions
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 100);
    }
    return false;
}

// Utility function to require specific role
export function requireRole(role) {
    if (!requireAuth()) return false;
    if (!hasRole(role)) {
        if (!isRedirecting) {
            isRedirecting = true;
            window.location.href = '/dashboard.html';
        }
        return false;
    }
    return true;
}

// Error handling utility
export function handleFirebaseError(error) {
    console.error('Firebase Error Details:', error); // Debug log
    let message = 'An error occurred. Please try again.';

    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'This email is already registered.';
            break;
        case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
        case 'auth/weak-password':
            message = 'Password should be at least 6 characters.';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later.';
            break;
        case 'auth/network-request-failed':
            message = 'Network error. Please check your internet connection.';
            break;
        case 'auth/internal-error':
            message = 'Internal error. Please try again later.';
            break;
        case 'auth/invalid-credential':
            message = 'Invalid email or password.';
            break;
        case 'permission-denied':
            message = 'Permission denied. Please check Firestore rules.';
            break;
        case 'unavailable':
            message = 'Service temporarily unavailable. Please try again.';
            break;
        default:
            message = error.message || message;
            if (error.code) {
                message += ` (Error code: ${error.code})`;
            }
    }

    return message;
}

// Show error message
export function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Show success message
export function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Hide all message divs
export function hideAllMessages() {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

// Set loading state
export function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (isLoading) {
            button.classList.add('loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-block';
        } else {
            button.classList.remove('loading');
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }
}

// Utility functions - moved from app.js to avoid circular imports
export function formatDate(date) {
    if (!date) return 'N/A';

    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#f39c12';
    } else {
        notification.style.backgroundColor = '#3498db';
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications if not already added
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
