const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const localesDir = path.join(projectRoot, 'boostup-fe', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const idPath = path.join(localesDir, 'id.json');
const frPath = path.join(localesDir, 'fr.json');

const newTranslationsFile = process.argv[2];

if (!newTranslationsFile) {
    console.log('Usage: node update_locales.js <path-to-new-translations-json>');
    console.log('Input JSON format: { "namespace": { "key": { "en": "Val", "id": "Val" } } } or flat { "key": { "en": "...", "id": "..." } }');
    process.exit(1);
}

const newTranslations = JSON.parse(fs.readFileSync(newTranslationsFile, 'utf8'));

function updateLocaleFile(filePath, lang, newTrans) {
    let currentContent = {};
    if (fs.existsSync(filePath)) {
        try {
            currentContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error reading ${filePath}:`, e);
        }
    }

    let updated = false;


    function mergeDeep(target, source, lang) {
        let changed = false;
        for (const key in source) {
            const value = source[key];
            if (typeof value === 'object' && value !== null) {
                if (value[lang] && typeof value[lang] === 'string') {
                    // Leaf node with translation
                    if (!target[key]) {
                        target[key] = value[lang];
                        changed = true;
                    }
                } else {
                    // Nested object
                    if (!target[key]) {
                        target[key] = {};
                        changed = true;
                    }
                    if (mergeDeep(target[key], value, lang)) {
                        changed = true;
                    }
                }
            }
        }
        return changed;
    }

    // Check if it's a flat structure or nested
    // We assume logic: traverse source. If we find { en: "..." }, extract it.
    // Actually, let's keep it simple. The input format is mirrored structure with { en, id } leaves.

    if (mergeDeep(currentContent, newTrans, lang)) {
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(currentContent, null, 2), 'utf8');
        console.log(`Updated ${path.basename(filePath)}`);
    } else {
        console.log(`No changes for ${path.basename(filePath)}`);
    }
}

updateLocaleFile(enPath, 'en', newTranslations);
updateLocaleFile(idPath, 'id', newTranslations);
// Optional: updateLocaleFile(frPath, 'fr', newTranslations); // If we had FR translations
