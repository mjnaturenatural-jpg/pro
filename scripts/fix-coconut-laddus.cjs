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
  
  // Get laddus category
  const laddusCat = await db.collection('categories').findOne({slug: 'laddus'});
  if (!laddusCat) {
    console.log('laddus not found');
    await c.close();
    return;
  }
  console.log('laddus:', laddusCat._id.toString());
  
  // Rename products
  await db.collection('products').updateOne(
    { slug: 'roasted-coconut-dry-fruit-jaggery-laddu' },
    { $set: { name: 'Dry Fruit Coconut Laddu', category: laddusCat._id, published: true } }
  );
  await db.collection('products').updateOne(
    { slug: 'roasted-coconut-jaggery-laddu' },
    { $set: { name: 'Roasted Coconut Jaggery Laddu', category: laddusCat._id, published: true } }
  );
  
  const prods = await db.collection('products').find({$or:[{name:/Dry Fruit Coconut Laddu/i},{name:/Roasted Coconut Jaggery Laddu/i}]}).toArray();
  for (const p of prods) {
    console.log(p.slug, p.name, p.category?.toString(), p.published);
  }
  
  await c.close();
})();
