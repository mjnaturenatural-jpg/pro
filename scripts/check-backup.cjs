const fs = require('fs');
const d = JSON.parse(fs.readFileSync('catalogue-backups/full-backup-2026-10-28T06-47-52-898Z.json'));
console.log(typeof d);
console.log(Array.isArray(d));
if (Array.isArray(d)) {
  d.slice(0,5).forEach(x=>{console.log(x._id, x.slug||x.name);});
} else {
  console.log(Object.keys(d));
}
