// Admin dashboard functionality
import {
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    requireRole,
    db,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    formatDate,
    formatCurrency,
    showNotification,
    setLoading
} from './firebase.js';

// Initialize admin page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (requireRole('admin')) {
        initializeAdminPage();
    }
});

let allTickets = [];
let allUsers = [];
let allListings = [];
let allFeedback = [];

async function initializeAdminPage() {
    // Load all admin data
    await Promise.all([
        loadAdminStats(),
        loadAllTickets(),
        loadAllUsers(),
        loadAnalyticsData()
    ]);

    // Initialize event listeners
    initializeEventListeners();
}

async function loadAdminStats() {
    try {
        // Load total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        document.getElementById('total-users').textContent = usersSnapshot.size;

        // Load active listings
        const listingsQuery = query(collection(db, 'listings'), where('status', '==', 'active'));
        const listingsSnapshot = await getDocs(listingsQuery);
        document.getElementById('total-listings').textContent = listingsSnapshot.size;

        // Load pending tickets
        const ticketsQuery = query(collection(db, 'tickets'), where('status', '==', 'open'));
        const ticketsSnapshot = await getDocs(ticketsQuery);
        document.getElementById('pending-tickets').textContent = ticketsSnapshot.size;

        // Calculate average seller rating
        const feedbackQuery = query(collection(db, 'feedback'));
        const feedbackSnapshot = await getDocs(feedbackQuery);

        if (feedbackSnapshot.size > 0) {
            let totalRating = 0;
            feedbackSnapshot.forEach(doc => {
                const data = doc.data();
                totalRating += data.rating || 0;
            });
            const avgRating = totalRating / feedbackSnapshot.size;
            document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
        } else {
            document.getElementById('avg-rating').textContent = 'N/A';
        }

    } catch (error) {
        console.error('Error loading admin stats:', error);
        showNotification('Error loading statistics. Please try again.', 'error');
    }
}

async function loadAllTickets() {
    const ticketsLoading = document.getElementById('admin-tickets-loading');
    const ticketsList = document.getElementById('admin-tickets-list');

    try {
        ticketsLoading.style.display = 'block';
        ticketsList.style.display = 'none';

        // Query all tickets
        const ticketsQuery = query(
            collection(db, 'tickets'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(ticketsQuery);
        allTickets = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            allTickets.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        displayAdminTickets(allTickets);

    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Error loading tickets. Please try again.', 'error');
    } finally {
        ticketsLoading.style.display = 'none';
        ticketsList.style.display = 'block';
    }
}

function displayAdminTickets(tickets) {
    const ticketsList = document.getElementById('admin-tickets-list');

    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p>No tickets found.</p>';
        return;
    }

    const ticketsHTML = tickets.map(ticket => createAdminTicketCard(ticket)).join('');
    ticketsList.innerHTML = ticketsHTML;

    // Add event listeners to ticket cards
    addAdminTicketCardListeners();
}

function createAdminTicketCard(ticket) {
    const statusColor = getStatusColor(ticket.status);
    const priorityColor = getPriorityColor(ticket.priority);

    return `
        <div class="admin-ticket-card" data-ticket-id="${ticket.id}">
            <div class="ticket-header">
                <div class="ticket-id">#${ticket.id.substring(0, 8)}</div>
                <div class="ticket-status" style="background: ${statusColor}">
                    ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </div>
            </div>
            
            <div class="ticket-content">
                <h3 class="ticket-subject">${ticket.subject}</h3>
                <p class="ticket-description">${truncateText(ticket.description, 100)}</p>
                
                <div class="ticket-meta">
                    <span class="ticket-category">${ticket.category}</span>
                    <span class="ticket-priority" style="background: ${priorityColor}">
                        ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                    <span class="ticket-user">${ticket.userEmail}</span>
                    <span class="ticket-date">${formatDate(ticket.createdAt)}</span>
                </div>
            </div>
            
            <div class="ticket-actions">
                <button class="btn btn-primary btn-sm view-ticket" data-ticket-id="${ticket.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-outline btn-sm respond-ticket" data-ticket-id="${ticket.id}">
                    <i class="fas fa-reply"></i> Respond
                </button>
                <button class="btn btn-outline btn-sm update-status" data-ticket-id="${ticket.id}">
                    <i class="fas fa-edit"></i> Update
                </button>
            </div>
        </div>
    `;
}

function addAdminTicketCardListeners() {
    // View ticket details
    document.querySelectorAll('.view-ticket').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ticketId = e.target.closest('.view-ticket').dataset.ticketId;
            showAdminTicketModal(ticketId);
        });
    });

    // Respond to ticket
    document.querySelectorAll('.respond-ticket').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ticketId = e.target.closest('.respond-ticket').dataset.ticketId;
            respondToTicket(ticketId);
        });
    });

    // Update ticket status
    document.querySelectorAll('.update-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ticketId = e.target.closest('.update-status').dataset.ticketId;
            updateTicketStatus(ticketId);
        });
    });
}

