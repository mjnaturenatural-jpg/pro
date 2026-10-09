import { connectDB } from "../src/lib/db";
import { User, Category, Product, SiteSettings, HomepageContent, Coupon } from "../src/models";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

// Use a static image from public/ when it exists, otherwise null.
function staticFile(publicPath: string): string | null {
  const file = path.join(process.cwd(), "public", publicPath);
  return fs.existsSync(file) ? publicPath : null;
}

const categories = [
  { name: "Laddus", slug: "laddus", description: "Wholesome laddus made with thoughtfully selected ingredients.", order: 1 },
  { name: "Brownies", slug: "brownies", description: "Rich, fudgy brownies for everyday indulgence.", order: 2 },
  { name: "Cookies", slug: "cookies", description: "Crisp and chewy cookies baked with care.", order: 3 },
  { name: "Millet Cookies", slug: "millet-cookies", description: "Cookies made with millet flours and jaggery.", order: 4 },
  { name: "Jaggery Products", slug: "jaggery-products", description: "Products sweetened naturally with jaggery.", order: 5 },
  { name: "Chikki", slug: "chikki", description: "Traditional nut and seed brittles made with jaggery.", order: 6 },
  { name: "Mixtures", slug: "mixtures", description: "Spicy roasted mixtures and savoury snacks.", order: 7 },
  { name: "Pantry Staples", slug: "pantry-staples", description: "Everyday kitchen essentials — powders, oils and dried goods.", order: 8 },
];

interface Pack {
  label: string;
  mrp: number;
  price: number;
  stock: number;
  sku: string;
}

function packs(rows: [string, number, number][], prefix: string): Pack[] {
  return rows.map(([label, mrp, price], i) => ({
    label,
    mrp,
    price,
    stock: 20,
    sku: `${prefix}-${label.replace(/\s/g, "").toUpperCase()}`,
  }));
}

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  allergenInfo?: string;
  badges: { pureGhee: boolean; noMaida: boolean; noAddedSugar: boolean };
  featured: boolean;
  packs: Pack[];
};

