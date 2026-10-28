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
  await db.collection('products').updateOne({slug:'black-sesame-almond-chikki'}, {$set:{images:[
    '/images/products/black-sesame-almond-chikki-5.png'
  ]}});
  console.log('done');
  await c.close();
})();
