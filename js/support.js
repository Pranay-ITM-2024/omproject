// Support ticket functionality
import {
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    requireAuth,
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    formatDate,
    showNotification,
    setLoading
} from './firebase.js';

// Initialize support page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (requireAuth()) {
        initializeSupportPage();
    }
});

let userTickets = [];

async function initializeSupportPage() {
    // Load user's tickets
    await loadUserTickets();

    // Initialize event listeners
    initializeEventListeners();

    // Initialize FAQ functionality
    initializeFAQ();
}

async function loadUserTickets() {
    const ticketsLoading = document.getElementById('tickets-loading');
    const ticketsList = document.getElementById('tickets-list');
    const noTickets = document.getElementById('no-tickets');

    try {
        ticketsLoading.style.display = 'block';
        ticketsList.style.display = 'none';
        noTickets.style.display = 'none';

        const user = getCurrentUser();
        if (!user) return;

        // Query user's tickets
        const ticketsQuery = query(
            collection(db, 'tickets'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(ticketsQuery);
        userTickets = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            userTickets.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        displayUserTickets(userTickets);

    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Error loading your tickets. Please try again.', 'error');
    } finally {
        ticketsLoading.style.display = 'none';
        ticketsList.style.display = 'block';
    }
}

function displayUserTickets(tickets) {
    const ticketsList = document.getElementById('tickets-list');
    const noTickets = document.getElementById('no-tickets');

    if (tickets.length === 0) {
        ticketsList.innerHTML = '';
        noTickets.style.display = 'block';
        return;
    }

    noTickets.style.display = 'none';

    const ticketsHTML = tickets.map(ticket => createTicketCard(ticket)).join('');
    ticketsList.innerHTML = ticketsHTML;

    // Add event listeners to ticket cards
    addTicketCardListeners();
}

function createTicketCard(ticket) {
    const statusColor = getStatusColor(ticket.status);
    const priorityColor = getPriorityColor(ticket.priority);

    return `
        <div class="ticket-card" data-ticket-id="${ticket.id}">
            <div class="ticket-header">
                <div class="ticket-id">#${ticket.id.substring(0, 8)}</div>
                <div class="ticket-status" style="background: ${statusColor}">
                    ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </div>
            </div>
            
            <div class="ticket-content">
                <h3 class="ticket-subject">${ticket.subject}</h3>
                <p class="ticket-description">${truncateText(ticket.description, 150)}</p>
                
                <div class="ticket-meta">
                    <span class="ticket-category">${ticket.category}</span>
                    <span class="ticket-priority" style="background: ${priorityColor}">
                        ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                    <span class="ticket-date">${formatDate(ticket.createdAt)}</span>
                </div>
                
                ${ticket.adminResponse ? `
                    <div class="ticket-response">
                        <h4>Admin Response:</h4>
                        <p>${ticket.adminResponse}</p>
                        <small>Responded on ${formatDate(ticket.respondedAt)}</small>
                    </div>
                ` : ''}
            </div>
            
            <div class="ticket-actions">
                <button class="btn btn-outline btn-sm view-ticket" data-ticket-id="${ticket.id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${ticket.status === 'open' ? `
                    <button class="btn btn-outline btn-sm close-ticket" data-ticket-id="${ticket.id}">
                        <i class="fas fa-times"></i> Close
                    </button>
                ` : ''}
            </div>
        </div>
    `;
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

function addTicketCardListeners() {
    // View ticket details
    document.querySelectorAll('.view-ticket').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ticketId = e.target.closest('.view-ticket').dataset.ticketId;
            showTicketModal(ticketId);
        });
    });

    // Close ticket
    document.querySelectorAll('.close-ticket').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ticketId = e.target.closest('.close-ticket').dataset.ticketId;
            closeTicket(ticketId);
        });
    });
}

function initializeEventListeners() {
    // Support form submission
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', handleSupportSubmit);
    }
}

async function handleSupportSubmit(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) return;

    // Get form data
    const formData = new FormData(e.target);
    const ticketData = {
        subject: formData.get('subject').trim(),
        category: formData.get('category'),
        priority: formData.get('priority'),
        description: formData.get('description').trim(),
        userId: user.uid,
        userEmail: user.email,
        userRole: getCurrentUserRole(),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Validate form data
    if (!validateTicketData(ticketData)) {
        return;
    }

    setLoading('submit-ticket-btn', true);

    try {
        // Add ticket to Firestore
        const docRef = await addDoc(collection(db, 'tickets'), ticketData);

        // Add to local tickets
        userTickets.unshift({
            id: docRef.id,
            ...ticketData
        });

        // Update display
        displayUserTickets(userTickets);

        // Reset form
        e.target.reset();

        showNotification('Support ticket submitted successfully! We\'ll get back to you within 24 hours.', 'success');

    } catch (error) {
        console.error('Error submitting ticket:', error);
        showNotification('Error submitting ticket. Please try again.', 'error');
    } finally {
        setLoading('submit-ticket-btn', false);
    }
}