const products: SeedProduct[] = [
  {
    name: "Roasted Coconut Dry Fruit Jaggery Laddu",
    slug: "roasted-coconut-dry-fruit-jaggery-laddu",
    category: "laddus",
    shortDescription: "Roasted coconut and dry fruits bound with jaggery for a naturally sweet treat.",
    description:
      "A traditional-style laddu made with roasted coconut, assorted dry fruits and jaggery. Enjoy as an everyday treat or share with family.",
    ingredients: "Roasted coconut, dry fruits, jaggery, ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: true,
    packs: packs([["250g", 399, 299.25], ["500g", 798, 598.5], ["1kg", 1596, 1197]], "RCDL"),
  },
  {
    name: "Roasted Coconut Jaggery Laddu",
    slug: "roasted-coconut-jaggery-laddu",
    category: "laddus",
    shortDescription: "Simple roasted coconut laddus sweetened with jaggery.",
    description:
      "Roasted coconut flakes combined with jaggery to create a soft, naturally sweet laddu that feels familiar and comforting.",
    ingredients: "Roasted coconut, jaggery, ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: false,
    packs: packs([["250g", 349, 279.2], ["500g", 698, 558.4], ["1kg", 1396, 1116.8]], "RCJL"),
  },
  {
    name: "White Chocolate Black Chocolate Brownie",
    slug: "white-chocolate-black-chocolate-brownie",
    category: "brownies",
    shortDescription: "A duo of white and black chocolate in one indulgent brownie.",
    description:
      "Layers of white and dark chocolate baked into a rich brownie for a deeply satisfying chocolate experience.",
    ingredients: "Chocolate, butter, sugar, flour, eggs, cocoa.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: true,
    packs: packs([["250g", 559, 436], ["500g", 1118, 872], ["750g", 1677, 1308], ["1kg", 2236, 1744]], "WBBB"),
  },
  {
    name: "Ragi & Jaggery Dry Fruits Brownie",
    slug: "ragi-jaggery-dry-fruits-brownie",
    category: "brownies",
    shortDescription: "Ragi-based brownie sweetened with jaggery and loaded with dry fruits.",
    description:
      "A millet-forward brownie made with ragi flour, jaggery and a generous helping of dry fruits.",
    ingredients: "Ragi flour, jaggery, dry fruits, butter, cocoa.",
    badges: { pureGhee: false, noMaida: true, noAddedSugar: true },
    featured: true,
    packs: packs([["250g", 599, 479], ["500g", 1198, 958], ["750g", 1797, 1438], ["1kg", 2396, 1917]], "RJDB"),
  },
  {
    name: "Jowar Chocolate Dry Fruits Brownie",
    slug: "jowar-chocolate-dry-fruits-brownie",
    category: "brownies",
    shortDescription: "Jowar flour brownie with chocolate and dry fruits.",
    description:
      "A chocolate brownie made with jowar flour and dry fruits — a modern twist on a classic favourite.",
    ingredients: "Jowar flour, chocolate, dry fruits, butter, sugar.",
    badges: { pureGhee: false, noMaida: true, noAddedSugar: false },
    featured: false,
    packs: packs([["250g", 599, 479], ["500g", 1198, 958], ["750g", 1797, 1438], ["1kg", 2396, 1917]], "JCDB"),
  },
  {
    name: "Double Choco Chip Brownie",
    slug: "double-choco-chip-brownie",
    category: "brownies",
    shortDescription: "Fudgy brownie loaded with double chocolate chips.",
    description:
      "A rich, fudgy brownie packed with chocolate chips for chocolate lovers who want every bite to count.",
    ingredients: "Chocolate, chocolate chips, butter, sugar, flour, cocoa, eggs.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: true,
    packs: packs([["250g", 549, 428], ["500g", 1098, 856], ["750g", 1647, 1285], ["1kg", 2196, 1713]], "DCCB"),
  },
  {
    name: "Red Velvet Chocolate Cookies",
    slug: "red-velvet-chocolate-cookies",
    category: "cookies",
    shortDescription: "Soft red velvet cookies with chocolatey goodness.",
    description:
      "Classic red velvet flavour in a soft-baked cookie, finished with a chocolatey touch.",
    ingredients: "Flour, sugar, butter, cocoa, red velvet flavour, chocolate.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250g", 499, 349], ["500g", 998, 699], ["750g", 1497, 1048], ["1kg", 1996, 1397]], "RVCC"),
  },
  {
    name: "Dry Fruits Mix Jaggery Cookies",
    slug: "dry-fruits-mix-jaggery-cookies",
    category: "cookies",
    shortDescription: "Crunchy cookies with a mix of dry fruits, sweetened with jaggery.",
    description:
      "A crunchy cookie packed with a mix of dry fruits and sweetened naturally with jaggery.",
    ingredients: "Flour, dry fruits mix, jaggery, butter, ghee.",
    badges: { pureGhee: true, noMaida: false, noAddedSugar: true },
    featured: true,
    packs: packs([["250g", 549, 412], ["500g", 1098, 824], ["750g", 1647, 1235], ["1kg", 2196, 1647]], "DFMJ"),
  },
  {
    name: "Oats Jaggery Dry Fruit Cookies",
    slug: "oats-jaggery-dry-fruit-cookies",
    category: "cookies",
    shortDescription: "Oats-based cookies with dry fruits and jaggery.",
    description:
      "Hearty oats cookies with dry fruits, sweetened with jaggery for a comforting everyday biscuit.",
    ingredients: "Oats, flour, dry fruits, jaggery, butter.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: true },
    featured: false,
    packs: packs([["250g", 599, 449], ["500g", 1198, 899], ["750g", 1797, 1348], ["1kg", 2396, 1797]], "OJDC"),
  },
  {
    name: "Bajra Jaggery Cookies",
    slug: "bajra-jaggery-cookies",
    category: "millet-cookies",
    shortDescription: "Bajra flour cookies sweetened with jaggery.",
    description:
      "Traditional bajra flour cookies sweetened with jaggery — crisp, earthy and satisfying.",
    ingredients: "Bajra flour, jaggery, butter/ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: false,
    packs: packs([["250g", 520, 390], ["500g", 1040, 780], ["750g", 1560, 1170], ["1kg", 2080, 1560]], "BJC"),
  },
  {
    name: "Ragi Elaichi Dry Fruit Jaggery Cookies",
    slug: "ragi-elaichi-dry-fruit-jaggery-cookies",
    category: "millet-cookies",
    shortDescription: "Ragi cookies with elaichi, dry fruits and jaggery.",
    description:
      "Aromatic elaichi-infused ragi cookies with dry fruits and jaggery for a fragrant, naturally sweet bite.",
    ingredients: "Ragi flour, dry fruits, elaichi, jaggery, ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: true,
    packs: packs([["250g", 599, 479], ["500g", 1198, 958], ["750g", 1797, 1438], ["1kg", 2396, 1917]], "REJ"),
  },
  {
    name: "Jowar Jaggery Cookies",
    slug: "jowar-jaggery-cookies",
    category: "millet-cookies",
    shortDescription: "Light and crisp jowar cookies with jaggery.",
    description:
      "Light, crisp cookies made with jowar flour and jaggery — a simple everyday treat.",
    ingredients: "Jowar flour, jaggery, butter/ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: false,
    packs: packs([["250g", 499, 374], ["500g", 998, 749], ["750g", 1497, 1123], ["1kg", 1996, 1497]], "JJC"),
  },
  {
    name: "Jowar Chocolate Almond Cookies",
    slug: "jowar-chocolate-almond-cookies",
    category: "millet-cookies",
    shortDescription: "Jowar cookies with chocolate and almonds.",
    description:
      "A chocolatey twist on jowar cookies, finished with sliced almonds for extra crunch.",
    ingredients: "Jowar flour, chocolate, almonds, sugar/butter.",
    badges: { pureGhee: false, noMaida: true, noAddedSugar: false },
    featured: false,
    packs: packs([["250g", 499, 399], ["500g", 998, 798], ["750g", 1497, 1198], ["1kg", 1996, 1597]], "JCA"),
  },
  {
    name: "Millet Jaggery Cookies",
    slug: "millet-jaggery-cookies",
    category: "millet-cookies",
    shortDescription: "A wholesome millet cookie sweetened with jaggery.",
    description:
      "A blend of millet flours and jaggery, baked into a crisp cookie that works for any time of day.",
    ingredients: "Millet flour blend, jaggery, butter/ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: true,
    packs: packs([["250g", 499, 399], ["500g", 998, 798], ["750g", 1497, 1198], ["1kg", 1996, 1597]], "MJC"),
  },
  {
    name: "Ragi Millet Jaggery Mini Chocolate Cookies",
    slug: "ragi-millet-jaggery-mini-chocolate-cookies",
    category: "millet-cookies",
    shortDescription: "Mini chocolate cookies made with ragi, millet and jaggery.",
    description:
      "Bite-sized chocolate cookies made with ragi and millet flours, sweetened with jaggery.",
    ingredients: "Ragi flour, millet flour, chocolate, jaggery, ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: false,
    packs: packs([["250g", 599, 389], ["500g", 1198, 779], ["750g", 1797, 1168], ["1kg", 2396, 1557]], "RMMC"),
  },
  {
    name: "Ragi Millet Jaggery Chocolate Cookies",
    slug: "ragi-millet-jaggery-chocolate-cookies",
    category: "millet-cookies",
    shortDescription: "Chocolate cookies made with ragi, millet and jaggery.",
    description:
      "Full-sized chocolate cookies made with ragi and millet flours, naturally sweetened with jaggery.",
    ingredients: "Ragi flour, millet flour, chocolate, jaggery, ghee.",
    badges: { pureGhee: true, noMaida: true, noAddedSugar: true },
    featured: true,
    packs: packs([["250g", 499, 349], ["500g", 998, 699], ["750g", 1497, 1049], ["1kg", 1996, 1397]], "RMJC"),
  },

  // ── Chikki ──
  {
    name: "Kaju Jaggery Chikki",
    slug: "kaju-jaggery-chikki",
    category: "chikki",
    shortDescription: "Cashew brittle made with jaggery and generous pieces of kaju.",
    description:
      "Classic kaju chikki made the traditional way — roasted cashews set in slow-cooked jaggery. A crisp, naturally sweet bite.",
    ingredients: "Cashews, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 499, 389.22], ["500 g", 998, 778.44], ["750 g", 1497, 1167.66], ["1 kg", 1996, 1556.88]], "KJC"),
  },
  {
    name: "Peanuts & Pistachio Jaggery Chikki",
    slug: "peanuts-pistachio-jaggery-chikki",
    category: "chikki",
    shortDescription: "Peanuts and pistachios bound in jaggery for a crunchy classic.",
    description:
      "Roasted peanuts and pistachios set in jaggery — crunchy, nutty and perfectly balanced.",
    ingredients: "Peanuts, pistachios, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 599, 479.2], ["500 g", 1198, 958.4], ["750 g", 1797, 1437.6], ["1 kg", 2396, 1916.8]], "PPJC"),
  },
  {
    name: "Black Sesame & Almond Chikki",
    slug: "black-sesame-almond-chikki",
    category: "chikki",
    shortDescription: "Black sesame and almonds set in jaggery.",
    description:
      "Toasted black sesame seeds and sliced almonds held together with jaggery for a nutty, earthy brittle.",
    ingredients: "Black sesame, almonds, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 499, 399.2], ["500 g", 998, 798.4], ["750 g", 1497, 1197.6], ["1 kg", 1996, 1596.8]], "BSAC"),
  },
  {
    name: "Black Sesame & Kaju Chikki",
    slug: "black-sesame-kaju-chikki",
    category: "chikki",
    shortDescription: "Black sesame and cashews in a crisp jaggery brittle.",
    description:
      "A twist on the classic — black sesame paired with roasted cashews, set in jaggery.",
    ingredients: "Black sesame, cashews, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 499, 399.2], ["500 g", 998, 798.4], ["750 g", 1497, 1197.6], ["1 kg", 1996, 1596.8]], "BSKC"),
  },
  {
    name: "White Sesame, Pistachio & Almond Chikki",
    slug: "white-sesame-pistachio-almond-chikki",
    category: "chikki",
    shortDescription: "White sesame with pistachios and almonds in jaggery.",
    description:
      "White sesame seeds loaded with pistachios and almonds, set in jaggery for a rich, crunchy chikki.",
    ingredients: "White sesame, pistachios, almonds, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 549, 439.2], ["500 g", 1098, 878.4], ["750 g", 1647, 1317.6], ["1 kg", 2196, 1756.8]], "WSPA"),
  },
  {
    name: "Flax Seeds Jaggery Almond Chikki",
    slug: "flax-seeds-jaggery-almond-chikki",
    category: "chikki",
    shortDescription: "Flax seeds and almonds bound with jaggery.",
    description:
      "A hearty brittle of flax seeds and almonds held together with jaggery — crisp and lightly sweet.",
    ingredients: "Flax seeds, almonds, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 399, 319.2], ["500 g", 798, 638.4], ["750 g", 1197, 957.6], ["1 kg", 1596, 1276.8]], "FSJA"),
  },
  {
    name: "Dry Fruit Pumpkin Seeds, Badam & Kaju",
    slug: "dry-fruit-pumpkin-seeds-badam-kaju",
    category: "chikki",
    shortDescription: "Pumpkin seeds, badam and kaju in a dry fruit brittle.",
    description:
      "Pumpkin seeds, almonds and cashews combined in a dry fruit brittle for a nutty, crunchy treat.",
    ingredients: "Pumpkin seeds, almonds, cashews, jaggery, dry fruits.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 599, 449.25], ["500 g", 1198, 898.5], ["750 g", 1797, 1347.75], ["1 kg", 2396, 1797]], "DPPK"),
  },
  {
    name: "Poha Dry Fruit Chikki",
    slug: "poha-dry-fruit-chikki",
    category: "chikki",
    shortDescription: "Crispy poha with dry fruits in a jaggery brittle.",
    description:
      "Flattened rice (poha) and dry fruits set in jaggery for a light, crispy chikki.",
    ingredients: "Poha (flattened rice), dry fruits, jaggery.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 399, 279.3], ["500 g", 798, 558.6], ["750 g", 1197, 837.9], ["1 kg", 1596, 1117.2]], "PDCF"),
  },

  // ── Mixtures ──
  {
    name: "Dry Fruit Mixture (Spicy)",
    slug: "dry-fruit-mixture-spicy",
    category: "mixtures",
    shortDescription: "A spicy mix of roasted dry fruits and nuts.",
    description:
      "Roasted dry fruits and nuts tossed in a light spice blend — a savoury snack with a gentle kick.",
    ingredients: "Mixed dry fruits, nuts, spices, salt.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 599, 479.2], ["500 g", 1198, 958.4], ["750 g", 1797, 1437.6], ["1 kg", 2396, 1916.8]], "DFMS"),
  },
  {
    name: "Poha, Coconut & Dry Fruit Mixture (Spicy)",
    slug: "poha-coconut-dry-fruit-mixture-spicy",
    category: "mixtures",
    shortDescription: "Crispy poha with coconut and dry fruits in a spicy mix.",
    description:
      "Crunchy poha, coconut and dry fruits roasted together with spices for a flavourful savoury mixture.",
    ingredients: "Poha, coconut, dry fruits, spices, salt.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 399, 279.3], ["500 g", 798, 558.6], ["750 g", 1197, 837.9], ["1 kg", 1596, 1117.2]], "PCDM"),
  },

  // ── Pantry Staples ──
  {
    name: "Coconut Powder",
    slug: "coconut-powder",
    category: "pantry-staples",
    shortDescription: "Finely milled coconut powder for cooking and baking.",
    description:
      "Fine coconut powder for curries, sweets, baking and everyday cooking.",
    ingredients: "Coconut.",
    allergenInfo: "Contains coconut. Made in a facility that also handles other allergens.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 299, 239.2], ["500 g", 598, 478.4], ["750 g", 897, 717.6], ["1 kg", 1196, 956.8]], "COPW"),
  },
  {
    name: "Red Chilli Powder with Masala",
    slug: "red-chilli-powder-with-masala",
    category: "pantry-staples",
    shortDescription: "Vibrant red chilli powder blended with masala spices.",
    description:
      "Red chilli powder blended with a measured mix of masala spices for colour, heat and depth.",
    ingredients: "Red chilli, masala spices.",
    allergenInfo: "Made in a facility that also handles nuts, milk and other allergens.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["500 g", 399, 339.15], ["1 kg", 798, 678.3]], "RCPM"),
  },
  {
    name: "Dry Amla",
    slug: "dry-amla",
    category: "pantry-staples",
    shortDescription: "Sun-dried amla pieces, simply prepared.",
    description:
      "Dried amla (Indian gooseberry) pieces, prepared simply without any added flavouring.",
    ingredients: "Amla (Indian gooseberry).",
    allergenInfo: "Made in a facility that also handles nuts, milk and other allergens.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["250 g", 299, 224.25], ["500 g", 598, 448.5], ["750 g", 897, 672.75], ["1 kg", 1196, 897]], "DRAM"),
  },
  {
    name: "Coconut Oil",
    slug: "coconut-oil",
    category: "pantry-staples",
    shortDescription: "Coconut oil for everyday cooking.",
    description:
      "Versatile coconut oil for cooking, baking and everyday kitchen use.",
    ingredients: "Coconut.",
    allergenInfo: "Contains coconut. Made in a facility that also handles other allergens.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["500 ml", 300, 300], ["1 L", 600, 600]], "COWL"),
  },

  // ── Jaggery Products ──
  {
    name: "Original Jaggery",
    slug: "original-jaggery",
    category: "jaggery-products",
    shortDescription: "Traditional jaggery in its simplest form.",
    description:
      "Plain, traditional jaggery for sweets, beverages and everyday cooking.",
    ingredients: "Jaggery.",
    allergenInfo: "Made in a facility that also handles nuts, milk and other allergens.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["1 kg", 139, 139]], "ORJG"),
  },
  {
    name: "Elaichi, Black Pepper & Dry Ginger Jaggery",
    slug: "elaichi-black-pepper-dry-ginger-jaggery",
    category: "jaggery-products",
    shortDescription: "Jaggery infused with elaichi, black pepper and dry ginger.",
    description:
      "Jaggery infused with elaichi, black pepper and dry ginger for a warm, spiced bite.",
    ingredients: "Jaggery, elaichi, black pepper, dry ginger.",
    allergenInfo: "Made in a facility that also handles nuts, milk and other allergens.",
    badges: { pureGhee: false, noMaida: false, noAddedSugar: false },
    featured: false,
    packs: packs([["500 g", 150, 150]], "EBDJ"),
  },
];