async function loadAllUsers() {
    const usersLoading = document.getElementById('admin-users-loading');
    const usersList = document.getElementById('admin-users-list');

    try {
        usersLoading.style.display = 'block';
        usersList.style.display = 'none';

        // Query all users
        const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(usersQuery);
        allUsers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            allUsers.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        displayAdminUsers(allUsers);

    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users. Please try again.', 'error');
    } finally {
        usersLoading.style.display = 'none';
        usersList.style.display = 'block';
    }
}

function displayAdminUsers(users) {
    const usersList = document.getElementById('admin-users-list');

    if (users.length === 0) {
        usersList.innerHTML = '<p>No users found.</p>';
        return;
    }

    const usersHTML = users.map(user => createAdminUserCard(user)).join('');
    usersList.innerHTML = usersHTML;

    // Add event listeners to user cards
    addAdminUserCardListeners();
}

function createAdminUserCard(user) {
    const roleColor = getRoleColor(user.role);

    return `
        <div class="admin-user-card" data-user-id="${user.id}">
            <div class="user-header">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-info">
                    <h3 class="user-name">${user.email}</h3>
                    <p class="user-role" style="color: ${roleColor}">
                        ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                </div>
            </div>
            
            <div class="user-meta">
                <div class="user-stat">
                    <span class="stat-label">Joined:</span>
                    <span class="stat-value">${formatDate(user.createdAt)}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">Status:</span>
                    <span class="stat-value">Active</span>
                </div>
            </div>
            
            <div class="user-actions">
                <button class="btn btn-outline btn-sm view-user" data-user-id="${user.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-outline btn-sm manage-user" data-user-id="${user.id}">
                    <i class="fas fa-cog"></i> Manage
                </button>
            </div>
        </div>
    `;
}

function addAdminUserCardListeners() {
    // View user details
    document.querySelectorAll('.view-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.closest('.view-user').dataset.userId;
            showAdminUserModal(userId);
        });
    });

    // Manage user
    document.querySelectorAll('.manage-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.closest('.manage-user').dataset.userId;
            manageUser(userId);
        });
    });
}

async function loadAnalyticsData() {
    try {
        // Load top sellers
        await loadTopSellers();

        // Load category stats
        await loadCategoryStats();

        // Load recent feedback
        await loadRecentFeedback();

    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNotification('Error loading analytics data. Please try again.', 'error');
    }
}

async function loadTopSellers() {
    try {
        // Query all listings to calculate seller performance
        const listingsQuery = query(collection(db, 'listings'));
        const listingsSnapshot = await getDocs(listingsQuery);

        const sellerStats = {};

        listingsSnapshot.forEach(doc => {
            const data = doc.data();
            const sellerId = data.sellerId;

            if (!sellerStats[sellerId]) {
                sellerStats[sellerId] = {
                    sellerId,
                    sellerEmail: data.sellerEmail,
                    listings: 0,
                    totalViews: 0,
                    avgRating: 0
                };
            }

            sellerStats[sellerId].listings++;
            sellerStats[sellerId].totalViews += data.views || 0;
        });

        // Sort by number of listings
        const topSellers = Object.values(sellerStats)
            .sort((a, b) => b.listings - a.listings)
            .slice(0, 5);

        const topSellersHTML = topSellers.map((seller, index) => `
            <div class="seller-item">
                <div class="seller-rank">#${index + 1}</div>
                <div class="seller-info">
                    <h4>${seller.sellerEmail}</h4>
                    <p>${seller.listings} listings • ${seller.totalViews} views</p>
                </div>
            </div>
        `).join('');

        document.getElementById('top-sellers').innerHTML = topSellersHTML;

    } catch (error) {
        console.error('Error loading top sellers:', error);
        document.getElementById('top-sellers').innerHTML = '<p>Error loading data</p>';
    }
}

