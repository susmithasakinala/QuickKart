const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function connectDB() {
  if (process.env.MONGO_URI) {
    console.log('🔌 Connecting to MONGO_URI...');
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB via environment URI!');
      await seedDatabase();
      return;
    } catch (err) {
      console.error('❌ Failed to connect to MONGO_URI:', err);
    }
  }

  try {
    console.log('🚀 Starting local MongoDB Memory Server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, 'data', 'db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    const mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dbPath,
        storageEngine: 'wiredTiger',
        persistent: true
      }
    });

    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    await mongoose.connect(uri);
    console.log('✅ Local MongoDB started and connected successfully!');
    console.log('📂 Data is persisting in:', dbPath);
    await seedDatabase();
  } catch (err) {
    console.warn('⚠️ Could not start mongodb-memory-server:', err.message);
    console.log('⚡ Attempting to connect to default localhost MongoDB...');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/quickkart');
      console.log('✅ Connected to local MongoDB at localhost:27017');
      await seedDatabase();
    } catch (localErr) {
      console.error('❌ Could not connect to any MongoDB server.');
      console.log('🛑 Database connection failed. Make sure MongoDB is running.');
    }
  }
}

async function seedDatabase() {
  const User = require('./models/User');
  const Product = require('./models/Product');
  const Cart = require('./models/Cart');
  const Wishlist = require('./models/Wishlist');
  const bcrypt = require('bcryptjs');

  try {
    console.log('🌱 Cleaning old products to seed clean dataset...');
    
    // Find or create the mock seller
    let mockSeller = await User.findOne({ email: 'seller@quickkart.com' });
    if (!mockSeller) {
      const sellerPassword = await bcrypt.hash('seller123', 10);
      mockSeller = new User({
        name: 'QuickKart Authorized Vendor',
        email: 'seller@quickkart.com',
        password: sellerPassword,
        phone: '+91 9876543210',
        address: 'Plot 42, Sector 18, Gurugram, Haryana, India',
        role: 'seller',
        approved: true
      });
      await mockSeller.save();
    }

    // Ensure admin exists
    let mockAdmin = await User.findOne({ email: 'admin@quickkart.com' });
    if (!mockAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      mockAdmin = new User({
        name: 'QuickKart Administrator',
        email: 'admin@quickkart.com',
        password: adminPassword,
        phone: '+91 9999988888',
        address: 'QuickKart Head Office, Bangalore, Karnataka, India',
        role: 'admin',
        approved: true
      });
      await mockAdmin.save();
    }

    // Ensure buyer exists
    let mockBuyer = await User.findOne({ email: 'buyer@quickkart.com' });
    if (!mockBuyer) {
      const buyerPassword = await bcrypt.hash('buyer123', 10);
      mockBuyer = new User({
        name: 'Rajesh Kumar',
        email: 'buyer@quickkart.com',
        password: buyerPassword,
        phone: '+91 9123456789',
        address: 'H-210, Green Park Extension, New Delhi, Delhi, 110016',
        role: 'buyer',
        approved: true
      });
      await mockBuyer.save();
    }

    // Check if we already have the new catalog seeded (60 items under the mock seller, with the new category name)
    const mockSellerProductCount = await Product.countDocuments({ seller: mockSeller._id });
    const hasNewCategory = await Product.findOne({ category: 'Kitchen Decor', seller: mockSeller._id });
    
    if (mockSellerProductCount === 60 && hasNewCategory) {
      console.log('🌱 Validated 60-product catalog is already seeded. Skipping product seeding.');
      return;
    }
    
    console.log('🌱 Rebuilding/seeding the default product catalog...');
    // Delete only the mock seller's old products to preserve other sellers' uploads
    await Product.deleteMany({ seller: mockSeller._id });
    
    const rawProducts = [
  {
    "name": "Lakme Absolute Matte Liquid Lipstick",
    "category": "Beauty",
    "price": 499,
    "originalPrice": 799,
    "brand": "Lakme",
    "discount": 37,
    "stock": 25,
    "rating": 4.52,
    "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa",
    "description": "Highly pigmented liquid matte lipstick that stays up to 16 hours. Non-drying formula keeps lips hydrated while offering an intense velvety finish."
  },
  {
    "name": "Mamaearth Ultra Light Matte Sunscreen SPF 50",
    "category": "Beauty",
    "price": 399,
    "originalPrice": 499,
    "brand": "Mamaearth",
    "discount": 20,
    "stock": 42,
    "rating": 4.35,
    "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03",
    "description": "Ultra-lightweight sunscreen with SPF 50 PA+++ protection. Infused with turmeric and saffron for a natural glow, while absorbing grease cleanly."
  },
  {
    "name": "Minimalist 10% Vitamin C Face Serum",
    "category": "Beauty",
    "price": 649,
    "originalPrice": 699,
    "brand": "Minimalist",
    "discount": 7,
    "stock": 18,
    "rating": 4.61,
    "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
    "description": "Intense radiance serum formulated with stable Vitamin C. Reduces skin dullness, fades dark spots, and improves overall skin texture."
  },
  {
    "name": "Cetaphil Daily Moisturising Skin Cream",
    "category": "Beauty",
    "price": 829,
    "originalPrice": 950,
    "brand": "Cetaphil",
    "discount": 12,
    "stock": 31,
    "rating": 4.75,
    "image": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc",
    "description": "Dermatologist-recommended daily moisturizer for sensitive and dry skin. Provides continuous 24-hour hydration without clogging pores."
  },
  {
    "name": "Colorbar Intense Waterproof Kohl Kajal",
    "category": "Beauty",
    "price": 249,
    "originalPrice": 299,
    "brand": "Colorbar",
    "discount": 16,
    "stock": 55,
    "rating": 4.18,
    "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e",
    "description": "Smudge-proof and waterproof black kohl kajal. Glides smoothly to define eyes with an intense, rich matte black finish."
  },
  {
    "name": "Titan Skinn Raw Luxury Eau De Parfum",
    "category": "Beauty",
    "price": 2399,
    "originalPrice": 2995,
    "brand": "Titan Skinn",
    "discount": 19,
    "stock": 14,
    "rating": 4.68,
    "image": "https://images.unsplash.com/photo-1541643600914-78b084683601",
    "description": "Premium masculine fragrance with top notes of citrus and base notes of woods. Long-lasting scent perfect for office wear or formal events."
  },
  {
    "name": "Allen Solly Cotton Formal Dress Shirt",
    "category": "Fashion",
    "price": 1299,
    "originalPrice": 1999,
    "brand": "Allen Solly",
    "discount": 35,
    "stock": 28,
    "rating": 4.39,
    "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
    "description": "Classic slim-fit formal shirt tailored in premium breathable cotton. Features structured collar and cuffs for a sharp corporate appearance."
  },
  {
    "name": "Roadster Men Casual Plaid Check Shirt",
    "category": "Fashion",
    "price": 849,
    "originalPrice": 1499,
    "brand": "Roadster",
    "discount": 43,
    "stock": 49,
    "rating": 4.22,
    "image": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
    "description": "Trendy checkered casual shirt crafted in lightweight cotton flannels. Perfect for layering over white t-shirts on weekend outings."
  },
  {
    "name": "Puma Solid Cotton Polo T-Shirt",
    "category": "Fashion",
    "price": 1099,
    "originalPrice": 1799,
    "brand": "Puma",
    "discount": 38,
    "stock": 36,
    "rating": 4.46,
    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
    "description": "Classic athletic fit polo shirt featuring ribbed collars, button closures, and embroidered brand logo. Ideal for smart-casual wear."
  },
  {
    "name": "Raymond Classic Single-Breasted Blazer Suit",
    "category": "Fashion",
    "price": 4999,
    "originalPrice": 6999,
    "brand": "Raymond",
    "discount": 28,
    "stock": 9,
    "rating": 4.78,
    "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35",
    "description": "Exquisite formal blazer tailored from premium wool-blend fabrics. Structured fit ideal for business meetings, weddings, and formal dinners."
  },
  {
    "name": "Nalli Kanchipuram Silk Saree with Blouse Piece",
    "category": "Fashion",
    "price": 9499,
    "originalPrice": 12999,
    "brand": "Nalli",
    "discount": 26,
    "stock": 6,
    "rating": 4.82,
    "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    "description": "Traditional Kanchipuram pure silk saree adorned with gold zari borders. Elegant drape ideal for weddings, festivals, and traditional rituals."
  },
  {
    "name": "Mohey Georgette Bridal Lehenga Choli Set",
    "category": "Fashion",
    "price": 14999,
    "originalPrice": 19999,
    "brand": "Mohey",
    "discount": 25,
    "stock": 5,
    "rating": 4.89,
    "image": "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51",
    "description": "Exquisite bridal lehenga set with intricate embroidery work. Includes a matching heavy-embroidered dupatta and blouse fabric."
  },
  {
    "name": "Sleepyhead Bae 3-Seater Fabric Sofa",
    "category": "Home Decor",
    "price": 18500,
    "originalPrice": 24999,
    "brand": "Sleepyhead",
    "discount": 26,
    "stock": 40,
    "rating": 4.69,
    "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    "description": "Plush 3-seater sofa wrapped in solid high-quality woven fabric. Termite-resistant wood structure ensures longevity."
  },
  {
    "name": "Deco Window Blackout Premium Eyelet Curtains Set",
    "category": "Home Decor",
    "price": 1500,
    "originalPrice": 1999,
    "brand": "Deco Window",
    "discount": 25,
    "stock": 41,
    "rating": 4.28,
    "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f",
    "description": "Thermal insulated room blackout curtains. Designed with metal eyelets for smooth sliding along rods."
  },
  {
    "name": "ECraftIndia Abstract Ganesha Metal Wall Art Panel",
    "category": "Home Decor",
    "price": 1300,
    "originalPrice": 1899,
    "brand": "ECraftIndia",
    "discount": 31,
    "stock": 43,
    "rating": 4.33,
    "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38",
    "description": "Intricately hand-carved Ganesha metallic wall hanger panel. Coated with anti-rust gold colors for elegance."
  },
  {
    "name": "Philips Marvel LED Decorative Table Lamp",
    "category": "Home Decor",
    "price": 1901,
    "originalPrice": 2490,
    "brand": "Philips",
    "discount": 23,
    "stock": 44,
    "rating": 4.53,
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
    "description": "Modern minimalist desk table lamp. Emits soft glare-free warm yellow light ideal for reading or bedside lighting."
  },
  {
    "name": "Home Centre Premium Beveled Wall Mirror",
    "category": "Home Decor",
    "price": 3299,
    "originalPrice": 4499,
    "brand": "Home Centre",
    "discount": 26,
    "stock": 46,
    "rating": 4.59,
    "image": "https://images.unsplash.com/photo-1618220179428-22790b461013",
    "description": "Elegant rectangular wall mirror finished with beveled edges. Can be hung horizontally or vertically."
  },
  {
    "name": "Urban Ladder Solid Wood 4-Seater Dining Table Set",
    "category": "Home Decor",
    "price": 24899,
    "originalPrice": 32999,
    "brand": "Urban Ladder",
    "discount": 24,
    "stock": 39,
    "rating": 4.79,
    "image": "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf",
    "description": "Premium dining set constructed from solid teak wood. Includes four cushioned chairs with rich upholstery."
  },
  {
    "name": "Borosil Mixing Glass Bowl Set (3 Pieces)",
    "category": "Kitchen Decor",
    "price": 700,
    "originalPrice": 899,
    "brand": "Borosil",
    "discount": 22,
    "stock": 47,
    "rating": 4.6,
    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
    "description": "Set of 3 borosilicate glass mixing bowls. Safe for microwave, oven, freezer, and dishwasher usage."
  },
  {
    "name": "Shri & Sam Designer Stainless Steel Spoon Set",
    "category": "Kitchen Decor",
    "price": 501,
    "originalPrice": 699,
    "brand": "Shri & Sam",
    "discount": 28,
    "stock": 51,
    "rating": 4.19,
    "image": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1",
    "description": "Set of 6 dessert spoons crafted in mirror-finish food-grade stainless steel. Sleek handles offer a good grip."
  },
  {
    "name": "Larah by Borosil Opalware Dinner Plates Set",
    "category": "Kitchen Decor",
    "price": 999,
    "originalPrice": 1299,
    "brand": "Larah",
    "discount": 23,
    "stock": 53,
    "rating": 4.57,
    "image": "https://images.unsplash.com/photo-1610701596007-11502861dcfa",
    "description": "Set of 6 lightweight opalware dinner plates. Bone-ash free, chip-resistant, and decorated with delicate patterns."
  },
  {
    "name": "Signoraware Airtight Plastic Storage Containers",
    "category": "Kitchen Decor",
    "price": 450,
    "originalPrice": 599,
    "brand": "Signoraware",
    "discount": 25,
    "stock": 54,
    "rating": 4.24,
    "image": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7",
    "description": "Set of 6 BPA-free modular kitchen storage jars. Air-tight lockups keep dry groceries and spices fresh."
  },
  {
    "name": "Prestige Omega Deluxe Granite Cookware Set",
    "category": "Kitchen Decor",
    "price": 2900,
    "originalPrice": 3999,
    "brand": "Prestige",
    "discount": 27,
    "stock": 56,
    "rating": 4.66,
    "image": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a",
    "description": "Set of 3 non-stick granite-coated cookware: frypan, kadai, and tawa. Compatible with induction and gas cooktops."
  },
  {
    "name": "Pigeon Stainless Steel Professional Kitchen Knives Set",
    "category": "Kitchen Decor",
    "price": 549,
    "originalPrice": 799,
    "brand": "Pigeon",
    "discount": 31,
    "stock": 57,
    "rating": 4.4,
    "image": "https://images.unsplash.com/photo-1593113598332-cd288d649433",
    "description": "Set of 3 professional kitchen knives: chef knife, utility knife, and paring knife. Heavy duty stainless blades."
  },
  {
    "name": "OnePlus 50-inch 4K Ultra HD Smart TV",
    "category": "Electronics",
    "price": 29999,
    "originalPrice": 39999,
    "brand": "OnePlus",
    "discount": 25,
    "stock": 11,
    "rating": 4.62,
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575",
    "description": "Immersive 4K smart TV equipped with Dolby Audio, Android TV operating system, bezel-less design, and built-in Chromecast features."
  },
  {
    "name": "Samsung Galaxy M34 5G Smartphone",
    "category": "Electronics",
    "price": 16499,
    "originalPrice": 19999,
    "brand": "Samsung",
    "discount": 17,
    "stock": 35,
    "rating": 4.44,
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
    "description": "Powerful 5G smartphone featuring a 120Hz Super AMOLED display, massive 6000mAh battery, and 50MP triple cameras with OIS."
  },
  {
    "name": "HP 15s Ryzen 5 Windows 11 Laptop",
    "category": "Electronics",
    "price": 38499,
    "originalPrice": 47999,
    "brand": "HP",
    "discount": 19,
    "stock": 10,
    "rating": 4.56,
    "image": "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
    "description": "Thin and light laptop equipped with AMD Ryzen 5 processor, 8GB RAM, fast 512GB SSD storage, and pre-installed Windows 11."
  },
  {
    "name": "Apple AirPods Pro (2nd Generation)",
    "category": "Electronics",
    "price": 22999,
    "originalPrice": 24990,
    "brand": "Apple",
    "discount": 8,
    "stock": 8,
    "rating": 4.88,
    "image": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689",
    "description": "Industry-leading active noise cancellation earbuds. Designed with H2 chip, adaptive audio, spatial audio, and MagSafe charging case."
  },
  {
    "name": "JBL Flip 6 Portable Bluetooth Speaker",
    "category": "Electronics",
    "price": 9999,
    "originalPrice": 11999,
    "brand": "JBL",
    "discount": 16,
    "stock": 24,
    "rating": 4.73,
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
    "description": "Powerful portable speaker delivering clear JBL Original Pro Sound. IP67 waterproof and dustproof with up to 12 hours of playtime."
  },
  {
    "name": "Sony WH-CH520 Wireless Bluetooth Headset",
    "category": "Electronics",
    "price": 4499,
    "originalPrice": 5990,
    "brand": "Sony",
    "discount": 24,
    "stock": 32,
    "rating": 4.55,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    "description": "On-ear wireless headphones featuring up to 50 hours of battery life, DSEE sound customizer, and built-in mic for clear calling."
  },
  {
    "name": "Fossil Grant Chronograph Leather Watch",
    "category": "Watches",
    "price": 9995,
    "originalPrice": 12995,
    "brand": "Fossil",
    "discount": 23,
    "stock": 15,
    "rating": 4.58,
    "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
    "description": "Premium classic design watch featuring a genuine dark brown leather strap and roman numeral dials."
  },
  {
    "name": "Daniel Wellington Classic Black Mesh Watch",
    "category": "Watches",
    "price": 14699,
    "originalPrice": 17999,
    "brand": "Daniel Wellington",
    "discount": 18,
    "stock": 20,
    "rating": 4.67,
    "image": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3",
    "description": "Ultra-slim watch crafted in double-plated stainless steel, complete with a contemporary black mesh strap."
  },
  {
    "name": "Casio G-Shock Analog-Digital Sport Watch",
    "category": "Watches",
    "price": 8195,
    "originalPrice": 9995,
    "brand": "Casio",
    "discount": 18,
    "stock": 121,
    "rating": 4.71,
    "image": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8",
    "description": "Shock-resistant multi-functional rugged watch with mineral glass, LED backlight, auto calendar, and stopwatch."
  },
  {
    "name": "Titan Regalia Premium Gold-Plated Watch",
    "category": "Watches",
    "price": 7495,
    "originalPrice": 8995,
    "brand": "Titan",
    "discount": 16,
    "stock": 12,
    "rating": 4.49,
    "image": "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0",
    "description": "Gleaming golden watch built with premium metallic link straps, scratch-resistant dial pane, and date tracker."
  },
  {
    "name": "boAt Wave Call Bluetooth Calling Smartwatch",
    "category": "Watches",
    "price": 1799,
    "originalPrice": 2999,
    "brand": "boAt",
    "discount": 40,
    "stock": 50,
    "rating": 4.27,
    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1",
    "description": "Sleek smartwatch featuring a 1.69-inch HD display, bluetooth calling, 150+ watch faces, and fitness tracking."
  },
  {
    "name": "Seiko Automatic Analogue Stainless Steel Watch",
    "category": "Watches",
    "price": 21995,
    "originalPrice": 24995,
    "brand": "Seiko",
    "discount": 12,
    "stock": 7,
    "rating": 4.85,
    "image": "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e",
    "description": "Premium mechanical timepiece featuring automatic self-winding mechanism, stainless steel chassis, and transparent case back."
  },
  {
    "name": "Eloquent JavaScript (3rd Edition)",
    "category": "Books",
    "price": 1000,
    "originalPrice": 1299,
    "brand": "O'Reilly",
    "discount": 23,
    "stock": 58,
    "rating": 4.86,
    "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f",
    "description": "Deep dive coding guide into JavaScript, covering basic programming structure, node backend, and browser integrations."
  },
  {
    "name": "Atomic Habits Self Help Bestseller",
    "category": "Books",
    "price": 400,
    "originalPrice": 599,
    "brand": "Penguin",
    "discount": 33,
    "stock": 59,
    "rating": 4.93,
    "image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6",
    "description": "Transformative book by James Clear on formatting positive atomic habits and breaking bad ones in simple day-to-day steps."
  },
  {
    "name": "Oxford Advanced Learner's Dictionary",
    "category": "Books",
    "price": 755,
    "originalPrice": 999,
    "brand": "Oxford",
    "discount": 24,
    "stock": 60,
    "rating": 4.77,
    "image": "https://images.unsplash.com/photo-1541963463532-d68292c34b19",
    "description": "Renowned academic reference dictionary compiling definitions, synonyms, grammar patterns, and usage guides."
  },
  {
    "name": "The Psychology of Money by Morgan Housel",
    "category": "Books",
    "price": 350,
    "originalPrice": 499,
    "brand": "Harriman House",
    "discount": 29,
    "stock": 65,
    "rating": 4.81,
    "image": "https://images.unsplash.com/photo-1592496431122-2349e0fbc666",
    "description": "Doing well with money isn't necessarily about what you know. It's about how you behave. Explores 19 short stories of financial logic."
  },
  {
    "name": "Introduction to Algorithms (CLRS) TextBook",
    "category": "Books",
    "price": 2501,
    "originalPrice": 2999,
    "brand": "MIT Press",
    "discount": 16,
    "stock": 122,
    "rating": 4.74,
    "image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6",
    "description": "Standard reference text for modern computer algorithms, detailing data structures, sorting algorithms, and complexity analyses."
  },
  {
    "name": "Sapiens: A Brief History of Humankind",
    "category": "Books",
    "price": 460,
    "originalPrice": 599,
    "brand": "Harvill Secker",
    "discount": 23,
    "stock": 29,
    "rating": 4.87,
    "image": "https://images.unsplash.com/photo-1476275466078-4007374efbbe",
    "description": "Dr Yuval Noah Harari spans the whole of human history, from the very first humans to walk the earth to radical breakthroughs."
  },
  {
    "name": "Tata Salt Lite Low Sodium Iodized Salt",
    "category": "Grocery",
    "price": 28,
    "originalPrice": 35,
    "brand": "Tata",
    "discount": 20,
    "stock": 110,
    "rating": 4.25,
    "image": "https://images.unsplash.com/photo-1518047601542-79f18c655718",
    "description": "Iodized low sodium table salt designed for active lifestyle needs. Promotes cardiovascular health."
  },
  {
    "name": "Aashirvaad Shudh Chakki Atta (5kg)",
    "category": "Grocery",
    "price": 260,
    "originalPrice": 320,
    "brand": "Aashirvaad",
    "discount": 18,
    "stock": 70,
    "rating": 4.63,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    "description": "100% pure stone-ground whole wheat flour. Provides rich dietary fiber and stays soft for up to 12 hours."
  },
  {
    "name": "Catch Turmeric Powder Pure Spices (200g)",
    "category": "Grocery",
    "price": 45,
    "originalPrice": 55,
    "brand": "Catch",
    "discount": 18,
    "stock": 90,
    "rating": 4.48,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5",
    "description": "Richly aromatic ground turmeric powder sourced from prime Indian farms. Free of artificial coloring."
  },
  {
    "name": "Fortune Premium Kachi Ghani Mustard Oil (1L)",
    "category": "Grocery",
    "price": 175,
    "originalPrice": 199,
    "brand": "Fortune",
    "discount": 12,
    "stock": 123,
    "rating": 4.51,
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
    "description": "Traditional cold-pressed mustard oil with a strong aromatic scent and high pungency level. Ideal for pickles."
  },
  {
    "name": "Tata Tea Premium Leaf Tea Blend (1kg)",
    "category": "Grocery",
    "price": 420,
    "originalPrice": 499,
    "brand": "Tata",
    "discount": 15,
    "stock": 124,
    "rating": 4.37,
    "image": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12",
    "description": "Excellent blend of small CTC dust leaves and large premium green leaves. Delivers rich color and bold flavor."
  },
  {
    "name": "Amul Butter Salted Spread (500g)",
    "category": "Grocery",
    "price": 275,
    "originalPrice": 299,
    "brand": "Amul",
    "discount": 8,
    "stock": 80,
    "rating": 4.76,
    "image": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d",
    "description": "The iconic salted butter spread made from pure milk fat. Perfect for toasts, baking, and rich gravies."
  },
  {
    "name": "SG English Willow Professional Cricket Bat",
    "category": "Sports",
    "price": 3499,
    "originalPrice": 4999,
    "brand": "SG",
    "discount": 30,
    "stock": 61,
    "rating": 4.72,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da",
    "description": "Professional grade English Willow cricket bat. Crafted with thick edges and light pick-up for hard-hitting power."
  },
  {
    "name": "Nivia Classic Synthetic Leather Football",
    "category": "Sports",
    "price": 600,
    "originalPrice": 899,
    "brand": "Nivia",
    "discount": 33,
    "stock": 62,
    "rating": 4.32,
    "image": "https://images.unsplash.com/photo-1518063319789-7217e6706b04",
    "description": "Water-resistant training football stitched with 32 panels. Delivers stable flight and high bounce on turf/ground."
  },
  {
    "name": "Decathlon Kore PVC Dumbbells Set (10kg)",
    "category": "Sports",
    "price": 850,
    "originalPrice": 1299,
    "brand": "Decathlon",
    "discount": 34,
    "stock": 64,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
    "description": "Home gym dumbbell weights set (2 x 5kg). Heavy PVC filled shells engineered for intensive curl and press."
  },
  {
    "name": "Yonex Muscle Power 29 Badminton Racket",
    "category": "Sports",
    "price": 2199,
    "originalPrice": 2799,
    "brand": "Yonex",
    "discount": 21,
    "stock": 125,
    "rating": 4.1,
    "image": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea",
    "description": "High-tension graphite frame badminton racket featuring muscle power architecture for powerful smash hits."
  },
  {
    "name": "Nivia Orthopedic High-Compression Knee Support",
    "category": "Sports",
    "price": 349,
    "originalPrice": 399,
    "brand": "Nivia",
    "discount": 12,
    "stock": 126,
    "rating": 4.15,
    "image": "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e",
    "description": "Breathable elastic knee compression sleeve. Protects joints during sports running, weightlifting, and cycling."
  },
  {
    "name": "Cosco Championship Hard Court Tennis Balls Set",
    "category": "Sports",
    "price": 375,
    "originalPrice": 450,
    "brand": "Cosco",
    "discount": 16,
    "stock": 75,
    "rating": 4.38,
    "image": "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0",
    "description": "Heavy-duty woolen felt tennis balls approved for championship tournaments. Outstanding durability on hard courts."
  },
  {
    "name": "Lavie Caprese Premium Saffiano Handbag",
    "category": "Accessories",
    "price": 3000,
    "originalPrice": 4499,
    "brand": "Lavie",
    "discount": 33,
    "stock": 127,
    "rating": 4.11,
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
    "description": "Faux-leather structural handbag featuring dual top handles and spacious compartments. Embellished with gold logos."
  },
  {
    "name": "Ray-Ban Classic Aviator Sunglasses",
    "category": "Accessories",
    "price": 8490,
    "originalPrice": 9990,
    "brand": "Ray-Ban",
    "discount": 15,
    "stock": 128,
    "rating": 4.65,
    "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
    "description": "The iconic original aviator sunglasses featuring premium metal frames and polarized green crystal lenses."
  },
  {
    "name": "Tommy Hilfiger Classic Leather Men Belt",
    "category": "Accessories",
    "price": 2499,
    "originalPrice": 2999,
    "brand": "Tommy Hilfiger",
    "discount": 16,
    "stock": 129,
    "rating": 4.41,
    "image": "https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e",
    "description": "Classic bi-tone men belt crafted in polished genuine cowhide leather. Equipped with heavy-duty steel buckle."
  },
  {
    "name": "Wildhorn Genuine Leather Bi-Fold Wallet",
    "category": "Accessories",
    "price": 899,
    "originalPrice": 1299,
    "brand": "Wildhorn",
    "discount": 30,
    "stock": 130,
    "rating": 4.29,
    "image": "https://images.unsplash.com/photo-1559563458-527698bf5295",
    "description": "Sleek bifold leather wallet featuring 8 card slots, 2 currency compartments, and a secure coin pocket."
  },
  {
    "name": "Puma Unisex Prime Utility Backpack",
    "category": "Accessories",
    "price": 1999,
    "originalPrice": 2799,
    "brand": "Puma",
    "discount": 28,
    "stock": 22,
    "rating": 4.47,
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    "description": "Heavy-duty outdoor utility backpack featuring padded laptop slot, compression straps, and water-bottle mesh."
  },
  {
    "name": "Skybags Polyester Cabin Trolley Suitcase",
    "category": "Accessories",
    "price": 4199,
    "originalPrice": 5499,
    "brand": "Skybags",
    "discount": 23,
    "stock": 131,
    "rating": 4.12,
    "image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87",
    "description": "Ultra-lightweight cabin size trolley bag. 360 spinner wheels ensure smooth airport terminals navigation."
  }
];

    const seededProducts = rawProducts.map((prod, index) => {
      const mainImage = prod.image;
      return {
        ...prod,
        seller: mockSeller._id,
        sellerName: mockSeller.name,
        images: [
          mainImage,
          `${mainImage}?q=80&w=400&auto=format&fit=crop&sig=${index + 1000}`
        ],
        reviews: [
          { username: 'Rohan Sharma', rating: 5, comment: 'Excellent product! Very happy with the quality.', date: new Date() },
          { username: 'Divya Patel', rating: 4, comment: 'Good value for money. Built well and fits standard requirements.', date: new Date() }
        ]
      };
    });

    await Product.insertMany(seededProducts);
    console.log(`✅ Database successfully seeded with exactly ${seededProducts.length} unique validated products!`);

    // Clean up carts & wishlists by removing any product IDs that no longer exist in the database
    const allProducts = await Product.find({}, '_id');
    const allProductIds = allProducts.map(p => p._id.toString());
    
    const carts = await Cart.find({});
    for (const cart of carts) {
      const originalLen = cart.items.length;
      cart.items = cart.items.filter(item => item.productId && allProductIds.includes(item.productId.toString()));
      if (cart.items.length !== originalLen) {
        await cart.save();
      }
    }

    const wishlists = await Wishlist.find({});
    for (const wishlist of wishlists) {
      const originalLen = wishlist.products.length;
      wishlist.products = wishlist.products.filter(id => id && allProductIds.includes(id.toString()));
      if (wishlist.products.length !== originalLen) {
        await wishlist.save();
      }
    }
    console.log('🧹 Cleaned up non-existent product references from carts and wishlists.');
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
  }
}

module.exports = connectDB;
