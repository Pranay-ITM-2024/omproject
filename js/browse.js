// Browse products functionality
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
    formatDate,
    formatCurrency,
    truncateText,
    showNotification
} from './firebase.js';

// Initialize browse page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Browse page DOM loaded');
    // Browse products should be accessible to authenticated users
    // But we'll show different features based on authentication status
    setTimeout(() => {
        initializeBrowsePage();
    }, 1000);
});

let allProducts = [];
let filteredProducts = [];
let currentView = 'grid';

async function initializeBrowsePage() {
    // Load all products
    await loadProducts();

    // Initialize event listeners
    initializeEventListeners();

    // Display products
    displayProducts(allProducts);
}

async function loadProducts() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const productsGrid = document.getElementById('products-grid');

    try {
        loadingSpinner.style.display = 'block';
        productsGrid.style.display = 'none';

        // Query all products from Firestore
        const productsQuery = query(
            collection(db, 'listings'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(productsQuery);
        allProducts = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            allProducts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        filteredProducts = [...allProducts];
        updateResultsCount(filteredProducts.length);

    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products. Please try again.', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
        productsGrid.style.display = currentView === 'grid' ? 'grid' : 'block';
    }
}

function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // Filter functionality
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilter);
    }

    if (priceFilter) {
        priceFilter.addEventListener('change', handleFilter);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', handleSort);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // View toggle
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');

    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => toggleView('grid'));
    }

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => toggleView('list'));
    }

    // Show all button
    const showAllBtn = document.getElementById('show-all-btn');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', showAllProducts);
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();

    if (!searchTerm) {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.keywords && product.keywords.toLowerCase().includes(searchTerm))
        );
    }

    applyFilters();
}

function handleFilter() {
    applyFilters();
}

function applyFilters() {
    let products = [...filteredProducts];

    // Apply category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter && categoryFilter.value) {
        products = products.filter(product => product.category === categoryFilter.value);
    }

    // Apply price filter
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter && priceFilter.value) {
        const maxPrice = parseFloat(priceFilter.value);
        products = products.filter(product => product.price <= maxPrice);
    }

    filteredProducts = products;
    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
}

function handleSort() {
    const sortFilter = document.getElementById('sort-filter');
    if (!sortFilter || !sortFilter.value) return;

    const sortBy = sortFilter.value;

    switch (sortBy) {
        case 'newest':
            filteredProducts.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
    }

    displayProducts(filteredProducts);
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('price-filter').value = '';
    document.getElementById('sort-filter').value = 'newest';

    filteredProducts = [...allProducts];
    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
}

function showAllProducts() {
    clearFilters();
    document.getElementById('no-products').style.display = 'none';
}

function toggleView(view) {
    currentView = view;

    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const productsGrid = document.getElementById('products-grid');

    if (view === 'grid') {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        productsGrid.className = 'products-grid';
    } else {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        productsGrid.className = 'products-list';
    }

    displayProducts(filteredProducts);
}

function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');

    if (products.length === 0) {
        productsGrid.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }

    noProducts.style.display = 'none';

    const productsHTML = products.map(product => createProductCard(product)).join('');
    productsGrid.innerHTML = productsHTML;

    // Add click event listeners to product cards
    addProductCardListeners();
}

function createProductCard(product) {
    const isGridView = currentView === 'grid';
    const cardClass = isGridView ? 'product-card' : 'product-card-list';

    return `
        <div class="${cardClass}" data-product-id="${product.id}">
            <div class="product-image">
                <i class="fas fa-image"></i>
                <div class="product-overlay">
                    <button class="btn btn-primary btn-sm view-product" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${truncateText(product.description, 100)}</p>
                <div class="product-meta">
                    <span class="product-category">${product.category}</span>
                    <span class="product-condition">${product.condition}</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-rating">
                        ${generateStarRating(product.rating || 0)}
                        <span class="rating-count">(${product.ratingCount || 0})</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm contact-seller" data-seller-id="${product.sellerId}">
                        <i class="fas fa-envelope"></i> Contact Seller
                    </button>
                    <button class="btn btn-outline btn-sm request-match" data-product-id="${product.id}">
                        <i class="fas fa-magic"></i> Smart Match
                    </button>
                </div>
            </div>
        </div>
    `;
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

function addProductCardListeners() {
    // View product details
    document.querySelectorAll('.view-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('.view-product').dataset.productId;
            showProductModal(productId);
        });
    });

    // Contact seller
    document.querySelectorAll('.contact-seller').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sellerId = e.target.closest('.contact-seller').dataset.sellerId;
            contactSeller(sellerId);
        });
    });

    // Request smart match
    document.querySelectorAll('.request-match').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('.request-match').dataset.productId;
            requestSmartMatch(productId);
        });
    });
}

async function showProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <div class="product-modal-content">
            <div class="product-modal-image">
                <i class="fas fa-image"></i>
            </div>
            <div class="product-modal-info">
                <h2>${product.title}</h2>
                <div class="product-modal-meta">
                    <span class="category">${product.category}</span>
                    <span class="condition">${product.condition}</span>
                    <span class="price">${formatCurrency(product.price)}</span>
                </div>
                <div class="product-modal-description">
                    <h3>Description</h3>
                    <p>${product.description}</p>
                </div>
                <div class="product-modal-keywords">
                    <h3>Keywords</h3>
                    <p>${product.keywords || 'No keywords provided'}</p>
                </div>
                <div class="product-modal-actions">
                    <button class="btn btn-primary contact-seller" data-seller-id="${product.sellerId}">
                        <i class="fas fa-envelope"></i> Contact Seller
                    </button>
                    <button class="btn btn-outline request-match" data-product-id="${product.id}">
                        <i class="fas fa-magic"></i> Request Smart Match
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // Add event listeners to modal buttons
    modal.querySelector('.contact-seller').addEventListener('click', () => {
        contactSeller(product.sellerId);
        modal.style.display = 'none';
    });

    modal.querySelector('.request-match').addEventListener('click', () => {
        requestSmartMatch(product.id);
        modal.style.display = 'none';
    });
}

function contactSeller(sellerId) {
    // This would typically open a contact form or messaging system
    showNotification('Contact seller functionality will be implemented in Phase 4', 'info');
}

function requestSmartMatch(productId) {
    // Redirect to smart matching page with product pre-selected
    window.location.href = `matching.html?product=${productId}`;
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${count} product${count !== 1 ? 's' : ''} found`;
    }
}

// Debounce utility function
function debounce(func, wait) {
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

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('product-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Close modal with X button
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close')) {
        document.getElementById('product-modal').style.display = 'none';
    }
});
