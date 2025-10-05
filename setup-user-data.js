// Firebase User Data Setup Script
// Run this script AFTER creating your users in Firebase Authentication
// This will create the corresponding user documents in Firestore

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    doc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
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
const db = getFirestore(app);

// ⚠️ IMPORTANT: You need to get the actual UIDs from Firebase Authentication
// Go to Firebase Console → Authentication → Users → Copy the UID for each user

// Replace these UIDs with the actual UIDs from your Firebase Authentication console
const BUYER_UID = '5KarqQeV1zUEWQUn9Prm5SlpJgu2';
const SELLER_UID = 'JnyqPLyJtOgsZxikrh7cPw6gZOD3';

// Create user documents for existing authenticated users
async function createUserDocuments() {
    try {
        console.log('👥 Creating user documents for existing authenticated users...');

        // Create buyer user document
        await setDoc(doc(db, 'users', BUYER_UID), {
            uid: BUYER_UID,
            email: 'buyer@example.com',
            role: 'buyer',
            createdAt: new Date(),
            lastLogin: new Date(),
            isActive: true,
            profile: {
                firstName: 'John',
                lastName: 'Buyer',
                phone: '+1-555-0001',
                address: '123 Buyer Street, Buyer City, BC 12345'
            },
            preferences: {
                categories: ['electronics', 'clothing', 'books'],
                maxBudget: 1000,
                notifications: true
            },
            stats: {
                totalPurchases: 0,
                totalSpent: 0,
                averageRating: 0
            }
        });
        console.log('  ✓ Created buyer user document');

        // Create seller user document
        await setDoc(doc(db, 'users', SELLER_UID), {
            uid: SELLER_UID,
            email: 'seller@example.com',
            role: 'seller',
            createdAt: new Date(),
            lastLogin: new Date(),
            isActive: true,
            profile: {
                firstName: 'Jane',
                lastName: 'Seller',
                phone: '+1-555-0002',
                address: '456 Seller Avenue, Seller City, SC 67890'
            },
            businessInfo: {
                businessName: 'Quality Products Inc.',
                businessType: 'Electronics & Gadgets',
                description: 'Providing high-quality electronics and gadgets at competitive prices.'
            },
            stats: {
                totalListings: 0,
                activeListing: 0,
                totalSales: 0,
                totalRevenue: 0,
                averageRating: 0,
                totalReviews: 0
            },
            sellerVerification: {
                isVerified: true,
                verifiedAt: new Date(),
                verificationLevel: 'basic'
            }
        });
        console.log('  ✓ Created seller user document');

        console.log('✅ User documents created successfully!');
        console.log('📝 Next steps:');
        console.log('   1. Replace the UIDs in this script with actual UIDs from Firebase Auth');
        console.log('   2. Run the init-database.html script to populate sample data');
        console.log('   3. Test user login with the credentials provided');

    } catch (error) {
        console.error('❌ Error creating user documents:', error);
        throw error;
    }
}

// Auto-execute when page loads
document.addEventListener('DOMContentLoaded', function() {
    const initButton = document.getElementById('init-users-btn');
    const logContainer = document.getElementById('log-container');

    if (initButton) {
        initButton.addEventListener('click', async () => {
            try {
                initButton.disabled = true;
                initButton.textContent = 'Creating Users...';
                
                // Clear previous logs
                if (logContainer) {
                    logContainer.innerHTML = '<div class="info">🚀 Starting user document creation...</div>';
                }
                
                await createUserDocuments();
                
                if (logContainer) {
                    logContainer.innerHTML += '<div class="success">✅ User documents created successfully!</div>';
                    logContainer.innerHTML += '<div class="info">🎯 Next: Click "Initialize Full Database" below to continue setup.</div>';
                }
                
                initButton.textContent = '✅ Users Created Successfully!';
                initButton.style.backgroundColor = '#27ae60';
                
                // Auto-redirect to database init after 3 seconds
                setTimeout(() => {
                    if (confirm('User setup complete! Proceed to database initialization?')) {
                        window.location.href = 'init-database.html';
                    }
                }, 3000);
                
            } catch (error) {
                console.error('Error:', error);
                if (logContainer) {
                    logContainer.innerHTML += `<div class="error">❌ Error: ${error.message}</div>`;
                    logContainer.innerHTML += '<div class="error">🔧 Check browser console for details.</div>';
                }
                initButton.disabled = false;
                initButton.textContent = '🔄 Retry User Creation';
                initButton.style.backgroundColor = '#e74c3c';
            }
        });
    }

    // Add auto-execute option
    const autoExecuteBtn = document.createElement('button');
    autoExecuteBtn.textContent = '🚀 Auto-Execute Setup';
    autoExecuteBtn.className = 'btn btn-success';
    autoExecuteBtn.style.marginLeft = '10px';
    autoExecuteBtn.onclick = () => {
        if (confirm('This will automatically create user documents. Continue?')) {
            initButton.click();
        }
    };
    
    if (initButton && initButton.parentNode) {
        initButton.parentNode.appendChild(autoExecuteBtn);
    }
});

// Export for manual use
window.createUserDocuments = createUserDocuments;