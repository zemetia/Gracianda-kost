---
name: frontend-translator
description: Scans frontend files for untranslated text, generates translations (ID/EN), updates locale files, and refactors code to use internationalization.
---

# Frontend Translator Skill

This skill helps you methodically translate hardcoded strings in the frontend codebase.

## Workflow

### 1. Scan for Untranslated Strings
First, identify the hardcoded strings in a target file.

- **Run the scanner**:
  ```bash
  node .agent/skills/frontend-translator/scripts/scan_i18n.js <absolute_path_to_file>
  ```
- **Analyze the output**: The script will output a JSON list of findings (JsxText or JsxAttribute).

### 2. Map and Generate Translations
Review the findings and decide on keys and translations. Use your LLM capabilities to generate a JSON map.

**Format for Translation Map (`translations.json`):**
```json
{
  "Namespace": {
    "key_name": {
      "en": "English Translation",
      "id": "Indonesian Translation"
    }
  }
}
```
*Note: If the project uses flat keys, omit the Namespace wrapper.*

### 3. Update Locale Files
Apply the new translations to the project's locale files (`en.json`, `id.json`).

- **Create a temporary `translations.json` file** with the content from Step 2.
- **Run the updater**:
  ```bash
  node .agent/skills/frontend-translator/scripts/update_locales.js <path_to_translations.json>
  ```
- **Verify**: Check `boostup-fe/src/locales/en.json` and `id.json` to ensure keys were added.

### 4. Apply Code Changes
Replace the hardcoded strings in the source file with the translation function call (e.g., `t('key')`).

- **Create a temporary `replacements.json` file**:
  ```json
  {
    "filePath": "<absolute_path_to_file>",
    "replacements": [
      {
        "start": <start_index_from_scan>,
        "end": <end_index_from_scan>,
        "text": "{t('Namespace.key_name')}" 
      }
    ]
  }
  ```
  *Tip: For JSX attributes (like `placeholder="TxT"`), the replacement text should be `{t('Namespace.key')}` if it becomes a dynamic value, or just `t('Namespace.key')` if inside a prop that accepts string only (though usually in React props we switch to expression `{...}`).* 
  *Wait, if the scanner returns the range of the *text content* only (inside quotes), you replace just the text. But usually you need to replace the whole string literal with an expression.*
  
  **Scanner Behavior Note**:
  - `JsxText`: The range covers the text content. You usually want to replace it with `{t('key')}`.
  - `JsxAttribute`: The range returned by `scan_i18n.js` covers the *entire string literal* including quotes?
    - Let's check `scan_i18n.js`: 
      - `start: node.initializer.getStart()` -> This includes the quotes for a StringLiteral.
      - So replacing it with `{t('key')}` works for attributes too (e.g. `placeholder="Foo"` -> `placeholder={t('Foo')}`).

- **Run the replacer**:
  ```bash
  node .agent/skills/frontend-translator/scripts/replace_code.js <path_to_replacements.json>
  ```

### 5. Cleanup
- Remove the temporary JSON files.
- Run `npm run lint` or check the file to ensure import of `useTranslations` is present.
- **Critical**: If `useTranslations` hook is missing in the component, you must manually add it:
  ```typescript
  import { useTranslations } from 'next-intl';
  // and inside component
  const t = useTranslations('Namespace');
  ```
  
## Example Session

1. **User**: "Translate the Sidebar component."
2. **Agent**: 
   - Runs `scan_i18n.js .../Sidebar.tsx`.
   - Sees "Dashboard" and "Settings".
   - Decides on namespace `Sidebar` and keys `dashboard`, `settings`.
   - Creates `trans_temp.json`: `{"Sidebar": {"dashboard": {"en": "Dashboard", "id": "Dasbor"}, "settings": {"en": "Settings", "id": "Pengaturan"}}}`.
   - Runs `update_locales.js trans_temp.json`.
   - Creates `replace_temp.json` mapping the indices of "Dashboard" to `{t('dashboard')}`.
   - Runs `replace_code.js replace_temp.json`.
   - Manually edits `Sidebar.tsx` to add `const t = useTranslations('Sidebar');` if missing.
