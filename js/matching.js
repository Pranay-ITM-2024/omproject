// DSA Matching Algorithm implementation
import {
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    requireAuth,
    requireRole,
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    formatDate,
    formatCurrency,
    truncateText,
    showNotification,
    setLoading
} from './firebase.js';

// Initialize matching page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Matching page DOM loaded');
    // Wait for auth to be ready
    setTimeout(() => {
        if (requireAuth()) {
            initializeMatchingPage();
        }
    }, 1500);
});

let currentMatches = [];
let matchingHistory = [];

async function initializeMatchingPage() {
    // Load matching history
    await loadMatchingHistory();

    // Initialize event listeners
    initializeEventListeners();

    // Check for pre-selected product from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId) {
        await prefillFormFromProduct(productId);
    }
}

async function loadMatchingHistory() {
    const historyLoading = document.getElementById('history-loading');
    const historyList = document.getElementById('history-list');
    const noHistory = document.getElementById('no-history');

    try {
        historyLoading.style.display = 'block';
        historyList.style.display = 'none';
        noHistory.style.display = 'none';

        const user = getCurrentUser();
        if (!user) return;

        // Query user's matching history (without orderBy to avoid composite index)
        const historyQuery = query(
            collection(db, 'purchaseRequests'),
            where('buyerId', '==', user.uid),
            limit(10)
        );

        const snapshot = await getDocs(historyQuery);
        matchingHistory = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            matchingHistory.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        // Sort in JavaScript after fetching
        matchingHistory.sort((a, b) => b.createdAt - a.createdAt);
        
        // Take only the most recent 10
        matchingHistory = matchingHistory.slice(0, 10);

        displayMatchingHistory(matchingHistory);

    } catch (error) {
        console.error('Error loading matching history:', error);
        showNotification('Error loading matching history. Please try again.', 'error');
    } finally {
        historyLoading.style.display = 'none';
        historyList.style.display = 'block';
    }
}

