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
  const dry = await db.collection('categories').findOne({slug:'dry-fruits-healthy-snacks'});
  if (dry) {
    await db.collection('products').updateOne({name:/Poha, Coconut & Dry Fruit Mixture/i}, {$set:{category: dry._id}});
    console.log('fixed');
  }
  await db.collection('categories').updateMany({slug:{$in:['mixtures','millet-cookies','jaggery-products','raw-materials','others','chikki','pantry-staples']}}, {$set:{published:false}});
  await c.close();
})();
