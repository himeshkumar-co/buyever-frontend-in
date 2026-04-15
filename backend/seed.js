const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/foodmart')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const seedData = async () => {
    try {
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing data.');

        // Categories
        const categories = await Category.insertMany([
            { name: 'Fruits & Vegetables', description: 'Fresh fruits and veggies directly from the farm.', image: 'images/icon-vegetables-broccoli.png' },
            { name: 'Breads & Sweets', description: 'Freshly baked breads and delicious sweets.', image: 'images/icon-bread-baguette.png' },
            { name: 'Beverages', description: 'Soft drinks, juices, and more.', image: 'images/icon-soft-drinks-bottle.png' },
            { name: 'Meat & Seafood', description: 'High quality meat and seafood.', image: 'images/icon-animal-products-drumsticks.png' }
        ]);

        console.log('Categories added.');

        // Products
        const products = await Product.insertMany([
            {
                name: 'Fresh Bananas',
                description: 'Yellow and sweet bananas.',
                price: 2.50,
                category: categories[0]._id,
                stock: 100,
                image: 'images/thumb-bananas.png'
            },
            {
                name: 'Fresh Milk',
                description: 'Pure cow milk.',
                price: 3.00,
                category: categories[2]._id,
                stock: 50,
                image: 'images/thumb-milk.png'
            },
            {
                name: 'Cucumber',
                description: 'Organic crisp cucumber.',
                price: 1.20,
                category: categories[0]._id,
                stock: 80,
                image: 'images/thumb-cucumber.png'
            },
            {
                name: 'Biscuits',
                description: 'Crunchy digestive biscuits.',
                price: 4.50,
                category: categories[1]._id,
                stock: 200,
                image: 'images/thumb-biscuits.png'
            },
            {
                name: 'Orange Juice',
                description: 'Fresh squeezed orange juice.',
                price: 5.00,
                category: categories[2]._id,
                stock: 30,
                image: 'images/thumb-orange-juice.png'
            },
            {
                name: 'Tomatoes',
                description: 'Red ripe tomatoes.',
                price: 2.00,
                category: categories[0]._id,
                stock: 120,
                image: 'images/thumb-tomatoes.png'
            },
            {
                name: 'Raspberries',
                description: 'Sweet and sour raspberries.',
                price: 6.00,
                category: categories[0]._id,
                stock: 40,
                image: 'images/thumb-raspberries.png'
            },
            {
                name: 'Heinz Tomato Ketchup',
                description: 'Classic tomato ketchup.',
                price: 3.50,
                category: categories[1]._id, // Approximate
                stock: 60,
                image: 'images/thumb-tomatoketchup.png'
            }
        ]);

        console.log('Products added.');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