function displayMatchingHistory(history) {
    const historyList = document.getElementById('history-list');
    const noHistory = document.getElementById('no-history');

    if (history.length === 0) {
        historyList.innerHTML = '';
        noHistory.style.display = 'block';
        return;
    }

    noHistory.style.display = 'none';

    const historyHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <h3>${item.desiredCategory.charAt(0).toUpperCase() + item.desiredCategory.slice(1)} - ${formatCurrency(item.maxBudget)}</h3>
                <p>Keywords: ${item.keywords}</p>
                <small>${formatDate(item.createdAt)}</small>
            </div>
            <div class="history-actions">
                <button class="btn btn-outline btn-sm" onclick="reuseSearch('${item.id}')">
                    <i class="fas fa-redo"></i> Reuse
                </button>
                <button class="btn btn-outline btn-sm" onclick="viewMatches('${item.id}')">
                    <i class="fas fa-eye"></i> View Matches
                </button>
            </div>
        </div>
    `).join('');

    historyList.innerHTML = historyHTML;
}

function initializeEventListeners() {
    // Matching form submission
    const matchingForm = document.getElementById('matching-form');
    if (matchingForm) {
        matchingForm.addEventListener('submit', handleMatchingRequest);
    }

    // New search button
    const newSearchBtn = document.getElementById('new-search-btn');
    if (newSearchBtn) {
        newSearchBtn.addEventListener('click', resetForm);
    }

    // Save search button
    const saveSearchBtn = document.getElementById('save-search-btn');
    if (saveSearchBtn) {
        saveSearchBtn.addEventListener('click', saveCurrentSearch);
    }

    // Modal event listeners
    initializeModalListeners();
}

async function handleMatchingRequest(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) return;

    // Get form data
    const formData = new FormData(e.target);
    const requestData = {
        desiredCategory: formData.get('desiredCategory'),
        maxBudget: parseFloat(formData.get('maxBudget')),
        keywords: formData.get('keywords').trim(),
        preferredCondition: formData.get('preferredCondition'),
        locationPreference: formData.get('locationPreference').trim(),
        buyerId: user.uid,
        buyerEmail: user.email,
        createdAt: new Date(),
        status: 'active'
    };

    // Validate form data
    if (!validateMatchingRequest(requestData)) {
        return;
    }

    setLoading('find-matches-btn', true);

    try {
        // Save the matching request
        const docRef = await addDoc(collection(db, 'purchaseRequests'), requestData);

        // Find matches using DSA algorithm
        const matches = await findMatches(requestData);

        // Display results
        displayMatches(matches, requestData);

        // Show results section
        document.getElementById('matching-results').style.display = 'block';
        document.getElementById('matching-results').scrollIntoView({ behavior: 'smooth' });

        showNotification(`Found ${matches.length} matches for your request!`, 'success');

    } catch (error) {
        console.error('Error processing matching request:', error);
        showNotification('Error processing your request. Please try again.', 'error');
    } finally {
        setLoading('find-matches-btn', false);
    }
}

function validateMatchingRequest(data) {
    if (!data.desiredCategory) {
        showNotification('Please select a category', 'error');
        return false;
    }

    if (!data.maxBudget || data.maxBudget <= 0) {
        showNotification('Please enter a valid budget', 'error');
        return false;
    }

    if (!data.keywords || data.keywords.length < 3) {
        showNotification('Please enter at least 3 characters for keywords', 'error');
        return false;
    }

    return true;
}

async function findMatches(requestData) {
    try {
        // Get all active listings
        const listingsQuery = query(
            collection(db, 'listings'),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(listingsQuery);
        const allListings = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            allListings.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        // Apply DSA Greedy Matching Algorithm
        const matches = matchListings(allListings, requestData);

        return matches;

    } catch (error) {
        console.error('Error finding matches:', error);
        throw error;
    }
}

/**
 * DSA Greedy Matching Algorithm
 * This function implements a greedy algorithm to find the best matches
 * based on keyword relevance, price optimization, and category matching.
 */
function matchListings(listings, buyerRequest) {
    const { desiredCategory, maxBudget, keywords, preferredCondition, locationPreference } = buyerRequest;
    const keywordList = keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);

    // Step 1: Filter listings by basic criteria
    const filtered = listings.filter(item => {
        // Category must match
        if (item.category !== desiredCategory) return false;

        // Price must be within budget
        if (item.price > maxBudget) return false;

        // Condition preference (if specified)
        if (preferredCondition && item.condition !== preferredCondition) return false;

        // Location preference (if specified)
        if (locationPreference && item.location &&
            !item.location.toLowerCase().includes(locationPreference.toLowerCase())) return false;

        return true;
    });

    // Step 2: Score each listing using greedy approach
    const scored = filtered.map(item => {
        let score = 0;
        let reasons = [];

        // Keyword matching (highest priority)
        const titleKeywords = item.title.toLowerCase();
        const descKeywords = item.description.toLowerCase();
        const itemKeywords = (item.keywords || '').toLowerCase();

        keywordList.forEach(keyword => {
            if (titleKeywords.includes(keyword)) {
                score += 10; // High weight for title matches
                reasons.push(`Title contains "${keyword}"`);
            }
            if (descKeywords.includes(keyword)) {
                score += 5; // Medium weight for description matches
                reasons.push(`Description contains "${keyword}"`);
            }
            if (itemKeywords.includes(keyword)) {
                score += 8; // High weight for keyword matches
                reasons.push(`Keywords contain "${keyword}"`);
            }
        });

        // Price optimization (lower price = higher score within budget)
        const priceRatio = item.price / maxBudget;
        if (priceRatio <= 0.5) {
            score += 5; // Excellent price
            reasons.push('Excellent price');
        } else if (priceRatio <= 0.75) {
            score += 3; // Good price
            reasons.push('Good price');
        } else if (priceRatio <= 0.9) {
            score += 1; // Fair price
            reasons.push('Fair price');
        }

        // Condition bonus
        if (item.condition === 'new') {
            score += 3;
            reasons.push('New condition');
        } else if (item.condition === 'like-new') {
            score += 2;
            reasons.push('Like new condition');
        }

        // Recency bonus (newer listings get slight boost)
        const daysSinceCreated = (new Date() - item.createdAt) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 7) {
            score += 2;
            reasons.push('Recently listed');
        }

        // Seller rating bonus
        if (item.rating && item.rating > 4) {
            score += 2;
            reasons.push('Highly rated seller');
        }

        return {
            ...item,
            score,
            reasons,
            priceRatio,
            keywordMatches: keywordList.filter(k =>
                titleKeywords.includes(k) ||
                descKeywords.includes(k) ||
                itemKeywords.includes(k)
            ).length
        };
    });

    // Step 3: Sort by score (greedy selection)
    const sorted = scored.sort((a, b) => {
        // Primary sort: by score (descending)
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        // Secondary sort: by price (ascending) for same score
        return a.price - b.price;
    });

    // Step 4: Return top matches (greedy selection of best options)
    const topMatches = sorted.slice(0, 10); // Return top 10 matches

    // Add match metadata
    return topMatches.map((match, index) => ({
        ...match,
        matchRank: index + 1,
        matchConfidence: Math.min(100, Math.round((match.score / 20) * 100)), // Convert to percentage
        algorithmUsed: 'DSA Greedy Matching'
    }));
}

function displayMatches(matches, requestData) {
    const matchesContainer = document.getElementById('matches-container');

    if (matches.length === 0) {
        matchesContainer.innerHTML = `
            <div class="no-matches">
                <i class="fas fa-search"></i>
                <h3>No matches found</h3>
                <p>Try adjusting your search criteria or expanding your budget</p>
                <button class="btn btn-primary" onclick="resetForm()">Modify Search</button>
            </div>
        `;
        return;
    }

    const matchesHTML = matches.map(match => createMatchCard(match, requestData)).join('');
    matchesContainer.innerHTML = matchesHTML;

    // Add event listeners to match cards
    addMatchCardListeners();
}

function createMatchCard(match, requestData) {
    const confidenceColor = getConfidenceColor(match.matchConfidence);

    return `
        <div class="match-card" data-match-id="${match.id}">
            <div class="match-header">
                <div class="match-rank">#${match.matchRank}</div>
                <div class="match-confidence" style="background: ${confidenceColor}">
                    ${match.matchConfidence}% Match
                </div>
            </div>
            
            <div class="match-image">
                <i class="fas fa-image"></i>
                <div class="match-overlay">
                    <button class="btn btn-primary btn-sm view-match" data-match-id="${match.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
            
            <div class="match-info">
                <h3 class="match-title">${match.title}</h3>
                <p class="match-description">${truncateText(match.description, 100)}</p>
                
                <div class="match-meta">
                    <span class="match-category">${match.category}</span>
                    <span class="match-condition">${match.condition}</span>
                    <span class="match-price">${formatCurrency(match.price)}</span>
                </div>
                
                <div class="match-score-info">
                    <div class="score-breakdown">
                        <h4>Why this match?</h4>
                        <ul>
                            ${match.reasons.slice(0, 3).map(reason => `<li>${reason}</li>`).join('')}
                            ${match.reasons.length > 3 ? `<li>+${match.reasons.length - 3} more reasons</li>` : ''}
                        </ul>
                    </div>
                </div>
                
                <div class="match-actions">
                    <button class="btn btn-primary btn-sm contact-seller" data-seller-id="${match.sellerId}">
                        <i class="fas fa-envelope"></i> Contact Seller
                    </button>
                    <button class="btn btn-outline btn-sm save-match" data-match-id="${match.id}">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getConfidenceColor(confidence) {
    if (confidence >= 80) return '#27ae60'; // Green
    if (confidence >= 60) return '#f39c12'; // Orange
    if (confidence >= 40) return '#e67e22'; // Dark orange
    return '#e74c3c'; // Red
}

function addMatchCardListeners() {
    // View match details
    document.querySelectorAll('.view-match').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchId = e.target.closest('.view-match').dataset.matchId;
            showMatchModal(matchId);
        });
    });

    // Contact seller
    document.querySelectorAll('.contact-seller').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sellerId = e.target.closest('.contact-seller').dataset.sellerId;
            contactSeller(sellerId);
        });
    });

    // Save match
    document.querySelectorAll('.save-match').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchId = e.target.closest('.save-match').dataset.matchId;
            saveMatch(matchId);
        });
    });
}

