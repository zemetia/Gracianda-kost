---
name: planning-tasks
description: Plans task implementation with detailed checklists. Use when starting a new task, complex feature, or when a step-by-step implementation plan is needed.
---

# Task Planning & Implementation Checklist

## Summary

The **planning-tasks** skill focuses on creating, managing, and evolving high-precision implementation checklists. It follows the **Gemini Flash Overpower** philosophy: 100% accuracy, multi-step verification, and treating the checklist as a critical life-line for the project.

## Quick Start

1.  **Initialize**: Ask yourself "What is the ultimate goal?"
2.  **Generate**: Use the [Expert Prompt](#expert-prompt) to create a `docs/tasks/[date].md` file.
3.  **Execute**: Follow each step, updating the checkbox `[ ]` to `[x]` upon VERIFIED completion.
4.  **Evolve**: If a step reveals complexity, add sub-tasks or create a new detailed checklist.

## Expert Prompt

When creating a checklist, use this internal prompt to guide your generation:

> "Act as a Lead Systems Architect. Analyze the requirements for [TASK_DESCRIPTION]. Break down the implementation into atomic, verifiable steps. Each step must have a clear 'Definition of Done'. Include sections for Research, Setup, Implementation, Testing, and Verification. Every step is a survival requirement."

## Workflow

1.  **Analyze**: Deeply understand the user request and codebase.
2.  **Plan**: Create a checklist in `docs/tasks/`. Use the format `YYYY-MM-DD-task-name.md`.
3.  **Validate**: Review the plan twice (Iteration Phase). Is it complete? Are there edge cases?
4.  **Execute & Sync**: Perform one step at a time. Update the `.md` file IMMEDIATELY after each step.
5.  **Audit**: Before marking a step complete, verify it works (build, test, or visual check).
6.  **Pivoting**: If the task changes or more steps are discovered, append them to the checklist or create a follow-up checklist.

## Checklist Template

```markdown
# Task: [Task Name]

- **Date**: [YYYY-MM-DD]
- **Status**: In Progress / Completed
- **Source**: [Link to conversation or request]

## 🎯 Goal

Short description of the end goal.

## 📋 Implementation Checklist

- [ ] **Phase 1: Research & Discovery**
  - [ ] Step 1.1: [Detail]
- [ ] **Phase 2: Core Implementation**
  - [ ] Step 2.1: [Detail]
- [ ] **Phase 3: Testing & Verification**
  - [ ] Step 3.1: [Detail]

you must work with .agent/skills/planning-tasks/verify-planning-skill.md

## 🛠️ Technical Details

- Files affected: [...]
- Dependencies: [...]

## 📝 Notes & Discoveries

[Add learnings here as you go]
```

## Rules

- **Never skip steps**: If a step is no longer needed, mark it as `[-]` and explain why.
- **Immediate Update**: The checklist is the source of truth. It must be updated before moving to the next task.
- **Overpower Mode**: Think 3 times before checking a box.
