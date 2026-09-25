const fs = require('fs');

const oldHtml = fs.readFileSync('index.html', 'utf-8');
const newHtml = fs.readFileSync('teams/montreal/index.html', 'utf-8');
const newApp = fs.readFileSync('shared/app.js', 'utf-8');

// Check event listeners
const oldListeners = [...oldHtml.matchAll(/\.addEventListener\(['"]([^'"]+)['"]/g)].map(m => m[1]);
const newListeners = [...newApp.matchAll(/\.addEventListener\(['"]([^'"]+)['"]/g)].map(m => m[1]);

// Check functions
const oldFuncs = [...oldHtml.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
const newFuncs = [...newApp.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);

console.log("OLD FUNCTIONS:", new Set(oldFuncs));
console.log("NEW FUNCTIONS:", new Set(newFuncs));

// Look for specific UI strings that might have been dropped
const searchTerms = [
  "localStorage",
  "umami",
  "ko-fi",
  "share",
  "manifest"
];

console.log("\n--- Term Search ---");
searchTerms.forEach(term => {
  const inOld = oldHtml.toLowerCase().includes(term);
  const inNew = newHtml.toLowerCase().includes(term) || newApp.toLowerCase().includes(term);
  if (inOld && !inNew) {
    console.log(`WARNING: '${term}' found in old but NOT new`);
  }
});

