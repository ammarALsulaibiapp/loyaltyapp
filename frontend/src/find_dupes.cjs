const fs = require('fs');
const content = fs.readFileSync(__dirname + '/i18n.ts', 'utf8');

// Replace any typescript specific syntax or export statements
let jsContent = content
  .replace(/import\s+[\s\S]*?\n/g, '')
  .replace(/export\s+default\s+[\s\S]*/g, '')
  .replace(/i18n[\s\S]*/g, '');

try {
  // Define helper variables to avoid ReferenceError
  const initReactI18next = null;
  const i18n = null;
  
  eval(jsContent);
  console.log('Parsed successfully!');
} catch (e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
