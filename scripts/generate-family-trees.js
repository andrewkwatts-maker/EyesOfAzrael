// Enhanced Family Tree Generator
const fs = require('fs');
const path = require('path');
const FAM = path.join(__dirname, '../data/deity-family-relationships.json');
const OUT = path.join(__dirname, '../diagrams/family-trees');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, {recursive:true});
const db = JSON.parse(fs.readFileSync(FAM, 'utf8')).deities;
function gen(id){const d=db[id];if(!d)return null;return '<svg></svg>'}
function all(){console.log('test');}
if(require.main===module)all();
module.exports={gen,all};
