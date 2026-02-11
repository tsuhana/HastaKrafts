const db = require("../models");

const categories = [
  { name: "Metal Craft (Statue & Utensil)", slug: "metal-craft", icon: "🗿" },
  { name: "Pashmina Products", slug: "pashmina", icon: "🧣" },
  { name: "Paubha (Thangka)", slug: "paubha-thangka", icon: "🖼️" },
  { name: "Silver & Gold Jewelry", slug: "jewelry", icon: "💍" },
  { name: "Stone Carving", slug: "stone-carving", icon: "🪨" },
  { name: "Wood Craft", slug: "wood-craft", icon: "🪵" },
  { name: "Bags & Accessories", slug: "bags-accessories", icon: "👜" },
  { name: "Basketry Products", slug: "basketry", icon: "🧺" },
  { name: "Filigree Products", slug: "filigree", icon: "✨" },
  { name: "Handmade Paper Products", slug: "handmade-paper", icon: "📄" },
  { name: "Handloom Products", slug: "handloom", icon: "🧵" },
  { name: "Ceramics & Decorative Items", slug: "ceramics", icon: "🏺" },
  { name: "Leather Products", slug: "leather", icon: "👢" },
  { name: "Horn & Bone Products", slug: "horn-bone", icon: "🦴" },
  { name: "Macramé (Knot Crafts)", slug: "macrame", icon: "🪢" },
  { name: "Religious Goods", slug: "religious-goods", icon: "🕉️" },
  { name: "Fancy Hats", slug: "fancy-hats", icon: "🎩" },
  { name: "Ethnic Dolls", slug: "ethnic-dolls", icon: "🪆" },
  { name: "Painting & Giftware", slug: "painting-giftware", icon: "🎨" },
  { name: "Ethnic Costumes", slug: "ethnic-costumes", icon: "👘" },
  { name: "Hand Knitwear", slug: "hand-knitwear", icon: "🧶" },
  { name: "Incense Products", slug: "incense", icon: "🪔" },
  { name: "Natural Buttons", slug: "natural-buttons", icon: "🔘" },
  { name: "Natural Fiber Products", slug: "natural-fiber", icon: "🌾" },
  { name: "Puzzles & Toys", slug: "puzzles-toys", icon: "🧩" },
  { name: "Bamboo Products", slug: "bamboo", icon: "🎋" },
  { name: "Clay Products", slug: "clay-products", icon: "🏺" },
  { name: "Felt Products", slug: "felt-products", icon: "🧸" },
  { name: "Dhaka Fabric", slug: "dhaka-fabric", icon: "🧵" },
  { name: "Lokta Paper Products", slug: "lokta-paper", icon: "📜" },
  { name: "Singing Bowls", slug: "singing-bowls", icon: "🔔" },
  { name: "Prayer Wheels", slug: "prayer-wheels", icon: "☸️" },
  { name: "Kukri & Khukuri", slug: "kukri-khukuri", icon: "🗡️" },
  { name: "Nettle Products", slug: "nettle-products", icon: "🌿" },
  { name: "Allo Products", slug: "allo-products", icon: "🧵" },
  { name: "Hemp Products", slug: "hemp-products", icon: "🌱" },
  { name: "Beads & Ornaments", slug: "beads-ornaments", icon: "📿" },
  { name: "Tea & Coffee Crafts", slug: "tea-coffee-crafts", icon: "☕" },
  { name: "Herbal & Ayurvedic", slug: "herbal-ayurvedic", icon: "🌿" },
  { name: "Masks & Wall Hangings", slug: "masks-wall-hangings", icon: "🎭" },
  { name: "Musical Instruments", slug: "musical-instruments", icon: "🎸" },
  { name: "Home Decor", slug: "home-decor", icon: "🏠" },
];

const seedCategories = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected");

    const existingCategories = await db.Category.count();
    
    if (existingCategories > 0) {
      console.log("Categories already seeded. Skipping...");
      return;
    }

    await db.Category.bulkCreate(categories);
    console.log("42 categories seeded successfully");
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
};

module.exports = seedCategories;