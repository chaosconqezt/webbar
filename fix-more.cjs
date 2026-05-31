const fs = require('fs');
const path = require('path');
const dirs = ['src'];
const map = {
  'hover:bg-[#ff9900]': 'hover:bg-fb-accent',
  'hover:bg-[#ffaa22]': 'hover:bg-fb-accent-2',
  'from-[#888888]': 'from-fb-text-4',
  'to-[#444444]': 'to-fb-text-7',
  'border-l-[#888]': 'border-l-fb-text-4',
  'border-r-[#888]': 'border-r-fb-text-4',
  'bg-[#888888]': 'bg-fb-text-4',
  'bg-[#888]': 'bg-fb-text-4',
  'accent-[#ff9900]': 'accent-fb-accent',
  'focus:border-[#ff9900]': 'focus:border-fb-accent'
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const keys = Object.keys(map).sort((a, b) => b.length - a.length);
      
      for (const k of keys) {
        const regex = new RegExp(`(?<=[\\s"'\\\`])${escapeRegExp(k)}(?=[\\s"'\\\`])`, 'g');
        content = content.replace(regex, map[k]);
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

for (const dir of dirs) {
  processDir(dir);
}
console.log('done fixing more');
