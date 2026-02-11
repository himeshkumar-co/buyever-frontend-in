// js/main.js

const productGrid = document.getElementById("productGrid");

// URL se category lena
const params = new URLSearchParams(window.location.search);
const category = params.get("cat");

// title change
if (category) {
  document.getElementById("categoryTitle").innerText =
    category.toUpperCase() + " PRODUCTS";
}

// products show
function loadProducts() {
  if (!products[category]) return;

  productGrid.innerHTML = "";

  products[category].forEach(product => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <img src="${product.img}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>₹${product.price}</p>
      <button onclick='addToCart(${JSON.stringify(product)})'>
        Add to Cart
      </button>
    `;

    productGrid.appendChild(div);
  });
}

loadProducts();
/* ================= CATEGORY OPEN ================= */
function openCategory(catName){
  // category page open + category name pass
  window.location.href = "category.html?cat=" + catName;
}

/* ================= CART COUNT ================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let cartCount = document.getElementById("cartCount");
if(cartCount){
  cartCount.innerText = cart.length;
}
