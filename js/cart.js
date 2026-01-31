const cartDiv = document.getElementById("cart");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cartDiv) {
  cart.forEach(item => {
    cartDiv.innerHTML += `
      <div class="product">
        <h4>${item.name}</h4>
        <p>₹${item.price}</p>
      </div>
    `;
  });
}
