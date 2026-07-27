---
name: ui-ux-researcher
description: Research UI/UX from PDF, website, image, or JSON sources and generate design tokens. Use when user wants to extract design styles or research UI/UX.
---

# UI/UX Researcher

## Quick Start
To extract design tokens, identify the source type and follow the workflow below.

## Workflow
1.  **Identify Input Type**: Determine if the source is a PDF, Website URL, Image, or JSON.
2.  **Extraction**:
    -   **Website (Python First)**:
        -   Run `python .agent/skills/ui-ux-researcher/scripts/extract_web.py [URL]`.
        -   If it fails or returns insufficient data, proceed to **Website (Browser Fallback)**.
    -   **Website (Browser Fallback)**:
        -   Use `browser_subagent` to visit the URL.
        -   Task: "Extract computed CSS styles for colors, typography, and buttons. Return as JSON."
    -   **PDF**:
        -   Run `python .agent/skills/ui-ux-researcher/scripts/extract_pdf.py [PATH_TO_PDF]`.
    -   **Image**:
        -   Use `view_file` (if local) or look at the artifact.
        -   Manually analyze: Colors (hex), Typography (style/family), Layout, Components.
    -   **JSON**: Read directly.
3.  **Synthesis**:
    -   Consolidate all findings.
    -   Save to `docs/research/ui-ux/design-token.json`.

## Instructions

### 1. Browser Fallback Strategy
If `bs4` cannot scrape the site (SPA, dynamic, blocked):
1.  Invoke `browser_subagent`.
2.  Navigate to the URL.
3.  Run JavaScript in the console to extract styles (if possible) or visually inspect.
4.  Extract:
    -   **Colors**: Primary, Secondary, Background, Text.
    -   **Fonts**: Family, sizes for H1-H6, p.
    -   **Spacing**: General padding/margin patterns.

### 2. Image Analysis Strategy
"Read" the image without scripts:
1.  **Colors**: Identify the top 5 dominant colors.
2.  **Typography**: Serif vs Sans-serif? Monospace? Round vs Sharp?
3.  **Components**: Rounded corners? Shadows? Flat?
4.  **Vibe**: Professional, Playful, Dark, etc.

### 3. Output Schema
The final `docs/research/ui-ux/design-token.json` SHOULD follow this structure:

```json
{
  "project_name": "...",
  "theme": {
    "colors": {
      "primary": "#...",
      "secondary": "#...",
      "background": "#...",
      "surface": "#...",
      "text": "#..."
    },
    "typography": {
      "font_family_primary": "...",
      "font_family_secondary": "...",
      "headings": {
        "h1": { "size": "...", "weight": "..." }
      }
    },
    "spacing": { "unit": "..." },
    "borderRadius": "..."
  },
  "raw_research_notes": "..."
}
```

## Resources
- Scripts are located in `.agent/skills/ui-ux-researcher/scripts/`
