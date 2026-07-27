const fs = require('fs');

const inputFile = process.argv[2];

if (!inputFile) {
    console.log('Usage: node replace_code.js <path-to-replacements-json>');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
// Expected format:
// {
//   "filePath": "/abs/path/to/file.tsx",
//   "replacements": [
//     { "start": 10, "end": 20, "text": "{t('new_key')}" }
//   ]
// }

const filePath = data.filePath;
if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Sort replacements by start index descending to avoid messing up indices
const sortedReplacements = data.replacements.sort((a, b) => b.start - a.start);

for (const rep of sortedReplacements) {
    const before = content.slice(0, rep.start);
    const after = content.slice(rep.end);
    content = before + rep.text + after;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully applied ${sortedReplacements.length} replacements to ${filePath}`);
