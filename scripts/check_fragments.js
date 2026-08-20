const fs = require('fs');
const path = require('path');

const hsk1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk1.json'), 'utf8'));
const hsk2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk2.json'), 'utf8'));
const hsk3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk3.json'), 'utf8'));

const fragmentsToCheck = ['因为', '所以', '虽然', '但是', '不但', '而且', '只有', '才'];

console.log('=== AUDITING STANDALONE GRAMMAR PATTERN FRAGMENTS ===\n');

fragmentsToCheck.forEach(frag => {
  const in1 = hsk1.filter(e => e.character === frag);
  const in2 = hsk2.filter(e => e.character === frag);
  const in3 = hsk3.filter(e => e.character === frag);

  console.log(`Fragment "${frag}":`);
  if (in1.length) console.log(`   hsk1.json:`, in1);
  if (in2.length) console.log(`   hsk2.json:`, in2);
  if (in3.length) console.log(`   hsk3.json:`, in3);
  if (!in1.length && !in2.length && !in3.length) console.log(`   (Not present in any dataset)`);
  console.log('');
});
