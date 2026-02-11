// js/splash.js

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  if (splash) {
    setTimeout(() => {
      splash.style.opacity = "0";
      splash.style.display = "none";
    }, 2000);
  }
});
