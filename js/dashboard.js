// Dashboard functionality
import {
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    requireAuth,
    db,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    formatDate
} from './firebase.js';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
});

// Dashboard initialization
async function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Wait for auth to settle before checking
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check authentication
    if (!requireAuth()) {
        console.log('Dashboard: Authentication required');
        return; // requireAuth handles redirect
    }
    
    const user = getCurrentUser();
    const role = getCurrentUserRole();

    if (!user) {
        console.error('Dashboard: User not found after auth check');
        return;
    }

    if (!role) {
        console.log('Dashboard: User role not found, may be a legacy user or role not set yet');
        // Show a message or redirect to profile completion
        showNoRoleMessage(user);
        return;
    }

    console.log('Dashboard: Initializing for user:', user.email, 'role:', role);

    // Update user info display
    updateUserInfo(user, role);

    // Show appropriate dashboard based on role
    showRoleDashboard(role);

    // Load recent activity
    await loadRecentActivity(user.uid, role);
}

function showNoRoleMessage(user) {
    const userRoleInfo = document.getElementById('user-role-info');
    if (userRoleInfo) {
        userRoleInfo.innerHTML = `
            <div class="alert alert-warning">
                <p>Welcome ${user.email}! It looks like your profile is incomplete.</p>
                <p>Please <a href="/signup.html" style="color: #007bff;">complete your profile</a> to get started.</p>
            </div>
        `;
    }
}

function updateUserInfo(user, role) {
    const userRoleInfo = document.getElementById('user-role-info');
    if (userRoleInfo) {
        userRoleInfo.textContent = `Logged in as ${user.email} (${role.charAt(0).toUpperCase() + role.slice(1)})`;
    }
}

function showRoleDashboard(role) {
    // Hide all dashboard sections
    const buyerDashboard = document.getElementById('buyer-dashboard');
    const sellerDashboard = document.getElementById('seller-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');

    if (buyerDashboard) buyerDashboard.style.display = 'none';
    if (sellerDashboard) sellerDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';

    // Show appropriate dashboard
    switch (role) {
        case 'buyer':
            if (buyerDashboard) buyerDashboard.style.display = 'block';
            break;
        case 'seller':
            if (sellerDashboard) sellerDashboard.style.display = 'block';
            break;
        case 'admin':
            if (adminDashboard) adminDashboard.style.display = 'block';
            break;
        default:
            console.error('Unknown role:', role);
    }
}

async function loadRecentActivity(userId, role) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        let activities = [];

        // Load different activities based on role
        switch (role) {
            case 'buyer':
                activities = await loadBuyerActivities(userId);
                break;
            case 'seller':
                activities = await loadSellerActivities(userId);
                break;
            case 'admin':
                activities = await loadAdminActivities();
                break;
        }

        displayActivities(activities, activityList);

    } catch (error) {
        console.error('Error loading recent activity:', error);
        activityList.innerHTML = '<p>Error loading recent activity. Please try again later.</p>';
    }
}

async function loadBuyerActivities(userId) {
    const activities = [];

    try {
        // Load recent purchase requests (without orderBy to avoid composite index)
        const purchaseQuery = query(
            collection(db, 'purchaseRequests'),
            where('buyerId', '==', userId),
            limit(5)
        );
        const purchaseSnapshot = await getDocs(purchaseQuery);

        const purchaseRequests = [];
        purchaseSnapshot.forEach(doc => {
            const data = doc.data();
            purchaseRequests.push({
                type: 'purchase_request',
                title: 'Purchase Request Created',
                description: `Looking for: ${data.desiredCategory}`,
                timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                icon: 'fas fa-shopping-cart'
            });
        });

        // Sort in JavaScript and take only the most recent 5
        purchaseRequests.sort((a, b) => b.timestamp - a.timestamp);
        activities.push(...purchaseRequests.slice(0, 5));

        // Load recent matches (without orderBy to avoid composite index)
        const matchQuery = query(
            collection(db, 'matches'),
            where('buyerId', '==', userId),
            limit(3)
        );
        const matchSnapshot = await getDocs(matchQuery);

        const matches = [];
        matchSnapshot.forEach(doc => {
            const data = doc.data();
            matches.push({
                type: 'match',
                title: 'New Match Found',
                description: `Matched with: ${data.sellerName}`,
                timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                icon: 'fas fa-handshake'
            });
        });

        // Sort in JavaScript and take only the most recent 3
        matches.sort((a, b) => b.timestamp - a.timestamp);
        activities.push(...matches.slice(0, 3));

    } catch (error) {
        console.error('Error loading buyer activities:', error);
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
}

async function loadSellerActivities(userId) {
    const activities = [];

    try {
        // Load recent listings
        const listingQuery = query(
            collection(db, 'listings'),
            where('sellerId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const listingSnapshot = await getDocs(listingQuery);

        listingSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'listing',
                title: 'Product Listed',
                description: data.title,
                timestamp: data.createdAt,
                icon: 'fas fa-plus-circle'
            });
        });

        // Load recent feedback
        const feedbackQuery = query(
            collection(db, 'feedback'),
            where('sellerId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
        const feedbackSnapshot = await getDocs(feedbackQuery);

        feedbackSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'feedback',
                title: 'New Feedback Received',
                description: `${data.rating} stars - ${data.feedback}`,
                timestamp: data.createdAt,
                icon: 'fas fa-star'
            });
        });

    } catch (error) {
        console.error('Error loading seller activities:', error);
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
}

async function loadAdminActivities() {
    const activities = [];

    try {
        // Load recent support tickets
        const ticketQuery = query(
            collection(db, 'tickets'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const ticketSnapshot = await getDocs(ticketQuery);

        ticketSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'ticket',
                title: 'New Support Ticket',
                description: data.subject,
                timestamp: data.createdAt,
                icon: 'fas fa-ticket-alt'
            });
        });

        // Load recent user registrations
        const userQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
        const userSnapshot = await getDocs(userQuery);

        userSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'user',
                title: 'New User Registered',
                description: `${data.email} (${data.role})`,
                timestamp: data.createdAt,
                icon: 'fas fa-user-plus'
            });
        });

    } catch (error) {
        console.error('Error loading admin activities:', error);
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
}

function displayActivities(activities, container) {
    if (activities.length === 0) {
        container.innerHTML = '<p>No recent activity to display.</p>';
        return;
    }

    const activitiesHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
                <small>${formatDate(activity.timestamp)}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = activitiesHTML;
}

// Export functions for use in other modules
export { loadRecentActivity, displayActivities };
