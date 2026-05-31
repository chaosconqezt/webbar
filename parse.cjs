const fs = require('fs');
const path = require('path');

const dirs = ['src'];

const map = {
  'bg-[#0a0a0a]': 'bg-fb-bg',
  'bg-[#0d0d0d]': 'bg-fb-bg-2',
  'bg-[#111111]': 'bg-fb-bg-3',
  'bg-[#111]': 'bg-fb-bg-3',
  'bg-[#222222]': 'bg-fb-bg-4',
  'bg-[#222]': 'bg-fb-bg-4',
  'bg-[#333333]': 'bg-fb-bg-5',
  'bg-[#333]': 'bg-fb-bg-5',
  'bg-[#1a1a1a]': 'bg-fb-bg-6',
  'bg-black': 'bg-fb-black',
  'bg-black/60': 'bg-fb-black/60',
  
  'text-[#cccccc]': 'text-fb-text',
  'text-[#aaaaaa]': 'text-fb-text-2',
  'text-[#aaa]': 'text-fb-text-2',
  'text-[#bbbbbb]': 'text-fb-text-3',
  'text-[#bbb]': 'text-fb-text-3',
  'text-[#888888]': 'text-fb-text-4',
  'text-[#888]': 'text-fb-text-4',
  'text-[#666666]': 'text-fb-text-5',
  'text-[#666]': 'text-fb-text-5',
  'text-[#555555]': 'text-fb-text-6',
  'text-[#555]': 'text-fb-text-6',
  'text-[#444444]': 'text-fb-text-7',
  'text-[#444]': 'text-fb-text-7',
  
  'border-[#333333]': 'border-fb-border',
  'border-[#333]': 'border-fb-border',
  'border-[#1a1a1a]': 'border-fb-border-2',
  'border-[#444444]': 'border-fb-border-3',
  'border-[#444]': 'border-fb-border-3',
  'border-[#222222]': 'border-fb-border-4',
  'border-[#222]': 'border-fb-border-4',
  
  'text-[#ff9900]': 'text-fb-accent',
  'bg-[#ff9900]': 'bg-fb-accent',
  'bg-[#ff9900]/20': 'bg-fb-accent/20',
  'ring-[#ff9900]': 'ring-fb-accent',
  'border-[#ff9900]': 'border-fb-accent',
  
  'text-[#ffaa22]': 'text-fb-accent-2',
  'bg-[#ffaa22]': 'bg-fb-accent-2',
  
  'text-[#ff2222]': 'text-fb-error',
  'bg-[#ff2222]': 'bg-fb-error',
  'bg-[#ff4444]': 'bg-fb-error-2',
  'hover:text-[#ff2222]': 'hover:text-fb-error',
  
  'hover:text-[#ff9900]': 'hover:text-fb-accent',
  'hover:bg-[#ffaa22]': 'hover:bg-fb-accent-2',
  'hover:bg-[#ff4444]': 'hover:bg-fb-error-2',
  
  'hover:bg-[#111111]': 'hover:bg-fb-bg-3',
  'hover:bg-[#111]': 'hover:bg-fb-bg-3',
  'hover:bg-[#222222]': 'hover:bg-fb-bg-4',
  'hover:bg-[#222]': 'hover:bg-fb-bg-4',
  'hover:bg-[#333333]': 'hover:bg-fb-bg-5',
  'hover:bg-[#333]': 'hover:bg-fb-bg-5',
  'hover:bg-[#1a1a1a]': 'hover:bg-fb-bg-6',
  
  'text-white': 'text-fb-white',
  'hover:text-white': 'hover:text-fb-white',
  'selection:text-white': 'selection:text-fb-white'
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
        // We match class names wrapped in space, quotes, backticks
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
console.log('done');
