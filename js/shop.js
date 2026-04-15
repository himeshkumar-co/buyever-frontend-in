$(document).ready(function () {
  const API_BASE = 'http://localhost:5000/api';
  let allProducts = [];
  let allCategories = [];
  let currentCategory = 'all';
  let currentUser = null;

  // Get category from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    currentCategory = categoryParam;
  }

  // Check if user is logged in
  checkAuth();

  // Load initial data
  loadCategories();
  loadProducts();

  // Cart Logic
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Event delegation for quantity buttons
  $(document).on('click', '.quantity-right-plus', function (e) {
    e.preventDefault();
    var $input = $(this).closest('.product-qty').find('.quantity-input');
    var currentVal = parseInt($input.val());
    if (!isNaN(currentVal)) {
      $input.val(currentVal + 1);
    } else {
      $input.val(1);
    }
  });

  $(document).on('click', '.quantity-left-minus', function (e) {
    e.preventDefault();
    var $input = $(this).closest('.product-qty').find('.quantity-input');
    var currentVal = parseInt($input.val());
    if (!isNaN(currentVal) && currentVal > 1) {
      $input.val(currentVal - 1);
    } else {
      $input.val(1);
    }
  });

  // Category click handler
  $(document).on('click', '.category-item', function (e) {
    e.preventDefault();
    const categoryId = $(this).data('category');

    // Update active state
    $('.category-item').removeClass('active');
    $(this).addClass('active');

    currentCategory = categoryId;
    filterProducts(categoryId);
  });

  // Event delegation for quantity buttons (swapped for modern toggle interaction)
  $(document).on('click', '.add-to-cart-btn-main', function (e) {
    e.preventDefault();
    const id = $(this).data('id');
    const product = allProducts.find(p => p._id === id);

    if (product) {
      updateProductQty(id, 1);

      // UI Toggle
      $(`#action-area-${id}`).html(`
            <div class="input-group product-qty-toggle shadow-sm rounded-3 overflow-hidden d-flex align-items-center bg-success text-white w-100" style="height: 38px;">
                <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-left-minus" data-id="${id}">
                    <i class="fas fa-minus"></i>
                </button>
                <div class="flex-grow-1 text-center fw-bold quantity-display">1</div>
                <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-right-plus" data-id="${id}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `);
    }
  });

  $(document).on('click', '.quantity-right-plus', function (e) {
    e.preventDefault();
    const id = $(this).data('id');
    const $display = $(this).siblings('.quantity-display');
    if (!$display.length) return; // For other types of qty inputs if any

    let currentQty = parseInt($display.text());
    currentQty++;
    $display.text(currentQty);
    updateProductQty(id, currentQty);
  });

  $(document).on('click', '.quantity-left-minus', function (e) {
    e.preventDefault();
    const id = $(this).data('id');
    const $display = $(this).siblings('.quantity-display');
    if (!$display.length) return;

    let currentQty = parseInt($display.text());
    if (currentQty > 1) {
      currentQty--;
      $display.text(currentQty);
      updateProductQty(id, currentQty);
    } else {
      // Revert to ADD button
      updateProductQty(id, 0);
      $(`#action-area-${id}`).html(`
            <button class="btn btn-outline-success w-100 rounded-3 add-to-cart-btn-main py-2 fw-bold" data-id="${id}" style="height: 38px;">
                <i class="fas fa-plus me-2"></i>ADD
            </button>
        `);
    }
  });

  async function updateProductQty(id, qty) {
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
        await fetch(`${API_BASE}/cart/${currentUser._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id, quantity: qty })
        });
      } catch (err) {
        console.error('Failed to sync with DB:', err);
      }
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      allCategories = await response.json();

      const $categoryList = $('#category-list');

      allCategories.forEach(cat => {
        const activeClass = (currentCategory === cat._id) ? 'active' : '';
        const html = `
                  <div class="category-item ${activeClass}" data-category="${cat._id}">
                    <img src="${cat.image || 'images/icon-vegetables-broccoli.png'}" 
                         alt="${cat.name}" 
                         style="width: 24px; height: 24px; margin-right: 10px; object-fit: contain;">
                    ${cat.name}
                  </div>
                `;
        $categoryList.append(html);
      });

      // Update "All Products" active state
      if (currentCategory === 'all') {
        $('.category-item[data-category="all"]').addClass('active');
      } else {
        $('.category-item[data-category="all"]').removeClass('active');
      }

    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch(`${API_BASE}/products`);
      allProducts = await response.json();
      filterProducts(currentCategory);
    } catch (error) {
      console.error('Error loading products:', error);
      $('#product-list').html('<div class="col-12 text-center text-danger">Failed to load products.</div>');
    }
  }

  function filterProducts(categoryId) {
    const $productList = $('#product-list');
    $productList.empty();

    let filteredProducts = allProducts;

    if (categoryId !== 'all') {
      filteredProducts = allProducts.filter(p => p.category && p.category._id === categoryId);
      const category = allCategories.find(c => c._id === categoryId);
      $('#category-title').text(category ? category.name : 'Products');
    } else {
      $('#category-title').text('All Products');
    }

    $('#product-count').text(`${filteredProducts.length} products`);

    if (filteredProducts.length === 0) {
      $productList.html('<div class="col-12 text-center justify-content-center text-muted py-5"><h4>No products found in this category</h4></div>');
      return;
    }

    filteredProducts.forEach(product => {
      const cartItem = cart.find(item => item.id === product._id);
      const initialQty = cartItem ? cartItem.quantity : 0;

      const html = `
            <div class="col">
              <div class="product-item card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
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
                        <svg width="12" height="12" class="text-warning"><use xlink:href="#star-solid"></use></svg> 4.5
                    </span>
                  </div>
                  
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <span class="price h6 mb-0 fw-bold text-success">₹${product.price}</span>
                  </div>

                  <div id="action-area-${product._id}">
                    ${initialQty > 0 ? `
                        <div class="input-group product-qty-toggle shadow-sm rounded-3 overflow-hidden d-flex align-items-center bg-success text-white w-100" style="height: 38px;">
                            <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-left-minus" data-id="${product._id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <div class="flex-grow-1 text-center fw-bold quantity-display">${initialQty}</div>
                            <button type="button" class="btn btn-sm text-white border-0  h-100 quantity-right-plus" data-id="${product._id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    ` : `
                        <button class="btn btn-outline-success w-100 rounded-3 add-to-cart-btn-main py-2 fw-bold" data-id="${product._id}" style="height: 38px;">
                            <i class="fas fa-plus me-2"></i>ADD
                        </button>
                    `}
                  </div>
                </div>
              </div>
            </div>
            `;
      $productList.append(html);
    });
  }

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

    // Show success message
    const toast = `
          <div class="position-fixed top-0 end-0 p-3" style="z-index: 11">
            <div class="toast show" role="alert">
              <div class="toast-header bg-success text-white">
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
              </div>
              <div class="toast-body">
                ${product.name} (x${product.quantity}) added to cart!
              </div>
            </div>
          </div>
        `;
    $('body').append(toast);
    setTimeout(() => $('.toast').remove(), 3000);
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    let totalItems = 0;
    let totalPrice = 0;
    const $cartList = $('.list-group.mb-3');
    const $badge = $('.cart-count');

    if ($cartList.length) $cartList.empty();

    cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;

      if ($cartList.length) {
        const html = `
                <li class="list-group-item d-flex justify-content-between lh-sm">
                  <div class="d-flex flex-column">
                    <h6 class="my-0 text-truncate" style="max-width: 150px;">${item.name}</h6>
                    <small class="text-body-secondary">Qty: ${item.quantity}</small>
                  </div>
                  <div class="d-flex flex-column align-items-end">
                    <span class="text-body-secondary">₹${(item.price * item.quantity).toFixed(2)}</span>
                    <a href="#" class="text-danger small" onclick="removeCartItem('${item.id}')">Remove</a>
                  </div>
                </li>
                `;
        $cartList.append(html);
      }
    });

    if ($cartList.length) {
      const totalHtml = `
            <li class="list-group-item d-flex justify-content-between active">
              <span>Total (INR)</span>
              <strong>₹${totalPrice.toFixed(2)}</strong>
            </li>
            <li class="list-group-item p-0 mt-3 border-0">
              <button class="w-100 btn btn-success btn-lg checkout-btn" ${cart.length === 0 ? 'disabled' : ''}>Place Order</button>
            </li>
            `;
      $cartList.append(totalHtml);
    }

    $badge.text(totalItems);
  }

  // Checkout Button Click
  $(document).on('click', '.checkout-btn', async function (e) {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!currentUser) {
      alert('Please login to place an order');
      window.location.href = 'login.html';
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
        const order = await response.json();
        showOrderModal(order);
        cart = [];
        saveCart();
        updateCartUI();

        // Clear DB cart after order
        if (currentUser) {
          await fetch(`${API_BASE}/cart/${currentUser._id}`, { method: 'DELETE' });
        }
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('An error occurred. Please try again.');
    }
  });

  window.removeCartItem = function (id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
  };

  function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      currentUser = JSON.parse(user);
      updateAuthButtons();
      loadDBCart();
    } else {
      updateAuthButtons();
    }
  }

  async function loadDBCart() {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/cart/${currentUser._id}`);
      if (response.ok) {
        const dbCart = await response.json();
        if (dbCart.items && dbCart.items.length > 0) {
          cart = dbCart.items.map(item => ({
            id: item.productId._id || item.productId,
            name: item.productId.name,
            price: item.productId.price,
            quantity: item.quantity,
            image: item.productId.image
          }));
          saveCart();
          updateCartUI();
        }
      }
    } catch (err) {
      console.error('Failed to load cart from DB:', err);
    }
  }

  function updateAuthButtons() {
    const $authButtons = $('#auth-buttons');
    const $userName = $('#user-name');
    $authButtons.empty();

    if (currentUser) {
      if ($userName.length) $userName.text(`Welcome, ${currentUser.username}`);
      const html = `
        <div class="dropdown">
          <button class="btn btn-outline-success dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="fas fa-user-circle me-1"></i>${currentUser.username}
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </div>
      `;
      $authButtons.html(html);
    } else {
      if ($userName.length) $userName.text('');
      const html = `
        <a href="login.html" class="btn btn-outline-success me-2">Login</a>
        <a href="signup.html" class="btn btn-success">Sign Up</a>
      `;
      $authButtons.html(html);
    }
  }

  function showOrderModal(order) {
    const $orderDetails = $('#orderDetails');
    $orderDetails.empty();

    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center">
            <img src="${item.image || 'images/thumb-bananas.png'}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: contain; margin-right: 10px;">
            <div>
              <div class="fw-bold">${item.name}</div>
              <small class="text-muted">Qty: ${item.quantity}</small>
            </div>
          </div>
          <span class="fw-bold">₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `;
    });

    const orderHtml = `
      <div class="border rounded p-3 mb-3">
        <h6 class="fw-bold mb-3">Order #${order._id.slice(-8).toUpperCase()}</h6>
        ${itemsHtml}
        <hr>
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold">Total Amount:</span>
          <span class="fw-bold text-success h5">₹${order.total.toFixed(2)}</span>
        </div>
        <div class="mt-2">
          <small class="text-muted">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</small>
        </div>
        <div class="mt-2">
          <span class="badge bg-warning text-dark">Status: ${order.status}</span>
        </div>
      </div>
    `;

    $orderDetails.html(orderHtml);
    $('#orderModal').modal('show');
  }

  window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthButtons();
  };

  // Initial UI update
  updateCartUI();
});
