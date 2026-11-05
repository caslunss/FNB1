import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
const files=fs.readdirSync('dist/assets').filter(x=>/\.(js|css)$/.test(x));
const rows=files.map(file=>{const bytes=fs.readFileSync('dist/assets/'+file);return {file,bytes:bytes.length,gzip:gzipSync(bytes).length}});
const bad=rows.filter(row=>row.gzip>(row.file.endsWith('.css')?65000:210000));
console.log(JSON.stringify({assets:rows.length,largest:rows.sort((a,b)=>b.gzip-a.gzip).slice(0,4),withinBudget:!bad.length},null,2));
if(bad.length)process.exitCode=1;
