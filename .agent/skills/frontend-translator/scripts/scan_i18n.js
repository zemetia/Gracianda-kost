const fs = require('fs');
const path = require('path');

// Try to resolve typescript from the project's node_modules
let ts;
try {
    ts = require(path.join(process.cwd(), 'boostup-fe', 'node_modules', 'typescript'));
} catch (e) {
    try {
        ts = require('typescript');
    } catch (e2) {
        console.error('TypeScript package not found. Please install typescript or run from a directory where it is available.');
        process.exit(1);
    }
}

const targetFile = process.argv[2];

if (!targetFile) {
    console.log('Usage: node scan_i18n.js <path-to-file>');
    process.exit(1);
}

const fileContent = fs.readFileSync(targetFile, 'utf8');
const sourceFile = ts.createSourceFile(
    targetFile,
    fileContent,
    ts.ScriptTarget.Latest,
    true
);

const findings = [];

function isTranslatableAttribute(name) {
    const translatableAttributes = [
        'title', 'placeholder', 'label', 'aria-label', 'alt', 'description',
        'header', 'footer', 'tooltip', 'message'
    ];
    return translatableAttributes.includes(name);
}

function visit(node) {
    // Check for JSX Text (e.g. <div>Hello</div>)
    if (ts.isJsxText(node)) {
        const text = node.getText().trim();
        if (text && !text.match(/^{.*}$/)) { // Ignore purely expression blocks if they got caught (though JsxText shouldn't capture them)
            // Ignore if it looks like just punctuation or numbers
            if (/[a-zA-Z]/.test(text)) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                findings.push({
                    type: 'JsxText',
                    text: text,
                    line: line + 1,
                    start: node.getStart(),
                    end: node.getEnd()
                });
            }
        }
    }

    // Check for String Literals in JSX Attributes (e.g. placeholder="Search")
    if (ts.isJsxAttribute(node)) {
        if (node.initializer && ts.isStringLiteral(node.initializer)) {
            if (isTranslatableAttribute(node.name.getText())) {
                const text = node.initializer.text;
                if (text && /[a-zA-Z]/.test(text)) {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.initializer.getStart());
                    findings.push({
                        type: 'JsxAttribute',
                        attribute: node.name.getText(),
                        text: text,
                        line: line + 1,
                        start: node.initializer.getStart(),
                        end: node.initializer.getEnd()
                    });
                }
            }
        }
    }

    // Specific check for 'labelKey' or 'titleKey' which usually indicate ALREADY translated items in this specific codebase?
    // No, we are looking for non-translated stuff.
    // But wait, if we see `label="Some String"`, we want to translate it.

    ts.forEachChild(node, visit);
}

visit(sourceFile);


fs.writeFileSync('scan_output.json', JSON.stringify(findings, null, 2));
console.log('Scan complete. Results written to scan_output.json');

