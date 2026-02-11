// ===============================
// BuyEver – Complete Product Data
// ===============================

const products = {

  // ========= BABY =========
  baby: [
    {id:1,name:"Diapers",price:499,img:"images/baby/diapers.jpg"},
    {id:2,name:"Baby Wipes",price:199,img:"images/baby/wipes.jpg"},
    {id:3,name:"Baby Shampoo",price:249,img:"images/baby/shampoo.jpg"},
    {id:4,name:"Baby Lotion",price:299,img:"images/baby/lotion.jpg"},
    {id:5,name:"Baby Powder",price:149,img:"images/baby/powder.jpg"},
    {id:6,name:"Baby Oil",price:199,img:"images/baby/oil.jpg"},
    {id:7,name:"Baby Soap",price:99,img:"images/baby/soap.jpg"},
    {id:8,name:"Rash Cream",price:179,img:"images/baby/rash.jpg"},
    {id:9,name:"Baby Food",price:399,img:"images/baby/food.jpg"},
    {id:10,name:"Formula Milk",price:499,img:"images/baby/formula.jpg"},
    {id:11,name:"Feeding Bottle",price:299,img:"images/baby/bottle.jpg"},
    {id:12,name:"Pacifier",price:199,img:"images/baby/pacifier.jpg"},
    {id:13,name:"Baby Bedding",price:799,img:"images/baby/bedding.jpg"},
    {id:14,name:"Baby Clothes",price:599,img:"images/baby/clothes.jpg"},
    {id:15,name:"Bibs",price:149,img:"images/baby/bibs.jpg"},
    {id:16,name:"Baby Tub",price:899,img:"images/baby/tub.jpg"},
    {id:17,name:"Teether",price:199,img:"images/baby/teether.jpg"},
    {id:18,name:"Stroller",price:5999,img:"images/baby/stroller.jpg"},
    {id:19,name:"Walker",price:2999,img:"images/baby/walker.jpg"},
    {id:20,name:"Baby Toys",price:499,img:"images/baby/toys.jpg"},
    {id:21,name:"Baby Towel",price:249,img:"images/baby/towel.jpg"},
    {id:22,name:"Baby Cream",price:199,img:"images/baby/cream.jpg"},
    {id:23,name:"Baby Nail Cutter",price:99,img:"images/baby/nail.jpg"},
    {id:24,name:"Baby Comb",price:79,img:"images/baby/comb.jpg"},
    {id:25,name:"Baby Blanket",price:899,img:"images/baby/blanket.jpg"},
    {id:26,name:"Baby Shoes",price:599,img:"images/baby/shoes.jpg"},
    {id:27,name:"Baby Socks",price:199,img:"images/baby/socks.jpg"},
    {id:28,name:"Baby Bib Set",price:299,img:"images/baby/bibset.jpg"},
    {id:29,name:"Mosquito Net",price:699,img:"images/baby/net.jpg"},
    {id:30,name:"Carry Bag",price:1299,img:"images/baby/bag.jpg"}
  ],

  // ========= FRUITS / VEG =========
  fruits: Array.from({length:30},(_,i)=>({
    id:100+i,
    name:`Fresh Item ${i+1}`,
    price:40+i*5,
    img:"images/fruits/sample.jpg"
  })),

  // ========= AUTO GENERATED CATEGORIES =========
  women: gen("Women Fashion",499),
  footwear: gen("Footwear",699),
  kids: gen("Kids Wear",399),
  new: gen("New Arrival",599),
  western: gen("Western Dress",799),
  wedding: gen("Wedding Wear",1499),
  accessories: gen("Accessories",299),
  saree: gen("Saree",999),
  heels: gen("Heels",899),
  puja: gen("Puja Item",199),
  ration: gen("Ration Item",149),
  bags: gen("Bag",799),
  jewellery: gen("Jewellery",1299),
  watch: gen("Watch",1999),
  makeup: gen("Makeup",499),
  kitchen: gen("Kitchen Item",349),
  electronics: gen("Electronics",2999),
  home: gen("Home Product",699),
  books: gen("Book",199),
  wellness: gen("Wellness",399),
  cleaning: gen("Cleaning Item",249),
  decor: gen("Decor Item",899),
  beauty: gen("Beauty Product",499),
  stationery: gen("Stationery",99),
  toys: gen("Toy",349),
  pet: gen("Pet Care",499),
  fitness: gen("Fitness Item",799),
  astrology: gen("Astrology Item",299),
  grocery: gen("Grocery Item",99),
  snacks: gen("Snack",149)
};

// ===============================
// PRODUCT GENERATOR FUNCTION
// ===============================
function gen(name, price){
  return Array.from({length:30},(_,i)=>({
    id: Math.floor(Math.random()*100000),
    name: `${name} ${i+1}`,
    price: price + i*10,
    img: "images/sample-product.png"
  }));
}
