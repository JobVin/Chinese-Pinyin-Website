const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const head3 = JSON.parse(execSync('git show HEAD:data/hsk3.json', { encoding: 'utf8' }));
const curr3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk3.json'), 'utf8'));

const headA = head3.find(e => e.character === '啊');
const currA = curr3.find(e => e.character === '啊');

console.log('=== HEAD "啊" Entry in git show HEAD:data/hsk3.json ===');
console.log(JSON.stringify(headA, null, 2));

console.log('\n=== CURRENT "啊" Entry in data/hsk3.json ===');
console.log(JSON.stringify(currA, null, 2));
