const dns = require('dns');
const fs = require('fs');
const path = require('path');
dns.setServers(['1.1.1.1','8.8.8.8']);
try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
} catch(e){}
const BASE = (process.env.DELIVERY_BASE_URL||'https://track.delhivery.com').replace(/\/+$/,'');
const API_TOKEN = process.env.DELIVERY_API_TOKEN||'';
fetch(BASE+'/api/pin-codes/json/?filter_codes='+process.env.DELIVERY_PICKUP_POSTCODE, {
  headers:{Authorization:'Token '+API_TOKEN, Accept:'application/json'},
  signal: AbortSignal.timeout(10000)
}).then(async r=>{
  console.log('status', r.status);
  const t = await r.text();
  console.log(t.slice(0,300));
}).catch(e=>{console.log('err', e.message);});
