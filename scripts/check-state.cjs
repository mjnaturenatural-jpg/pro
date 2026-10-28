const {MongoClient}=require('mongodb');const fs=require('fs');const path=require('path');const dns=require('dns');
try{const env=fs.readFileSync(path.join(process.cwd(),'.env.local'),'utf8');for(const line of env.split(/\r?\n/)){if(!line||line.startsWith('#'))continue;const idx=line.indexOf('=');if(idx>0)process.env[line.slice(0,idx).trim()]=line.slice(idx+1).trim();}}catch(e){}
dns.setServers(['1.1.1.1','8.8.8.8']);
(async()=>{
  const c=new MongoClient(process.env.MONGODB_URI);await c.connect();const db=c.db();
  const cats=await db.collection('categories').find({published:true}).sort({order:1,name:1}).toArray();
  const prods=await db.collection('products').find({published:true}).toArray();
  for(const cat of cats){const cnt=prods.filter(p=>p.category&&p.category.toString()===cat._id.toString()).length;console.log(cat.name+':'+cnt);}
  console.log('TOTAL:'+prods.length);
  await c.close();
})();
