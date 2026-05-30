const fs = require('fs');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match <button but not if there is already a type attribute inside the same tag
  const newContent = content.replace(/<button(?![^>]*\btype=)/g, '<button type="button"');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});
console.log('Fixed buttons in ' + changedCount + ' files.');