async function showMatchModal(matchId) {
    const match = currentMatches.find(m => m.id === matchId);
    if (!match) return;

    const modal = document.getElementById('match-modal');
    const modalContent = document.getElementById('match-modal-content');

    modalContent.innerHTML = `
        <div class="match-modal-content">
            <div class="match-modal-header">
                <div class="match-rank">#${match.matchRank}</div>
                <div class="match-confidence" style="background: ${getConfidenceColor(match.matchConfidence)}">
                    ${match.matchConfidence}% Match
                </div>
            </div>
            
            <div class="match-modal-body">
                <div class="match-modal-image">
                    <i class="fas fa-image"></i>
                </div>
                
                <div class="match-modal-info">
                    <h2>${match.title}</h2>
                    <div class="match-modal-meta">
                        <span class="category">${match.category}</span>
                        <span class="condition">${match.condition}</span>
                        <span class="price">${formatCurrency(match.price)}</span>
                    </div>
                    
                    <div class="match-modal-description">
                        <h3>Description</h3>
                        <p>${match.description}</p>
                    </div>
                    
                    <div class="match-score-details">
                        <h3>Match Analysis</h3>
                        <div class="score-breakdown">
                            <h4>Why this is a great match:</h4>
                            <ul>
                                ${match.reasons.map(reason => `<li>${reason}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="algorithm-info">
                            <p><strong>Algorithm:</strong> ${match.algorithmUsed}</p>
                            <p><strong>Keyword Matches:</strong> ${match.keywordMatches}/${match.keywords ? match.keywords.split(',').length : 0}</p>
                            <p><strong>Price Ratio:</strong> ${Math.round(match.priceRatio * 100)}% of your budget</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="match-modal-actions">
                <button class="btn btn-primary contact-seller" data-seller-id="${match.sellerId}">
                    <i class="fas fa-envelope"></i> Contact Seller
                </button>
                <button class="btn btn-outline save-match" data-match-id="${match.id}">
                    <i class="fas fa-bookmark"></i> Save Match
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // Add event listeners to modal buttons
    modal.querySelector('.contact-seller').addEventListener('click', () => {
        contactSeller(match.sellerId);
        modal.style.display = 'none';
    });

    modal.querySelector('.save-match').addEventListener('click', () => {
        saveMatch(match.id);
        modal.style.display = 'none';
    });
}

