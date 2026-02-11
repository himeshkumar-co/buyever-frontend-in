// js/slider.js

let slides = document.querySelectorAll(".slide");
let index = 0;

function showSlide(i) {
  slides.forEach(slide => slide.classList.remove("active"));
  slides[i].classList.add("active");
}

function autoSlide() {
  index++;
  if (index >= slides.length) index = 0;
  showSlide(index);
}

setInterval(autoSlide, 3000);
/* ================= CATEGORY SLIDER AUTO SCROLL ================= */
/* ================= ADS SLIDER ================= */
const ads = document.querySelectorAll(".ads-slide");
let currentAd = 0;

setInterval(() => {
  ads[currentAd].classList.remove("active");
  currentAd = (currentAd + 1) % ads.length;
  ads[currentAd].classList.add("active");
}, 3000); // 3 sec
