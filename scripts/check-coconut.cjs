const dns = require('dns');
const { MongoClient } = require('mongodb');
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
  const cats = await db.collection('categories').find({}).toArray();
  console.log('===CATS===');
  for (const cat of cats) {
    console.log(cat._id.toString(), cat.slug, cat.name, cat.published);
  }
  const prods = await db.collection('products').find({$or:[{name: /coconut.*laddu/i}, {name: /laddu.*coconut/i}]}).toArray();
  console.log('\n===COCONUT LADDUS===');
  for (const p of prods) {
    console.log(p._id.toString(), p.slug, p.name, 'cat:', p.category?.toString(), 'pub:', p.published);
  }
  await c.close();
})();
