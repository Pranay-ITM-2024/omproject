// Seller functionality for product management
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
    doc,
    updateDoc,
    deleteDoc,
    formatDate,
    formatCurrency,
    truncateText,
    showNotification,
    setLoading
} from './firebase.js';

// Initialize seller page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Seller page DOM loaded');
    // Wait for auth to be ready before checking role
    setTimeout(() => {
        if (requireAuth()) {
            initializeSellerPage();
        }
    }, 1500);
});

let currentListings = [];

async function initializeSellerPage() {
    // Load existing listings
    await loadListings();

    // Initialize event listeners
    initializeEventListeners();
}

async function loadListings() {
    const loadingSpinner = document.getElementById('listings-loading');
    const listingsGrid = document.getElementById('listings-grid');
    const noListings = document.getElementById('no-listings');

    try {
        loadingSpinner.style.display = 'block';
        listingsGrid.style.display = 'none';
        noListings.style.display = 'none';

        const user = getCurrentUser();
        if (!user) return;

        // Query user's listings
        const listingsQuery = query(
            collection(db, 'listings'),
            where('sellerId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(listingsQuery);
        currentListings = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            currentListings.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        displayListings(currentListings);

    } catch (error) {
        console.error('Error loading listings:', error);
        showNotification('Error loading your listings. Please try again.', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
        listingsGrid.style.display = 'grid';
    }
}

function initializeEventListeners() {
    // Product form submission
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Form validation
    const titleInput = document.getElementById('title');
    const priceInput = document.getElementById('price');
    const descriptionInput = document.getElementById('description');

    if (titleInput) {
        titleInput.addEventListener('input', validateTitle);
    }

    if (priceInput) {
        priceInput.addEventListener('input', validatePrice);
    }

    if (descriptionInput) {
        descriptionInput.addEventListener('input', validateDescription);
    }

    // Modal event listeners
    initializeModalListeners();
}

function validateTitle() {
    const titleInput = document.getElementById('title');
    const value = titleInput.value.trim();

    if (value.length < 5) {
        titleInput.setCustomValidity('Title must be at least 5 characters long');
    } else if (value.length > 100) {
        titleInput.setCustomValidity('Title must be less than 100 characters');
    } else {
        titleInput.setCustomValidity('');
    }
}

function validatePrice() {
    const priceInput = document.getElementById('price');
    const value = parseFloat(priceInput.value);

    if (isNaN(value) || value < 0) {
        priceInput.setCustomValidity('Please enter a valid price');
    } else if (value > 100000) {
        priceInput.setCustomValidity('Price seems too high. Please verify.');
    } else {
        priceInput.setCustomValidity('');
    }
}

function validateDescription() {
    const descriptionInput = document.getElementById('description');
    const value = descriptionInput.value.trim();

    if (value.length < 20) {
        descriptionInput.setCustomValidity('Description must be at least 20 characters long');
    } else if (value.length > 1000) {
        descriptionInput.setCustomValidity('Description must be less than 1000 characters');
    } else {
        descriptionInput.setCustomValidity('');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) return;

    // Get form data
    const formData = new FormData(e.target);
    const productData = {
        title: formData.get('title').trim(),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        condition: formData.get('condition'),
        description: formData.get('description').trim(),
        keywords: formData.get('keywords').trim(),
        location: formData.get('location').trim(),
        sellerId: user.uid,
        sellerEmail: user.email,
        createdAt: new Date(),
        status: 'active',
        views: 0,
        rating: 0,
        ratingCount: 0
    };

    // Validate form data
    if (!validateProductData(productData)) {
        return;
    }

    setLoading('submit-btn', true);

    try {
        // Add product to Firestore
        const docRef = await addDoc(collection(db, 'listings'), productData);

        // Add to local listings
        currentListings.unshift({
            id: docRef.id,
            ...productData
        });

        // Update display
        displayListings(currentListings);

        // Reset form
        e.target.reset();

        showNotification('Product listed successfully!', 'success');

    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Error adding product. Please try again.', 'error');
    } finally {
        setLoading('submit-btn', false);
    }
}

function validateProductData(data) {
    if (!data.title || data.title.length < 5) {
        showNotification('Title must be at least 5 characters long', 'error');
        return false;
    }

    if (!data.category) {
        showNotification('Please select a category', 'error');
        return false;
    }

    if (!data.price || data.price <= 0) {
        showNotification('Please enter a valid price', 'error');
        return false;
    }

    if (!data.condition) {
        showNotification('Please select a condition', 'error');
        return false;
    }

    if (!data.description || data.description.length < 20) {
        showNotification('Description must be at least 20 characters long', 'error');
        return false;
    }

    return true;
}

function displayListings(listings) {
    const listingsGrid = document.getElementById('listings-grid');
    const noListings = document.getElementById('no-listings');

    if (listings.length === 0) {
        listingsGrid.innerHTML = '';
        noListings.style.display = 'block';
        return;
    }

    noListings.style.display = 'none';

    const listingsHTML = listings.map(listing => createListingCard(listing)).join('');
    listingsGrid.innerHTML = listingsHTML;

    // Add event listeners to listing cards
    addListingCardListeners();
}

function createListingCard(listing) {
    return `
        <div class="listing-card" data-listing-id="${listing.id}">
            <div class="listing-image">
                <i class="fas fa-image"></i>
                <div class="listing-status ${listing.status}">
                    ${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </div>
            </div>
            <div class="listing-info">
                <h3 class="listing-title">${listing.title}</h3>
                <p class="listing-description">${truncateText(listing.description, 80)}</p>
                <div class="listing-meta">
                    <span class="listing-category">${listing.category}</span>
                    <span class="listing-condition">${listing.condition}</span>
                    <span class="listing-price">${formatCurrency(listing.price)}</span>
                </div>
                <div class="listing-stats">
                    <div class="stat">
                        <i class="fas fa-eye"></i>
                        <span>${listing.views || 0} views</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-star"></i>
                        <span>${(listing.rating || 0).toFixed(1)} (${listing.ratingCount || 0})</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(listing.createdAt)}</span>
                    </div>
                </div>
                <div class="listing-actions">
                    <button class="btn btn-outline btn-sm edit-listing" data-listing-id="${listing.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-outline btn-sm toggle-status" data-listing-id="${listing.id}" data-status="${listing.status}">
                        <i class="fas fa-${listing.status === 'active' ? 'pause' : 'play'}"></i>
                        ${listing.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button class="btn btn-outline btn-sm delete-listing" data-listing-id="${listing.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addListingCardListeners() {
    // Edit listing
    document.querySelectorAll('.edit-listing').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const listingId = e.target.closest('.edit-listing').dataset.listingId;
            editListing(listingId);
        });
    });

    // Toggle status
    document.querySelectorAll('.toggle-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const listingId = e.target.closest('.toggle-status').dataset.listingId;
            const currentStatus = e.target.closest('.toggle-status').dataset.status;
            toggleListingStatus(listingId, currentStatus);
        });
    });

    // Delete listing
    document.querySelectorAll('.delete-listing').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const listingId = e.target.closest('.delete-listing').dataset.listingId;
            confirmDeleteListing(listingId);
        });
    });
}

async function editListing(listingId) {
    const listing = currentListings.find(l => l.id === listingId);
    if (!listing) return;

    const modal = document.getElementById('edit-modal');
    const formContainer = document.getElementById('edit-form-container');

    formContainer.innerHTML = `
        <form id="edit-form" class="product-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-title">Product Title *</label>
                    <input type="text" id="edit-title" name="title" value="${listing.title}" required maxlength="100">
                </div>
                <div class="form-group">
                    <label for="edit-category">Category *</label>
                    <select id="edit-category" name="category" required>
                        <option value="electronics" ${listing.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                        <option value="clothing" ${listing.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                        <option value="home" ${listing.category === 'home' ? 'selected' : ''}>Home & Garden</option>
                        <option value="books" ${listing.category === 'books' ? 'selected' : ''}>Books</option>
                        <option value="sports" ${listing.category === 'sports' ? 'selected' : ''}>Sports</option>
                        <option value="other" ${listing.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-price">Price ($) *</label>
                    <input type="number" id="edit-price" name="price" value="${listing.price}" required min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="edit-condition">Condition *</label>
                    <select id="edit-condition" name="condition" required>
                        <option value="new" ${listing.condition === 'new' ? 'selected' : ''}>New</option>
                        <option value="like-new" ${listing.condition === 'like-new' ? 'selected' : ''}>Like New</option>
                        <option value="good" ${listing.condition === 'good' ? 'selected' : ''}>Good</option>
                        <option value="fair" ${listing.condition === 'fair' ? 'selected' : ''}>Fair</option>
                        <option value="poor" ${listing.condition === 'poor' ? 'selected' : ''}>Poor</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="edit-description">Description *</label>
                <textarea id="edit-description" name="description" required rows="4" maxlength="1000">${listing.description}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-keywords">Keywords</label>
                <input type="text" id="edit-keywords" name="keywords" value="${listing.keywords || ''}" placeholder="e.g., vintage, handmade, organic">
            </div>
            <div class="form-group">
                <label for="edit-location">Location</label>
                <input type="text" id="edit-location" name="location" value="${listing.location || ''}" placeholder="City, State">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-large">Update Product</button>
                <button type="button" class="btn btn-outline btn-large" onclick="closeEditModal()">Cancel</button>
            </div>
        </form>
    `;

    modal.style.display = 'block';

    // Add form submission handler
    const editForm = document.getElementById('edit-form');
    editForm.addEventListener('submit', (e) => handleEditSubmit(e, listingId));
}

async function handleEditSubmit(e, listingId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const updateData = {
        title: formData.get('title').trim(),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        condition: formData.get('condition'),
        description: formData.get('description').trim(),
        keywords: formData.get('keywords').trim(),
        location: formData.get('location').trim(),
        updatedAt: new Date()
    };

    try {
        // Update in Firestore
        await updateDoc(doc(db, 'listings', listingId), updateData);

        // Update local data
        const listingIndex = currentListings.findIndex(l => l.id === listingId);
        if (listingIndex !== -1) {
            currentListings[listingIndex] = { ...currentListings[listingIndex], ...updateData };
        }

        // Update display
        displayListings(currentListings);

        // Close modal
        closeEditModal();

        showNotification('Product updated successfully!', 'success');

    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Error updating product. Please try again.', 'error');
    }
}

async function toggleListingStatus(listingId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
        // Update in Firestore
        await updateDoc(doc(db, 'listings', listingId), {
            status: newStatus,
            updatedAt: new Date()
        });

        // Update local data
        const listingIndex = currentListings.findIndex(l => l.id === listingId);
        if (listingIndex !== -1) {
            currentListings[listingIndex].status = newStatus;
        }

        // Update display
        displayListings(currentListings);

        showNotification(`Product ${newStatus} successfully!`, 'success');

    } catch (error) {
        console.error('Error updating product status:', error);
        showNotification('Error updating product status. Please try again.', 'error');
    }
}

function confirmDeleteListing(listingId) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';

    // Store listing ID for deletion
    modal.dataset.listingId = listingId;
}

async function deleteListing(listingId) {
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'listings', listingId));

        // Remove from local data
        currentListings = currentListings.filter(l => l.id !== listingId);

        // Update display
        displayListings(currentListings);

        showNotification('Product deleted successfully!', 'success');

    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product. Please try again.', 'error');
    }
}

function initializeModalListeners() {
    // Edit modal close
    const editModal = document.getElementById('edit-modal');
    const editClose = editModal.querySelector('.close');
    if (editClose) {
        editClose.addEventListener('click', closeEditModal);
    }

    // Delete modal
    const deleteModal = document.getElementById('delete-modal');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');

    if (confirmDelete) {
        confirmDelete.addEventListener('click', () => {
            const listingId = deleteModal.dataset.listingId;
            if (listingId) {
                deleteListing(listingId);
                deleteModal.style.display = 'none';
            }
        });
    }

    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Make functions globally available
window.closeEditModal = closeEditModal;
