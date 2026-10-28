const fs = require('fs');
const path = require('path');
function walk(dir){const res=[];for(const f of fs.readdirSync(dir)){const p=path.join(dir,f);const s=fs.statSync(p);if(s.isDirectory())res.push(...walk(p));else res.push(p);}return res;}
const files=walk('public').concat(walk('src'));
for(const f of files){try{const c=fs.readFileSync(f,'utf8');if(c.match(/black-sesame-almond-chikki-1\.webp|black-sesame-kaju-chikki-1\.webp|kaju-jaggery-chikki-1\.webp/)) console.log(f); }catch(e){}}