async function loadCategoryStats() {
    try {
        // Query all listings to calculate category distribution
        const listingsQuery = query(collection(db, 'listings'));
        const listingsSnapshot = await getDocs(listingsQuery);

        const categoryStats = {};

        listingsSnapshot.forEach(doc => {
            const data = doc.data();
            const category = data.category;

            if (!categoryStats[category]) {
                categoryStats[category] = 0;
            }

            categoryStats[category]++;
        });

        // Create category distribution chart
        const categoryHTML = Object.entries(categoryStats)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => `
                <div class="category-item">
                    <div class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                    <div class="category-count">${count} listings</div>
                </div>
            `).join('');

        document.getElementById('category-stats').innerHTML = categoryHTML;

    } catch (error) {
        console.error('Error loading category stats:', error);
        document.getElementById('category-stats').innerHTML = '<p>Error loading data</p>';
    }
}

async function loadRecentFeedback() {
    try {
        // Query recent feedback
        const feedbackQuery = query(
            collection(db, 'feedback'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const feedbackSnapshot = await getDocs(feedbackQuery);
        const recentFeedback = [];

        feedbackSnapshot.forEach(doc => {
            const data = doc.data();
            recentFeedback.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        const feedbackHTML = recentFeedback.map(feedback => `
            <div class="feedback-item">
                <div class="feedback-rating">
                    ${generateStarRating(feedback.rating)}
                </div>
                <div class="feedback-content">
                    <p>${truncateText(feedback.feedback, 50)}</p>
                    <small>${formatDate(feedback.createdAt)}</small>
                </div>
            </div>
        `).join('');

        document.getElementById('recent-feedback').innerHTML = feedbackHTML;

    } catch (error) {
        console.error('Error loading recent feedback:', error);
        document.getElementById('recent-feedback').innerHTML = '<p>Error loading data</p>';
    }
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

function initializeEventListeners() {
    // Refresh buttons
    const refreshTickets = document.getElementById('refresh-tickets');
    const refreshUsers = document.getElementById('refresh-users');

    if (refreshTickets) {
        refreshTickets.addEventListener('click', loadAllTickets);
    }

    if (refreshUsers) {
        refreshUsers.addEventListener('click', loadAllUsers);
    }

    // Filter functionality
    const ticketStatusFilter = document.getElementById('ticket-status-filter');
    const ticketPriorityFilter = document.getElementById('ticket-priority-filter');
    const userRoleFilter = document.getElementById('user-role-filter');
    const userStatusFilter = document.getElementById('user-status-filter');

    if (ticketStatusFilter) {
        ticketStatusFilter.addEventListener('change', filterTickets);
    }

    if (ticketPriorityFilter) {
        ticketPriorityFilter.addEventListener('change', filterTickets);
    }

    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', filterUsers);
    }

    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', filterUsers);
    }

    // Modal event listeners
    initializeModalListeners();
}

function filterTickets() {
    const statusFilter = document.getElementById('ticket-status-filter').value;
    const priorityFilter = document.getElementById('ticket-priority-filter').value;

    let filteredTickets = [...allTickets];

    if (statusFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === priorityFilter);
    }

    displayAdminTickets(filteredTickets);
}

function filterUsers() {
    const roleFilter = document.getElementById('user-role-filter').value;
    const statusFilter = document.getElementById('user-status-filter').value;

    let filteredUsers = [...allUsers];

    if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }

    if (statusFilter) {
        // In a real implementation, you would check user status from the database
        // For now, we'll just show all users
    }

    displayAdminUsers(filteredUsers);
}

function getStatusColor(status) {
    switch (status) {
        case 'open': return '#3498db';
        case 'in-progress': return '#f39c12';
        case 'resolved': return '#27ae60';
        case 'closed': return '#95a5a6';
        default: return '#95a5a6';
    }
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'urgent': return '#e74c3c';
        case 'high': return '#e67e22';
        case 'medium': return '#f39c12';
        case 'low': return '#27ae60';
        default: return '#95a5a6';
    }
}