function validateTicketData(data) {
    if (!data.subject || data.subject.length < 5) {
        showNotification('Subject must be at least 5 characters long', 'error');
        return false;
    }

    if (!data.category) {
        showNotification('Please select a category', 'error');
        return false;
    }

    if (!data.description || data.description.length < 20) {
        showNotification('Description must be at least 20 characters long', 'error');
        return false;
    }

    return true;
}

async function showTicketModal(ticketId) {
    const ticket = userTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticket-modal');
    const modalContent = document.getElementById('ticket-modal-content');

    modalContent.innerHTML = `
        <div class="ticket-modal-content">
            <div class="ticket-modal-header">
                <div class="ticket-info">
                    <h2>${ticket.subject}</h2>
                    <div class="ticket-badges">
                        <span class="ticket-status" style="background: ${getStatusColor(ticket.status)}">
                            ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                        <span class="ticket-priority" style="background: ${getPriorityColor(ticket.priority)}">
                            ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                        <span class="ticket-category">${ticket.category}</span>
                    </div>
                </div>
                <div class="ticket-meta">
                    <p><strong>Ticket ID:</strong> #${ticket.id.substring(0, 8)}</p>
                    <p><strong>Created:</strong> ${formatDate(ticket.createdAt)}</p>
                    <p><strong>Last Updated:</strong> ${formatDate(ticket.updatedAt)}</p>
                </div>
            </div>
            
            <div class="ticket-modal-body">
                <div class="ticket-description">
                    <h3>Description</h3>
                    <p>${ticket.description}</p>
                </div>
                
                ${ticket.adminResponse ? `
                    <div class="ticket-response">
                        <h3>Admin Response</h3>
                        <div class="response-content">
                            <p>${ticket.adminResponse}</p>
                            <small>Responded on ${formatDate(ticket.respondedAt)} by ${ticket.adminName || 'Admin'}</small>
                        </div>
                    </div>
                ` : `
                    <div class="ticket-pending">
                        <i class="fas fa-clock"></i>
                        <h3>Awaiting Response</h3>
                        <p>Our support team will review your ticket and respond within 24 hours.</p>
                    </div>
                `}
            </div>
            
            <div class="ticket-modal-actions">
                ${ticket.status === 'open' ? `
                    <button class="btn btn-outline close-ticket" data-ticket-id="${ticket.id}">
                        <i class="fas fa-times"></i> Close Ticket
                    </button>
                ` : ''}
                <button class="btn btn-primary" onclick="closeTicketModal()">
                    <i class="fas fa-check"></i> Close
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // Add event listener for close ticket button
    const closeBtn = modal.querySelector('.close-ticket');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeTicket(ticket.id);
            modal.style.display = 'none';
        });
    }
}

async function closeTicket(ticketId) {
    try {
        // In a real implementation, this would update the ticket status in Firestore
        showNotification('Ticket closed successfully!', 'success');

        // Update local data
        const ticketIndex = userTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            userTickets[ticketIndex].status = 'closed';
            userTickets[ticketIndex].updatedAt = new Date();
        }

        // Update display
        displayUserTickets(userTickets);

    } catch (error) {
        console.error('Error closing ticket:', error);
        showNotification('Error closing ticket. Please try again.', 'error');
    }
}

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isOpen = answer.style.display === 'block';

            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.querySelector('.faq-answer').style.display = 'none';
                    otherItem.querySelector('.faq-question i').style.transform = 'rotate(0deg)';
                }
            });

            // Toggle current item
            if (isOpen) {
                answer.style.display = 'none';
                question.querySelector('i').style.transform = 'rotate(0deg)';
            } else {
                answer.style.display = 'block';
                question.querySelector('i').style.transform = 'rotate(180deg)';
            }
        });
    });
}

// Utility function for text truncation
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Global functions
window.closeTicketModal = function () {
    document.getElementById('ticket-modal').style.display = 'none';
};

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('ticket-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Close modal with X button
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close')) {
        document.getElementById('ticket-modal').style.display = 'none';
    }
});
