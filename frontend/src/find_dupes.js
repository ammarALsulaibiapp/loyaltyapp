const fs = require('fs');
const content = fs.readFileSync('./src/i18n.ts', 'utf8');
const lines = content.split('\n');
const seenEn = {};
const seenAr = {};
let isAr = false;

lines.forEach((line, index) => {
  if (line.includes('ar: {')) {
    isAr = true;
  }
  const match = line.match(/'([^']+)'\s*:/);
  if (match) {
    const key = match[1];
    const dict = isAr ? seenAr : seenEn;
    if (dict[key]) {
      console.log(`DUPLICATE key in ${isAr ? 'AR' : 'EN'}: "${key}" on lines ${dict[key]} and ${index + 1}`);
    } else {
      dict[key] = index + 1;
    }
  }
});
console.log('Done scanning!');
