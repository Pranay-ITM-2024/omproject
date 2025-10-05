// Authentication functionality
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    collection,
    addDoc,
    doc,
    getDoc,
    setDoc,
    getDocs,
    query,
    where,
    handleFirebaseError,
    showError,
    showSuccess,
    hideAllMessages,
    setLoading
} from './firebase.js';

// Sign up functionality
document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Handle signup
export async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;
    
    // Clear previous messages
    hideAllMessages();
    
    // Validate inputs
    const validation = validateInputs(email, password);
    if (!validation.isValid) {
        showError(validation.errors.join(' '));
        return;
    }
    
    // Check confirm password
    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }
    
    // Check role selection
    if (!role) {
        showError('Please select your role.');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
        }
        
        // Create user account
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore with selected role
        await createUserDocument(user, role);
        
        // Show success message
        // Show success message
        showSuccess('Account created successfully! Redirecting to dashboard...');
        
        // Do NOT redirect here - let the auth state change listener handle it
        console.log('Signup successful, waiting for auth state change to handle redirect');
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Account creation failed. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Email/password accounts are not enabled.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password should be at least 6 characters.';
                break;
            default:
                errorMessage += error.message || 'Please try again.';
        }
        
        showError(errorMessage);
        
        // Reset button
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
        }
    }
}

// Handle login
export async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous messages
    hideAllMessages();
    
    // Validate inputs
    const validation = validateInputs(email, password);
    if (!validation.isValid) {
        showError(validation.errors.join(' '));
        return;
    }
    
    try {
        // Show loading state
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
        }
        
        // Attempt login
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        
        // Show success message
        showSuccess('Login successful! Redirecting to dashboard...');
        
        // Do NOT redirect here - let the auth state change listener handle it
        console.log('Login successful, waiting for auth state change to handle redirect');
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage += error.message || 'Please try again.';
        }
        
        showError(errorMessage);
        
        // Reset button
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    }
}

// Logout functionality
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout. Please try again.');
    }
}

// Input validation for login/signup
function validateInputs(email, password) {
    const errors = [];

    if (!email || !validateEmail(email)) {
        errors.push('Please enter a valid email address.');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Password validation
export function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
        isValid: password.length >= minLength,
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers
    };
}

// Email validation
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Form validation helper
export function validateForm(formData) {
    const errors = [];

    if (!formData.email || !validateEmail(formData.email)) {
        errors.push('Please enter a valid email address.');
    }

    if (!formData.password || formData.password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        errors.push('Passwords do not match.');
    }

    if (formData.role && !formData.role) {
        errors.push('Please select your role.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Create user document in Firestore
export async function createUserDocument(user, role) {
    try {
        // Import the necessary functions - they're already available from the import at the top
        const userDoc = {
            uid: user.uid,
            email: user.email,
            role: role,
            createdAt: new Date(),
            profile: {
                displayName: user.email.split('@')[0], // Use part before @ as display name
                preferences: {
                    categories: [],
                    priceRange: { min: 0, max: 10000 }
                }
            }
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);
        console.log('User document created successfully with role:', role);
        
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
}
