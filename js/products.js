$(document).ready(function () {
    const API_BASE = 'http://localhost:5000/api';
    const $productList = $('#product-list');
    const $categoryWrapper = $('#category-wrapper');
    let allProducts = [];
    let allCategories = [];
    let currentCategory = 'all';
    let currentUser = null;

    checkAuth();

    function showToast(message, type = 'success') {
        const $toastMessage = $('#toastMessage');
        const $toast = $('#statusToast');

        if (!$toast.length || !$toastMessage.length) {
            alert(message);
            return;
        }

        $toastMessage.text(message);
        $toast.removeClass('bg-success bg-danger bg-warning bg-info');

        const typeClass = type === 'success' ? 'bg-success' :
            type === 'error' ? 'bg-danger' :
                type === 'warning' ? 'bg-warning' : 'bg-info';

        $toast.addClass(typeClass);
        const bsToast = new bootstrap.Toast($toast[0]);
        bsToast.show();
    }

    if ($productList.length || $('.dynamic-product-grid').length) {
        loadProducts();
    }

    if ($categoryWrapper.length) {
        loadCategories();
    }

    // Event delegation for quantity buttons (swapped for modern toggle interaction)
    $(document).on('click', '.add-to-cart-btn-main', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const $card = $(this).closest('.product-item');
        const product = allProducts.find(p => p._id === id);

        if (product) {
            updateProductQty(id, 1);

            // UI Toggle
            $(`.action-area-container[data-product-id="${id}"]`).html(`
                <div class="input-group product-qty-toggle shadow-sm rounded-3 overflow-hidden d-flex align-items-center bg-success text-white w-100" style="height: 46px;">
                    <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-left-minus" data-id="${id}">
                        <svg width="22" height="22" fill="currentColor"><use xlink:href="#minus"></use></svg>
                    </button>
                    <div class="flex-grow-1 text-center fw-bold quantity-display">1</div>
                    <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-right-plus" data-id="${id}">
                        <svg width="22" height="22" fill="currentColor"><use xlink:href="#plus"></use></svg>
                    </button>
                </div>
            `);
        }
    });

    $(document).on('click', '.product-item .quantity-right-plus', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const $displays = $(`.action-area-container[data-product-id="${id}"] .quantity-display`);
        let currentQty = parseInt($($displays[0]).text());
        currentQty++;
        $displays.text(currentQty);
        updateProductQty(id, currentQty, true); // true means absolute update
    });

    $(document).on('click', '.product-item .quantity-left-minus', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const $displays = $(`.action-area-container[data-product-id="${id}"] .quantity-display`);
        let currentQty = parseInt($($displays[0]).text());

        if (currentQty > 1) {
            currentQty--;
            $displays.text(currentQty);
            updateProductQty(id, currentQty, true);
        } else {
            // Revert to ADD button
            updateProductQty(id, 0, true);
            $(`.action-area-container[data-product-id="${id}"]`).html(`
                <button class="btn btn-outline-success w-100 rounded-3 add-to-cart-btn-main py-2 fw-bold" data-id="${id}" style="height: 46px;">
                    <svg width="20" height="20" fill="currentColor" class="me-2"><use xlink:href="#plus"></use></svg>ADD
                </button>
            `);
        }
    });

    async function updateProductQty(id, qty, isAbsolute = false) {
        const productData = allProducts.find(p => p._id === id);
        if (!productData) return;

        const cartItem = cart.find(item => item.id === id);

        if (qty === 0) {
            cart = cart.filter(item => item.id !== id);
        } else {
            if (cartItem) {
                cartItem.quantity = qty;
            } else {
                cart.push({
                    id: productData._id,
                    name: productData.name,
                    price: productData.price,
                    quantity: qty,
                    image: productData.image
                });
            }
        }

        saveCart();
        updateCartUI();

        // Sync with DB if logged in
        if (currentUser) {
            try {
                // Use PUT for absolute quantity updates to avoid double-adding in backend
                await fetch(`${API_BASE}/cart/${currentUser._id}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: qty })
                });
            } catch (err) {
                console.error('Failed to sync with DB:', err);
            }
        }
    }

    // Category filter click handler (for dashboard sidebar if exists)
    $(document).on('click', '.category-filter-item', function (e) {
        e.preventDefault();
        const categoryId = $(this).data('category');

        // Update active state
        $('.category-filter-item').removeClass('active');
        $(this).addClass('active');

        currentCategory = categoryId;
        filterProducts(categoryId);
    });


    function loadProducts() {
        fetch(`${API_BASE}/products`)
            .then(res => res.json())
            .then(data => {
                allProducts = data;
                renderAllGrids();
            })
            .catch(err => {
                console.error('Failed to load products:', err);
                $('.dynamic-product-grid').each(function () {
                    $(this).html('<div class="col-12 text-center text-danger py-5">Failed to load products. Ensure backend is running.</div>');
                });
            });
    }

    function renderAllGrids() {
        $('.dynamic-product-grid').each(function () {
            const $grid = $(this);
            const categoryName = $grid.data('category-name');
            const categoryId = $grid.data('category');

            let productsToRender = allProducts;

            if (categoryId && categoryId !== 'all') {
                productsToRender = allProducts.filter(p => p.category && p.category._id === categoryId);
            } else if (categoryName) {
                productsToRender = allProducts.filter(p => {
                    return p.category && (p.category.name === categoryName || p.category === categoryName);
                });
            }

            renderGrid($grid, productsToRender);
        });
    }

    function renderGrid($container, products) {
        $container.empty();
        if (products.length === 0) {
            $container.html('<div class="col-12 text-center py-5"><p class="text-muted">No products found in this category.</p></div>');
            return;
        }
        products.forEach(product => {
            const cartItem = cart.find(item => item.id === product._id);
            const initialQty = cartItem ? cartItem.quantity : 0;

            const html = `
                <div class="col mb-4">
                  <div class="product-item card h-100 border-0 shadow-sm rounded-4 overflow-hidden" data-id="${product._id}">
                    <a href="#" class="btn-wishlist position-absolute top-0 end-0 m-3 z-1">
                        <svg width="24" height="24"><use xlink:href="#heart"></use></svg>
                    </a>
                    
                    <div class="product-image-wrapper p-3 bg-light-subtle">
                      <a href="#" title="${product.name}">
                        <img src="${product.image || 'images/thumb-bananas.png'}" 
                             class="tab-image w-100" 
                             style="height: 180px; object-fit: contain; transition: transform 0.5s ease;">
                      </a>
                    </div>

                    <div class="card-body p-3">
                      <h3 class="h6 mb-2 text-dark fw-bold" style="height: 2.5rem; overflow: hidden;">${product.name}</h3>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="qty text-muted small"><i class="fas fa-box-open me-1"></i>${product.stock} Units</span>
                        <span class="rating badge bg-light text-dark border d-flex align-items-center gap-1" style="font-size: 0.7rem;">
                            <svg width="14" height="14" class="text-warning"><use xlink:href="#star-solid"></use></svg> 4.5
                        </span>
                      </div>
                      
                      <div class="d-flex align-items-center justify-content-between mb-3">
                        <span class="price h6 mb-0 fw-bold text-success">₹${product.price}</span>
                      </div>

                      <div class="action-area action-area-container" data-product-id="${product._id}">
                        ${initialQty > 0 ? `
                          <div class="input-group product-qty-toggle shadow-sm rounded-3 overflow-hidden d-flex align-items-center bg-success text-white w-100" style="height: 46px;">
                              <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-left-minus" data-id="${product._id}">
                                  <svg width="22" height="22" fill="currentColor"><use xlink:href="#minus"></use></svg>
                              </button>
                              <div class="flex-grow-1 text-center fw-bold quantity-display">${initialQty}</div>
                              <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-right-plus" data-id="${product._id}">
                                  <svg width="22" height="22" fill="currentColor"><use xlink:href="#plus"></use></svg>
                              </button>
                          </div>
                        ` : `
                          <button class="btn btn-outline-success w-100 rounded-3 add-to-cart-btn-main py-2 fw-bold" data-id="${product._id}" style="height: 46px;">
                            <svg width="20" height="20" fill="currentColor" class="me-2"><use xlink:href="#plus"></use></svg>ADD
                          </button>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
            `;
            $container.append(html);
        });
    }

    async function loadCategories() {
        try {
            const response = await fetch(`${API_BASE}/categories`);
            const categories = await response.json();

            $categoryWrapper.empty();

            categories.forEach(cat => {
                const html = `
                  <a href="shop.html?category=${cat._id}" class="nav-link category-item swiper-slide">
                    <img src="${cat.image || 'images/icon-vegetables-broccoli.png'}" alt="Category Thumbnail" class="category-img">
                    <h3 class="category-title">${cat.name}</h3>
                  </a>
                `;
                $categoryWrapper.append(html);
            });

            // Initialize Swiper
            new Swiper(".category-carousel", {
                slidesPerView: 6,
                spaceBetween: 30,
                speed: 500,
                navigation: {
                    nextEl: ".category-carousel-next",
                    prevEl: ".category-carousel-prev",
                },
                breakpoints: {
                    0: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    991: { slidesPerView: 4 },
                    1500: { slidesPerView: 6 },
                }
            });

        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // --- Cart Logic ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();

    // Add to Cart Button Click
    $productList.on('click', '.add-to-cart-btn', function (e) {
        e.preventDefault();
        const $card = $(this).closest('.product-item');
        const id = $(this).data('id');
        const name = $card.find('h3').text();
        const priceText = $card.find('.price').text();
        const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
        const quantity = parseInt($card.find('.quantity-input').val()) || 1;
        const image = $card.find('.tab-image').attr('src');

        addToCart({ id, name, price, quantity, image });
    });

    async function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += product.quantity;
        } else {
            cart.push(product);
        }
        saveCart();
        updateCartUI();

        // Sync with database if logged in
        if (currentUser) {
            try {
                await fetch(`${API_BASE}/cart/${currentUser._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: product.id, quantity: product.quantity })
                });
            } catch (err) {
                console.error('Failed to sync cart with DB:', err);
            }
        }

        showToast(`${product.name} (x${product.quantity}) added to cart!`);
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        let totalItems = 0;
        let totalPrice = 0;
        const $cartList = $('.list-group.mb-3'); // Targeting the cart offcanvas list
        const $cartTotalEl = $('.cart-total');
        const $badge = $('.badge.bg-primary.rounded-pill'); // Offcanvas badge
        const $headerBadge = $('.badge.bg-primary'); // Header cart count if exists

        if ($cartList.length) $cartList.empty();

        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;

            if ($cartList.length) {
                const html = `
                <li class="list-group-item d-flex justify-content-between lh-sm p-3">
                  <div class="d-flex flex-column">
                    <h6 class="my-0 text-dark fw-bold">${item.name}</h6>
                    <small class="text-muted">Qty: ${item.quantity}</small>
                  </div>
                  <div class="d-flex flex-column align-items-end">
                    <span class="text-success fw-bold">₹${(item.price * item.quantity).toFixed(2)}</span>
                    <a href="#" class="text-danger small text-decoration-none mt-1" onclick="removeCartItem('${item.id}')">
                      <i class="fas fa-trash-alt me-1"></i>Remove
                    </a>
                  </div>
                </li>
                `;
                $cartList.append(html);
            }
        });

        // Add Total row and Checkout button
        if ($cartList.length) {
            const totalHtml = `
            <li class="list-group-item d-flex justify-content-between active">
              <span>Total (IND)</span>
              <strong>₹${totalPrice.toFixed(2)}</strong>
            </li>
            <li class="list-group-item p-0 mt-3 border-0">
              <button class="w-100 btn btn-success btn-lg checkout-btn" ${cart.length === 0 ? 'disabled' : ''}>Place Order</button>
            </li>
            `;
            $cartList.append(totalHtml);
        }

        // Update badges and totals
        // Update specific cart count badge in header and offcanvas
        $badge.text(totalItems);

        // Also try to find header badge
        $('.cart-count').text(totalItems); // If specific class

        if ($cartTotalEl.length) $cartTotalEl.text(`₹${totalPrice.toFixed(2)}`);
    }

    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            currentUser = JSON.parse(user);
            updateAuthDisplay();
            loadDBCart(); // Load cart from DB if logged in
        } else {
            updateAuthDisplay();
        }
    }

    function updateAuthDisplay() {
        const $authButtons = $('#auth-buttons');
        const $userName = $('#user-name');

        if (currentUser) {
            $userName.text(`Welcome, ${currentUser.username}`);
            $authButtons.html(`
                <button class="btn btn-outline-danger btn-sm" onclick="logout()">Logout</button>
            `);
        } else {
            $userName.text('');
            $authButtons.html(`
                <a href="login.html" class="btn btn-outline-primary btn-sm me-2">Login</a>
                <a href="signup.html" class="btn btn-primary btn-sm">Sign Up</a>
            `);
        }
    }

    async function loadDBCart() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${API_BASE}/cart/${currentUser._id}`);
            if (response.ok) {
                const dbCart = await response.json();
                if (dbCart.items && dbCart.items.length > 0) {
                    // Simple merge: DB cart takes precedence or we merge them
                    // For now, let's just use DB cart if it exists
                    cart = dbCart.items.map(item => ({
                        id: item.productId._id || item.productId,
                        name: item.productId.name,
                        price: item.productId.price,
                        quantity: item.quantity,
                        image: item.productId.image
                    }));
                    saveCart();
                    updateCartUI();
                    if (allProducts.length > 0) renderAllGrids(); // Refresh UI to show correct quantities
                }
            }
        } catch (err) {
            console.error('Failed to load cart from DB:', err);
        }
    }

    window.logout = function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        cart = [];
        saveCart();
        window.location.reload();
    };

    // Checkout Button Click
    $(document).on('click', '.checkout-btn', async function (e) {
        e.preventDefault();
        if (cart.length === 0) return;

        if (!currentUser) {
            showToast('Please login to place an order', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        try {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const items = cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            }));

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items, total })
            });

            if (response.ok) {
                showToast('Order placed successfully! 🎉', 'success');

                // Clear cart locally and in DB
                cart = [];
                saveCart();
                updateCartUI();
                renderAllGrids(); // Revert all "ADD" buttons on the dashboard

                await fetch(`${API_BASE}/cart/${currentUser._id}`, { method: 'DELETE' });

                // Close offcanvas
                const offcanvasElement = document.getElementById('offcanvasCart');
                if (offcanvasElement) {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement) || new bootstrap.Offcanvas(offcanvasElement);
                    bsOffcanvas.hide();
                }
            } else {
                showToast('Failed to place order. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Order error:', error);
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // Make remove function global and sync with DB
    window.removeCartItem = async function (id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();

        if (currentUser) {
            try {
                await fetch(`${API_BASE}/cart/${currentUser._id}/${id}`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.error('Failed to remove from DB:', err);
            }
        }
    };
});
