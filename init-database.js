// Database initialization script
// This script creates the initial database structure and indexes

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
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

// Initialize database with sample data
async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...');
        updateLog('🚀 Starting database initialization...');

        // 1. Create initial categories
        await createInitialCategories();

        // 2. Create system settings
        await createSystemSettings();

        // 3. Skip sample users (we use real users from setup-user-data.js)
        console.log('👥 Skipping sample users - using real user data');
        updateLog('👥 Skipping sample users - using real user data');

        // 4. Create sample listings (assigned to real seller)
        await createSampleListings();

        // 5. Create system announcements
        await createSystemAnnouncements();

        // 6. Create sample purchase requests and matches
        await createSampleMatches();

        console.log('✅ Database initialization completed successfully!');
        console.log('🎉 Your P2P marketplace is ready to use!');
        updateLog('✅ Database initialization completed successfully!');
        updateLog('🎉 Your P2P marketplace is ready to use!');
        updateLog('🚀 You can now test your marketplace at: http://localhost:8000');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        updateLog(`❌ Error initializing database: ${error.message}`);
        throw error;
    }
}

// Helper function to update the log display
function updateLog(message) {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = message.includes('✅') ? 'success' : 
                           message.includes('❌') ? 'error' : 'info';
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Create initial product categories
async function createInitialCategories() {
    console.log('📁 Creating product categories...');

    const categories = [
        {
            id: 'electronics',
            name: 'Electronics',
            description: 'Electronic devices, gadgets, and tech accessories',
            icon: 'fas fa-laptop',
            color: '#3498db',
            isActive: true,
            createdAt: new Date()
        },
        {
            id: 'clothing',
            name: 'Clothing',
            description: 'Fashion, apparel, and accessories',
            icon: 'fas fa-tshirt',
            color: '#e74c3c',
            isActive: true,
            createdAt: new Date()
        },
        {
            id: 'home',
            name: 'Home & Garden',
            description: 'Home improvement, furniture, and gardening',
            icon: 'fas fa-home',
            color: '#27ae60',
            isActive: true,
            createdAt: new Date()
        },
        {
            id: 'books',
            name: 'Books',
            description: 'Books, educational materials, and media',
            icon: 'fas fa-book',
            color: '#f39c12',
            isActive: true,
            createdAt: new Date()
        },
        {
            id: 'sports',
            name: 'Sports',
            description: 'Sports equipment, fitness, and outdoor gear',
            icon: 'fas fa-dumbbell',
            color: '#9b59b6',
            isActive: true,
            createdAt: new Date()
        },
        {
            id: 'other',
            name: 'Other',
            description: 'Miscellaneous items and services',
            icon: 'fas fa-box',
            color: '#95a5a6',
            isActive: true,
            createdAt: new Date()
        }
    ];

    for (const category of categories) {
        await setDoc(doc(db, 'categories', category.id), category);
        console.log(`  ✓ Created category: ${category.name}`);
    }
}

// Create system settings
async function createSystemSettings() {
    console.log('⚙️ Creating system settings...');

    const settings = {
        platformName: 'P2P Marketplace',
        version: '1.0.0',
        maintenanceMode: false,
        maxListingsPerUser: 50,
        maxPrice: 10000,
        minPrice: 0.01,
        maxDescriptionLength: 1000,
        maxTitleLength: 100,
        supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxImageSize: 5242880, // 5MB
        matchingAlgorithm: 'DSA Greedy',
        defaultCurrency: 'USD',
        timezone: 'UTC',
        features: {
            smartMatching: true,
            chatSystem: true,
            feedbackSystem: true,
            analytics: true,
            notifications: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await setDoc(doc(db, 'settings', 'platform'), settings);
    console.log('  ✓ Created platform settings');
}

// Create sample users for testing
async function createSampleUsers() {
    console.log('👥 Creating sample users...');

    const sampleUsers = [
        {
            uid: 'sample-buyer-1',
            email: 'buyer1@example.com',
            role: 'buyer',
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1-555-0123',
                address: '123 Main St, New York, NY 10001'
            },
            preferences: {
                categories: ['electronics', 'books'],
                maxBudget: 500,
                location: 'New York, NY'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        },
        {
            uid: 'sample-seller-1',
            email: 'seller1@example.com',
            role: 'seller',
            profile: {
                firstName: 'Jane',
                lastName: 'Smith',
                phone: '+1-555-0456',
                address: '456 Oak Ave, Los Angeles, CA 90210'
            },
            sellerProfile: {
                businessName: 'Jane\'s Electronics',
                description: 'Quality electronics at great prices',
                rating: 4.8,
                totalSales: 0,
                responseTime: '2 hours'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        },
        {
            uid: 'sample-admin-1',
            email: 'admin@example.com',
            role: 'admin',
            profile: {
                firstName: 'Admin',
                lastName: 'User',
                phone: '+1-555-0789',
                address: '789 Admin Blvd, San Francisco, CA 94102'
            },
            adminPrivileges: {
                canManageUsers: true,
                canManageListings: true,
                canViewAnalytics: true,
                canManageTickets: true
            },
            createdAt: new Date(),
            lastLogin: new Date()
        }
    ];

    for (const user of sampleUsers) {
        await setDoc(doc(db, 'users', user.uid), user);
        console.log(`  ✓ Created user: ${user.email} (${user.role})`);
    }
}

// Create sample listings
async function createSampleListings() {
    console.log('📦 Creating sample listings...');
    updateLog('📦 Creating sample listings...');

    // Use your real seller UID
    const SELLER_UID = 'JnyqPLyJtOgsZxikrh7cPw6gZOD3';

    const sampleListings = [
        {
            title: 'MacBook Pro 13-inch M2',
            description: 'Excellent condition MacBook Pro with M2 chip. Perfect for students and professionals. Includes original charger and box.',
            category: 'electronics',
            price: 1299.99,
            condition: 'like-new',
            keywords: 'macbook, laptop, apple, m2, professional',
            location: 'New York, NY',
            sellerId: SELLER_UID,
            sellerEmail: 'seller@example.com',
            status: 'active',
            views: 15,
            rating: 5,
            ratingCount: 3,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            title: 'Vintage Leather Jacket',
            description: 'Beautiful vintage leather jacket in excellent condition. Size Medium. Perfect for motorcycle riding or casual wear.',
            category: 'clothing',
            price: 89.99,
            condition: 'good',
            keywords: 'leather, jacket, vintage, motorcycle, medium',
            location: 'Los Angeles, CA',
            sellerId: SELLER_UID,
            sellerEmail: 'seller@example.com',
            status: 'active',
            views: 8,
            rating: 4,
            ratingCount: 2,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            title: 'Gaming Chair - Ergonomic',
            description: 'High-quality gaming chair with lumbar support. Adjustable height and armrests. Used for only 6 months.',
            category: 'home',
            price: 199.99,
            condition: 'like-new',
            keywords: 'gaming, chair, ergonomic, office, furniture',
            location: 'San Francisco, CA',
            sellerId: SELLER_UID,
            sellerEmail: 'seller@example.com',
            status: 'active',
            views: 12,
            rating: 5,
            ratingCount: 1,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            title: 'Programming Books Bundle',
            description: 'Collection of 5 programming books including Clean Code, Design Patterns, and JavaScript guides. Great for developers.',
            category: 'books',
            price: 45.99,
            condition: 'good',
            keywords: 'programming, books, javascript, clean code, development',
            location: 'Seattle, WA',
            sellerId: SELLER_UID,
            sellerEmail: 'seller@example.com',
            status: 'active',
            views: 20,
            rating: 4,
            ratingCount: 5,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            title: 'Yoga Mat & Accessories Set',
            description: 'Premium yoga mat with blocks, strap, and carrying bag. Perfect for home workouts or studio sessions.',
            category: 'sports',
            price: 34.99,
            condition: 'new',
            keywords: 'yoga, mat, fitness, exercise, wellness',
            location: 'Austin, TX',
            sellerId: SELLER_UID,
            sellerEmail: 'seller@example.com',
            status: 'active',
            views: 6,
            rating: 5,
            ratingCount: 2,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    for (const listing of sampleListings) {
        const docRef = await addDoc(collection(db, 'listings'), listing);
        console.log(`  ✓ Created listing: ${listing.title} (ID: ${docRef.id})`);
        updateLog(`  ✓ Created listing: ${listing.title}`);
    }
}

// Create system announcements
async function createSystemAnnouncements() {
    console.log('📢 Creating system announcements...');
    updateLog('📢 Creating system announcements...');

    const announcements = [
        {
            title: 'Welcome to P2P Marketplace!',
            content: 'Welcome to our new P2P marketplace platform. We\'re excited to help you buy and sell products with our smart matching algorithm.',
            type: 'info',
            priority: 'medium',
            isActive: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            createdAt: new Date()
        },
        {
            title: 'Smart Matching Algorithm',
            content: 'Our advanced DSA-based matching algorithm helps you find the perfect products based on your preferences, budget, and keywords.',
            type: 'feature',
            priority: 'high',
            isActive: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
            createdAt: new Date()
        }
    ];

    for (const announcement of announcements) {
        const docRef = await addDoc(collection(db, 'announcements'), announcement);
        console.log(`  ✓ Created announcement: ${announcement.title} (ID: ${docRef.id})`);
        updateLog(`  ✓ Created announcement: ${announcement.title}`);
    }
}

// Create sample matching data
async function createSampleMatches() {
    console.log('🎯 Creating sample purchase requests and matches...');
    updateLog('🎯 Creating sample purchase requests and matches...');

    const BUYER_UID = '5KarqQeV1zUEWQUn9Prm5SlpJgu2';

    // Create a sample purchase request
    const sampleRequest = {
        desiredCategory: 'electronics',
        maxBudget: 1500,
        keywords: 'laptop, programming, development',
        preferredCondition: 'like-new',
        locationPreference: 'New York',
        buyerId: BUYER_UID,
        buyerEmail: 'buyer@example.com',
        createdAt: new Date(),
        status: 'active'
    };

    const requestRef = await addDoc(collection(db, 'purchaseRequests'), sampleRequest);
    console.log(`  ✓ Created sample purchase request (ID: ${requestRef.id})`);
    updateLog(`  ✓ Created sample purchase request`);
}

// Run the initialization
initializeDatabase();