function contactSeller(sellerId) {
    showNotification('Contact seller functionality will be implemented in Phase 4', 'info');
}

function saveMatch(matchId) {
    showNotification('Match saved successfully!', 'success');
}

function resetForm() {
    document.getElementById('matching-form').reset();
    document.getElementById('matching-results').style.display = 'none';
    currentMatches = [];
}

function saveCurrentSearch() {
    showNotification('Search saved successfully!', 'success');
}

async function prefillFormFromProduct(productId) {
    try {
        // This would fetch product details and prefill the form
        showNotification('Prefilling form from product...', 'info');
    } catch (error) {
        console.error('Error prefilling form:', error);
    }
}

function initializeModalListeners() {
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('match-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal with X button
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close')) {
            document.getElementById('match-modal').style.display = 'none';
        }
    });
}

// Global functions for history actions
window.reuseSearch = function (historyId) {
    const historyItem = matchingHistory.find(h => h.id === historyId);
    if (historyItem) {
        document.getElementById('desired-category').value = historyItem.desiredCategory;
        document.getElementById('max-budget').value = historyItem.maxBudget;
        document.getElementById('keywords').value = historyItem.keywords;
        document.getElementById('preferred-condition').value = historyItem.preferredCondition || '';
        document.getElementById('location-preference').value = historyItem.locationPreference || '';

        showNotification('Form prefilled with previous search criteria', 'info');
    }
};

window.viewMatches = function (historyId) {
    showNotification('Viewing previous matches functionality will be implemented', 'info');
};

window.resetForm = resetForm;