function getRoleColor(role) {
    switch (role) {
        case 'admin': return '#e74c3c';
        case 'seller': return '#3498db';
        case 'buyer': return '#27ae60';
        default: return '#95a5a6';
    }
}

function showAdminTicketModal(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('admin-ticket-modal');
    const modalContent = document.getElementById('admin-ticket-modal-content');

    modalContent.innerHTML = `
        <div class="admin-ticket-modal-content">
            <div class="ticket-modal-header">
                <h2>${ticket.subject}</h2>
                <div class="ticket-badges">
                    <span class="ticket-status" style="background: ${getStatusColor(ticket.status)}">
                        ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span class="ticket-priority" style="background: ${getPriorityColor(ticket.priority)}">
                        ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                </div>
            </div>
            
            <div class="ticket-modal-body">
                <div class="ticket-info">
                    <p><strong>From:</strong> ${ticket.userEmail}</p>
                    <p><strong>Category:</strong> ${ticket.category}</p>
                    <p><strong>Created:</strong> ${formatDate(ticket.createdAt)}</p>
                </div>
                
                <div class="ticket-description">
                    <h3>Description</h3>
                    <p>${ticket.description}</p>
                </div>
                
                <div class="ticket-response-form">
                    <h3>Admin Response</h3>
                    <textarea id="admin-response" rows="4" placeholder="Enter your response..."></textarea>
                </div>
            </div>
            
            <div class="ticket-modal-actions">
                <button class="btn btn-primary" onclick="submitResponse('${ticket.id}')">
                    <i class="fas fa-reply"></i> Submit Response
                </button>
                <button class="btn btn-outline" onclick="closeAdminTicketModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function showAdminUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('admin-user-modal');
    const modalContent = document.getElementById('admin-user-modal-content');

    modalContent.innerHTML = `
        <div class="admin-user-modal-content">
            <div class="user-modal-header">
                <h2>User Details</h2>
            </div>
            
            <div class="user-modal-body">
                <div class="user-info">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
                </div>
                
                <div class="user-actions">
                    <button class="btn btn-outline" onclick="changeUserRole('${user.id}')">
                        <i class="fas fa-edit"></i> Change Role
                    </button>
                    <button class="btn btn-outline" onclick="suspendUser('${user.id}')">
                        <i class="fas fa-ban"></i> Suspend User
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function respondToTicket(ticketId) {
    showAdminTicketModal(ticketId);
}

function updateTicketStatus(ticketId) {
    showNotification('Update ticket status functionality will be implemented', 'info');
}

function manageUser(userId) {
    showAdminUserModal(userId);
}

function initializeModalListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const ticketModal = document.getElementById('admin-ticket-modal');
        const userModal = document.getElementById('admin-user-modal');

        if (e.target === ticketModal) {
            ticketModal.style.display = 'none';
        }
        if (e.target === userModal) {
            userModal.style.display = 'none';
        }
    });

    // Close modals with X button
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close')) {
            document.getElementById('admin-ticket-modal').style.display = 'none';
            document.getElementById('admin-user-modal').style.display = 'none';
        }
    });
}

// Utility function for text truncation
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Global functions
window.submitResponse = function (ticketId) {
    const response = document.getElementById('admin-response').value;
    if (!response.trim()) {
        showNotification('Please enter a response', 'error');
        return;
    }

    showNotification('Response submitted successfully!', 'success');
    document.getElementById('admin-ticket-modal').style.display = 'none';
};

window.closeAdminTicketModal = function () {
    document.getElementById('admin-ticket-modal').style.display = 'none';
};

window.changeUserRole = function (userId) {
    showNotification('Change user role functionality will be implemented', 'info');
};

window.suspendUser = function (userId) {
    showNotification('Suspend user functionality will be implemented', 'info');
};
