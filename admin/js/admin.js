const API_BASE = 'http://localhost:5000/api';
let categories = [];
let products = [];
let orders = [];
let salesChart = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  // Toggle Sidebar
  const el = document.getElementById("wrapper");
  const toggleButton = document.getElementById("menu-toggle");

  if (toggleButton && el) {
    toggleButton.onclick = function () {
      el.classList.toggle("toggled");
    };
  }

  // Initial Load
  fetchData().then(() => {
    if (document.getElementById('total-categories-count')) renderDashboard();
    if (document.getElementById('categories-table-body')) renderCategories();
    if (document.getElementById('products-table-body')) renderProducts();
    if (document.getElementById('salesChart')) initChart();
  });
});

// Auth Checks
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Data Fetching
async function fetchData() {
  try {
    const [catRes, prodRes, orderRes] = await Promise.all([
      fetch(`${API_BASE}/categories`),
      fetch(`${API_BASE}/products`),
      fetch(`${API_BASE}/orders/admin/all`)
    ]);

    if (catRes.ok) categories = await catRes.json();
    if (prodRes.ok) products = await prodRes.json();
    if (orderRes.ok) orders = await orderRes.json();

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// View Switching
function switchView(viewName, element) {
  // Hide all views
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none'));
  // Show selected view
  document.getElementById(`${viewName}-view`).classList.remove('d-none');

  // Update Title
  document.getElementById('page-title').innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1);

  // Update active class
  document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');

  // Refresh view specific components
  if (viewName === 'categories') renderCategories();
  if (viewName === 'products') renderProducts();
}


// Dashboard Logic
function renderDashboard() {
  document.getElementById('total-categories-count').textContent = categories.length;
  document.getElementById('total-products-count').textContent = products.length;
  document.getElementById('total-orders-count').textContent = orders.length;

  const recentList = document.getElementById('recent-products-list');
  recentList.innerHTML = '';

  // Take last 5 products (assuming newest at end or sort by createdAt if available)
  // Here we'll just reve$e show top 5
  const recent = [...products].reverse().slice(0, 5);

  recent.forEach(prod => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center py-3';
    li.innerHTML = `
            <div class="d-flex flex-column">
                <span class="fw-bold">${prod.name}</span>
                <span class="text-muted small">${prod.category?.name || 'Uncategorized'}</span>
            </div>
            <span class="badge bg-success rounded-pill">₹${prod.price}</span>
        `;
    recentList.appendChild(li);
  });
}

function initChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');

  // Dummy Data for chart
  if (salesChart) salesChart.destroy();

  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales (₹)',
        data: [1200, 1900, 3000, 5000, 2300, 4000],
        borderColor: '#009d63',
        backgroundColor: 'rgba(0, 157, 99, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


// Category Logic
function renderCategories() {
  const tbody = document.getElementById('categories-table-body');
  tbody.innerHTML = '';
  categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td><img src="${cat.image || 'https://via.placeholder.com/50'}" width="50" height="50" class="rounded object-fit-cover"></td>
            <td>${cat.name}</td>
            <td>${cat.description ? cat.description.substring(0, 50) + '...' : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="editCategory('${cat._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${cat._id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

const catModalEl = document.getElementById('categoryModal') || document.getElementById('addCategoryModal');
const catModal = catModalEl ? new bootstrap.Modal(catModalEl) : null;

function openAddCategoryModal() {
  document.getElementById('categoryForm').reset();
  document.getElementById('catId').value = '';
  document.getElementById('categoryModalTitle').textContent = 'Add Category';
  catModal.show();
}

async function editCategory(id) {
  const cat = categories.find(c => c._id === id);
  if (!cat) return;

  document.getElementById('catId').value = cat._id;
  document.getElementById('catName').value = cat.name;
  document.getElementById('catDesc').value = cat.description;
  document.getElementById('catImage').value = cat.image || '';
  document.getElementById('categoryModalTitle').textContent = 'Edit Category';

  catModal.show();
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('catId').value;
  const data = {
    name: document.getElementById('catName').value,
    description: document.getElementById('catDesc').value,
    image: document.getElementById('catImage').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_BASE}/categories/${id}` : `${API_BASE}/categories`;

  await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  catModal.hide();
  await fetchData();
  renderCategories();
  renderDashboard(); // Update counts
});

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  await fetchData();
  renderCategories();
  renderDashboard();
}

// Product Logic
function renderProducts() {
  const tbody = document.getElementById('products-table-body');
  tbody.innerHTML = '';
  products.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td><img src="${prod.image || 'https://via.placeholder.com/50'}" width="50" height="50" class="rounded object-fit-cover"></td>
            <td>${prod.name}</td>
            <td>${prod.category?.name || 'N/A'}</td>
            <td>₹${prod.price}</td>
             <td>${prod.stock}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="editProduct('${prod._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${prod._id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

const prodModal = new bootstrap.Modal(document.getElementById('productModal'));

function openAddProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('productModalTitle').textContent = 'Add Product';
  populateCategorySelect();
  prodModal.show();
}

function populateCategorySelect(selectedId = null) {
  const select = document.getElementById('prodCategory');
  select.innerHTML = '<option value="">Select Category</option>';
  categories.forEach(c => {
    const option = document.createElement('option');
    option.value = c._id;
    option.textContent = c.name;
    if (selectedId && c._id === selectedId) option.selected = true;
    select.appendChild(option);
  });
}

async function editProduct(id) {
  const prod = products.find(p => p._id === id);
  if (!prod) return;

  document.getElementById('prodId').value = prod._id;
  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodPrice').value = prod.price;
  document.getElementById('prodStock').value = prod.stock;
  document.getElementById('prodImage').value = prod.image || '';
  document.getElementById('prodDesc').value = prod.description;
  document.getElementById('productModalTitle').textContent = 'Edit Product';

  populateCategorySelect(prod.category?._id || prod.category); // Handle if populated or ID

  prodModal.show();
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const data = {
    name: document.getElementById('prodName').value,
    price: document.getElementById('prodPrice').value,
    category: document.getElementById('prodCategory').value,
    stock: document.getElementById('prodStock').value,
    image: document.getElementById('prodImage').value,
    description: document.getElementById('prodDesc').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;

  await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  prodModal.hide();
  await fetchData();
  renderProducts();
  renderDashboard();
});

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  await fetchData();
  renderProducts();
  renderDashboard();
}
