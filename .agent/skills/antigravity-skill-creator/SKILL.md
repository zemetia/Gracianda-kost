---
name: creating-skills
description: Creates high-quality agent skills. Use when user wants to create, design, or define a new skill or agent capability.
---

# Skill Creator

## Quick Reference

| Element | Requirement |
|---------|-------------|
| Name | lowercase, hyphens, gerund form, max 64 chars (`processing-pdfs`) |
| Description | third person, what it does + when to use, max 1024 chars |
| SKILL.md | under 500 lines, references one level deep |
| Paths | always use `/` never `\` |

---

## 1. Core Principles

### Be Concise
Claude is smart. Only add context it doesn't have. Ask: "Does this justify its token cost?"

```markdown
# Good (~50 tokens)
Use pdfplumber:
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()

# Bad (~150 tokens)
PDF (Portable Document Format) files are a common format...
[unnecessary explanation]
```

### Match Freedom to Task Fragility

| Freedom | When | Example |
|---------|------|---------|
| **High** (text) | Multiple valid approaches | Code review guidelines |
| **Medium** (templates) | Preferred pattern with variation | Report generator |
| **Low** (exact scripts) | Fragile/critical operations | Database migrations |

---

## 2. Skill Structure

```
skill-name/
├── SKILL.md              # Main instructions (loaded when triggered)
├── reference/            # Domain docs (loaded as needed)
│   └── domain.md
└── scripts/
    └── utility.py        # Executed, not loaded into context
```

### SKILL.md Format

```yaml
---
name: skill-name
description: Does X and Y. Use when user mentions Z or needs W.
---

# Skill Title

## Quick Start
[Minimal working example]

## Reference
- **Domain A**: See [reference/domain-a.md](reference/domain-a.md)

## Workflow
1. Step one
2. Step two
```

### Writing Descriptions

```yaml
# Good - specific triggers
description: Extract text from PDFs, fill forms. Use when working with
             PDF files or user mentions document extraction.

# Bad - vague
description: Helps with documents
```

---

## 3. Workflows & Feedback Loops

For complex tasks, provide trackable checklists:

```markdown
## Workflow
Copy this checklist:
- [ ] Step 1: Analyze input
- [ ] Step 2: Validate
- [ ] Step 3: Execute
- [ ] Step 4: Verify output

**Step 1**: Run `python scripts/analyze.py input.pdf`
...
```

**Feedback loop pattern**: Run validator → fix errors → repeat until pass.

---

## 4. Patterns

### Template Pattern
```markdown
Use this structure:
# [Title]
## Summary
## Findings
## Recommendations
```

### Examples Pattern (input/output pairs)
```markdown
**Input:** Added user auth
**Output:** feat(auth): implement authentication
```

---

## 5. Anti-Patterns

| Avoid | Do Instead |
|-------|------------|
| Windows paths (`scripts\file.py`) | Unix paths (`scripts/file.py`) |
| Vague names (`helper`, `utils`) | Descriptive (`pdf-processing`) |
| Multiple options without default | One recommended + alternatives |
| Deeply nested references | One level deep from SKILL.md |
| Assuming packages installed | List dependencies explicitly |

---

## 6. Testing

1. Run Claude on tasks **without** skill - document failures
2. Create 3+ test scenarios covering those gaps
3. Write minimal instructions to address gaps
4. Test with fresh instance, iterate

---

## 7. Checklist

- [ ] Description: specific, third person, includes triggers
- [ ] SKILL.md under 500 lines
- [ ] References one level deep
- [ ] Consistent terminology
- [ ] Concrete examples included
- [ ] No time-sensitive information
- [ ] Clear workflow steps
- [ ] 3+ test scenarios created

---

## Output Template

When creating a skill, output:

**Path:** `.agent/skills/[skill-name]/`

### SKILL.md
```yaml
---
name: [gerund-name]
description: [What it does]. Use when [triggers].
---

# [Skill Title]

## Quick Start
[Minimal example]

## When to Use
- Trigger 1
- Trigger 2

## Reference
- **[Domain]**: See [reference/domain.md](reference/domain.md)

## Workflow
1. [Step]
2. [Step]

## Instructions
[Specific logic, code snippets, or rules]

## Resources
- [Link to scripts/ or resources/]

## Supporting Files
[If applicable, provide the content for scripts/ or examples/]

## Examples
**Input:** [example]
**Output:** [example]
```

### Additional Files (if needed)
Provide content for `reference/` or `scripts/` files.
