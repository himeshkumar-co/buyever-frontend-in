let slides = [
  "images/slider/slide1.jpg",
  "images/slider/slide2.jpg",
  "images/slider/slide3.jpg",
  "images/slider/slide4.jpg",
  "images/slider/slide5.jpg"
];

let i = 0;
setInterval(()=>{
  document.getElementById("slideImg").src = slides[i];
  i = (i + 1) % slides.length;
},3000);
