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
  const catMap = {};
  for (const cat of cats) {
    catMap[cat._id.toString()] = {slug: cat.slug, name: cat.name, published: cat.published};
  }
  const prods = await db.collection('products').find({}).sort({name:1}).toArray();
  for (const p of prods) {
    const cinfo = catMap[p.category?.toString()] || {slug:'MISSING', name:'MISSING'};
    console.log(p.slug + ' | ' + p.name + ' | ' + cinfo.slug + ' (' + cinfo.name + ') | pub:' + p.published);
  }
  console.log('\nTOTAL:', prods.length);
  await c.close();
})();
