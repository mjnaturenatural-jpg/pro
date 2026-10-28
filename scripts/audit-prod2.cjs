const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
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
  const prods = await db.collection('products').find({}).toArray();
  const catMap = new Map(cats.map(c=>[c._id.toString(), c]));
  for (const p of prods) {
    const cat = p.category ? catMap.get(p.category.toString()) : null;
    console.log(p.name + ' | cat:' + (cat ? cat.name + '(' + cat.slug + ')' : 'NONE') + ' | pub:' + p.published);
  }
  await c.close();
})();
