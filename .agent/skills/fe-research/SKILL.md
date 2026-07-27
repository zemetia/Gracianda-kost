---
name: fe-research
description: Research frontend best practices, design implementations, and animations. Use when starting a new frontend feature, looking for UI inspiration, or needing complex animation implementations from sources like CodePen, GSAP, or other CSS/UI galleries.
---

# Frontend Researcher (fe-research)

A specialized workflow for researching and documenting frontend best practices, design patterns, and animation implementations.

## Quick Start
1. Identify the frontend task or component (e.g., "Smooth Scroll Animation", "Glassmorphism Card").
2. Search for implementations on:
   - **CodePen**: For interactive UI snippets and CSS tricks.
   - **GSAP**: For complex, high-performance animations.
   - **Modern UI Galleries**: For overall design patterns (Awwwards, Dribbble, etc.).
3. Analyze the project's existing frontend tech stack (React, Next.js, Framer Motion, etc.) to ensure compatibility.
4. Document the research in `/docs/research/frontend/[task-name].md`.

## Workflows

### 1. Research Initiation
- **Define Task Name**: Create a clear, slugified name for the task (e.g., `hero-scroll-animation`).
- **Check Project Context**:
  - Identify the framework (Next.js, Vite, etc.).
  - Identify styling libraries (Vanilla CSS, Tailwind, Styled Components).
  - Identify animation libraries (GSAP, Framer Motion, Motion One).
  - **Constraint**: Don't focus on frameworks unless explicitly asked; focus on the core implementation/logic.

### 2. Implementation Research
- **Source Search**:
  - `site:codepen.io [task keywords]`
  - `site:gsap.com [task keywords]`
  - `site:[well known frontend gallery website] [task keywords]`
  - Search for "modern [task keywords] implementation" or "latest [task keywords] best practices".
- **Design & Animation Focus**:
  - Look for "WOW" factor: vibrant colors, glassmorphism, micro-animations, smooth transitions.
  - Analyze how animations are triggered (scroll, hover, click).
  - Identify key CSS properties or JS methods used.

### 3. Documentation
- **Mandatory Citations**: Every piece of information, design pattern, or code snippet must be accompanied by its source URL.
- **Save Location**: Save the results in `/docs/research/frontend/[task_name].md` using the template below.
```markdown
# [Task Name] Research

## Overview
Brief description of the UI/UX goal and why this implementation was chosen.

## Inspiration & Sources (Mandatory)
> [!IMPORTANT]
> You must list all websites and URLs where information or inspiration was gathered.

- **[Website Name]**: [Direct URL to implementation/article] - Description of what was learned/taken from this source.
- **[Library/Tool]**: [Official URL] - Documentation or reference used.

## Design Implementation
- **Visual Style**: (e.g., Glassmorphism, Brutalism)
- **Color Palette**: Suggested HEX/HSL codes.
- **Typography**: Recommended font pairings.

## Animation Implementation
- **Trigger**: (e.g., ScrollTrigger, On Click)
- **Logic**: Simplified explanation of the animation timeline or CSS keyframes.
- **Performance**: Notes on keeping it smooth (GPU acceleration, etc.).

## Code Snippet (Core Logic)
```javascript/css
// Essential logic for the implementation
```

## Considerations
- Browser compatibility.
- Accessibility (A11y).
- Integration with existing codebase.
```

## Reference
- **GSAP Learning**: [GSAP Learning Center](https://gsap.com/learning/)
- **CodePen Trending**: [CodePen Trending](https://codepen.io/trending)
- **Examples**: See [examples.md](examples.md)