// Placeholder product images using a neutral gradient-free light style via placehold.co-like inline SVG data URIs
// Replace with Cloudinary URLs from the admin panel.
function placeholderImage(name: string): string {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="#EBF2E3"/><circle cx="400" cy="360" r="140" fill="#DCE7D0"/><text x="400" y="385" font-family="Georgia,serif" font-size="72" fill="#35863A" text-anchor="middle" font-weight="600">${initials}</text><text x="400" y="560" font-family="Georgia,serif" font-size="28" fill="#435145" text-anchor="middle">MJ Nature Naturals</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB");

  // Admin
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@mjnaturals.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  const hashed = await bcrypt.hash(adminPassword, 12);
  await User.findOneAndUpdate(
    { email: adminEmail },
    { name: "Admin", email: adminEmail, password: hashed, role: "ADMIN" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin ready: ${adminEmail}`);

  // Categories
  const catMap = new Map<string, string>();
  for (const c of categories) {
    const catImage = staticFile(`/images/categories/${c.slug}.jpg`);
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: { ...c, published: true },
        $setOnInsert: catImage ? { image: catImage } : {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    catMap.set(c.slug, doc._id.toString());
  }
  console.log(`Categories ready: ${catMap.size}`);

  // Products — images only set on insert so generated/uploaded images survive re-seeds
  for (const p of products) {
    const categoryId = catMap.get(p.category);
    if (!categoryId) continue;
    const staticImg = staticFile(`/images/products/${p.slug}.jpg`);
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription,
          description: p.description,
          ingredients: p.ingredients,
          allergenInfo: p.allergenInfo ?? "Contains nuts and dairy. Made in a facility that also handles other allergens.",
          storageInstructions: "Store in an airtight container in a cool, dry place. Consume within the recommended period.",
          howToUse: "",
          shippingInfo: "Shipped in secure, food-safe packaging. Delivery timelines shown at checkout.",
          returnInfo: "Perishable food items. Please refer to our refund policy for details.",
          category: categoryId,
          packSizes: p.packs,
          badges: p.badges,
          featured: p.featured,
          published: true,
          keywords: [p.category, ...p.name.toLowerCase().split(" ")],
        },
        $setOnInsert: {
          images: [staticImg ?? placeholderImage(p.name)],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Products ready: ${products.length}`);

  // Site settings
  await SiteSettings.findOneAndUpdate(
    { key: "site" },
    {
      brandName: "MJ Nature Naturals",
      announcementEnabled: true,
      announcementText: "",
      freeShippingThreshold: 999,
      flatShipping: 79,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // Homepage content
  await HomepageContent.findOneAndUpdate(
    { key: "homepage" },
    { $setOnInsert: {} },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
