const dns = require('dns');
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
} catch(e){}
dns.setServers(['1.1.1.1','8.8.8.8']);
(async()=>{
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();
  
  // Ensure 8 categories exist
  const cats = [
    {name:'Cookies', slug:'cookies', order:1},
    {name:'Chikkis', slug:'chikkis', order:2},
    {name:'Brownies', slug:'brownies', order:3},
    {name:'Laddus', slug:'laddus', order:4},
    {name:'Dry Fruits & Healthy Snacks', slug:'dry-fruits-healthy-snacks', order:5},
    {name:'Jaggery & Natural Sweeteners', slug:'jaggery-natural-sweeteners', order:6},
    {name:'Oils & Coconut Products', slug:'oils-coconut-products', order:7},
    {name:'Spices & Masalas', slug:'spices-masalas', order:8},
  ];
  
  const catMap = {};
  for (const cat of cats) {
    let existing = await db.collection('categories').findOne({slug: cat.slug});
    if (!existing) {
      const res = await db.collection('categories').insertOne({...cat, published:true, description:'', image:''});
      catMap[cat.slug] = res.insertedId;
    } else {
      await db.collection('categories').updateOne({_id: existing._id}, {$set:{name:cat.name, published:true, order:cat.order}});
      catMap[cat.slug] = existing._id;
    }
  }
  
  // Assign products
  const assignments = [
    // Cookies
    ['bajra-jaggery-cookies','cookies'],
    ['dry-fruits-mix-jaggery-cookies','cookies'],
    ['jowar-chocolate-almond-cookies','cookies'],
    ['jowar-jaggery-cookies','cookies'],
    ['millet-jaggery-cookies','cookies'],
    ['oats-jaggery-dry-fruit-cookies','cookies'],
    ['ragi-elaichi-dry-fruit-jaggery-cookies','cookies'],
    ['ragi-millet-jaggery-chocolate-cookies','cookies'],
    ['ragi-millet-jaggery-mini-chocolate-cookies','cookies'],
    ['red-velvet-chocolate-cookies','cookies'],
    // Chikkis
    ['black-sesame-almond-chikki','chikkis'],
    ['black-sesame-kaju-chikki','chikkis'],
    ['flax-seeds-jaggery-almond-chikki','chikkis'],
    ['kaju-jaggery-chikki','chikkis'],
    ['peanuts-pistachio-jaggery-chikki','chikkis'],
    ['poha-dry-fruit-chikki','chikkis'],
    ['white-sesame-pistachio-almond-chikki','chikkis'],
    // Brownies
    ['double-choco-chip-brownie','brownies'],
    ['jowar-chocolate-dry-fruits-brownie','brownies'],
    ['ragi-jaggery-dry-fruits-brownie','brownies'],
    ['white-chocolate-black-chocolate-brownie','brownies'],
    // Laddus
    ['roasted-coconut-dry-fruit-jaggery-laddu','laddus'],
    ['roasted-coconut-jaggery-laddu','laddus'],
    // Dry Fruits & Healthy Snacks
    ['dry-amla','dry-fruits-healthy-snacks'],
    ['dry-fruit-mixture-spicy','dry-fruits-healthy-snacks'],
    ['dry-fruit-pumpkin-seeds-badam-kaju','dry-fruits-healthy-snacks'],
    ['poha-coconut-dry-fruit-mixture','dry-fruits-healthy-snacks'],
    // Jaggery & Natural Sweeteners
    ['elaichi-black-pepper-dry-ginger-jaggery','jaggery-natural-sweeteners'],
    ['original-jaggery','jaggery-natural-sweeteners'],
    // Oils & Coconut Products
    ['coconut-oil','oils-coconut-products'],
    ['coconut-powder','oils-coconut-products'],
    // Spices & Masalas
    ['red-chilli-powder-with-masala','spices-masalas'],
  ];
  
  for (const [slug, catSlug] of assignments) {
    await db.collection('products').updateOne({slug}, {$set:{category: catMap[catSlug]}});
  }
  
  // Unpublish others
  const keep = Object.values(catMap);
  await db.collection('categories').updateMany({_id: {$nin: keep}}, {$set:{published:false}});
  
  console.log('done');
  await c.close();
})();
