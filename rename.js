const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /ROG AI/g, replace: 'JARVIS AI' },
  { regex: /rog-ai/g, replace: 'jarvis-ai' },
  { regex: /rog_ai/g, replace: 'jarvis_ai' },
  { regex: /rogai/g, replace: 'jarvisai' },
  { regex: /ROG/g, replace: 'JARVIS' },
  { regex: /Rog AI/g, replace: 'Jarvis AI' },
  { regex: /Rog/g, replace: 'Jarvis' },
  { regex: /rog/g, replace: 'jarvis' } // Be careful, but necessary for localStorage etc.
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && /\.(tsx|ts|js|jsx|json|md|css|html)$/.test(file)) {
      if (file === 'rename.js' || file.includes('package-lock.json')) continue;
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      
      // Specifically for Progress.tsx, we should skip 'prog' matches or be smart.
      // Wait, 'prog' doesn't match 'rog' as a whole word unless we do so, but /rog/g matches inside progress!
      // I should use word boundaries for 'rog' and 'ROG' to avoid 'progress' -> 'pjarvisress'.
      let tempContent = content;
      
      // Safe replacements
      tempContent = tempContent.replace(/ROG AI/g, 'JARVIS AI');
      tempContent = tempContent.replace(/rog-ai/g, 'jarvis-ai');
      tempContent = tempContent.replace(/rog_ai/g, 'jarvis_ai');
      tempContent = tempContent.replace(/rogai/gi, 'jarvisai');
      tempContent = tempContent.replace(/\bROG\b/g, 'JARVIS');
      tempContent = tempContent.replace(/\bRog\b/g, 'Jarvis');
      tempContent = tempContent.replace(/\brog\b/g, 'jarvis');

      if (tempContent !== content) {
        fs.writeFileSync(fullPath, tempContent, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDirectory(__dirname);
