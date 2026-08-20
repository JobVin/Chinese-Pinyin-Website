const fs = require('fs');
const path = require('path');

const hsk1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk1.json'), 'utf8'));
const hsk2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk2.json'), 'utf8'));
const hsk3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk3.json'), 'utf8'));

console.log('=== "为" ENTRIES ACROSS DATASETS ===\n');

console.log('hsk1.json "为" entries:', hsk1.filter(e => e.character.includes('为')));
console.log('\nhsk2.json "for/because" exact "为":', hsk2.filter(e => e.character === '为'));
console.log('hsk2.json "为" compounds:', hsk2.filter(e => e.character.includes('为') && e.character !== '为'));
console.log('\nhsk3.json "for/because" exact "为":', hsk3.filter(e => e.character === '为'));
console.log('hsk3.json "为" compounds:', hsk3.filter(e => e.character.includes('replace') || e.character.includes('为')));
