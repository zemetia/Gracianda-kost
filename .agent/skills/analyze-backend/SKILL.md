---
name: analyze-backend
description: Analyze and debug backend and database structures without making code changes. Provides a comprehensive report with advice, scoring, recommendations, and future development steps.
---

# Analyze Backend (analyze-backend)

This skill is dedicated to analyzing backend logic, API endpoints, and database schemas to provide high-level architectural advice and debugging insights. **It is strictly a read-only and reporting tool.** It does not modify code.

## Core Rules
1.  **READ-ONLY**: Do NOT edit any code files.
2.  **REPORT-ONLY**: Output must be a markdown report.
3.  **DEEP ANALYSIS**: Look beyond syntax; analyze logic, performance, and scalability.

## Workflow

### 1. Analysis Phase
- **Backend structure**: Identify the framework (Next.js, NestJS, Express, etc.) and architectural pattern (MVC, Hexagonal, etc.).
- **Code Logic**: Read the relevant files (Controllers, Services, Routes) using `view_file` or `grep_search`.
- **Database Logic**: Read schema files (Prisma, TypeORM entities, SQL migrations) to understand relationships and indexing.

### 2. Scoring & Evaluation
Evaluate the current implementation based on:
- **Performance**: N+1 queries, efficient indexing, caching potential.
- **Maintainability**: Code clarity, modularity, DRY principles.
- **Security**: Auth checks, input validation, SQL injection risks.
- **Scalability**: capability to handle growth.

### 3. Output & Persistence
- **Answer User Questions**: If the user asked a specific question, address it directly in the report BEFORE the main analysis.
- **Save Report**: You MUST save the generated key findings and report to `docs/analyze/backend/[report_name].md`.
  - `[report_name]` should be `kebab-case` descriptive of the feature analyzed (e.g., `product-category-variants.md`).
  - Use `write_to_file` to save the report.

### 4. Reporting Format
Generate a report in the following format:

# [Component/Feature Name] Analysis Report

## 1. Q&A (If applicable)
*(If the user asked a specific question, answer it here directly and concisely. If no specific question was asked, you can omit this section.)*

## 2. Analysis Overview

*(Brief summary of what was analyzed)*

## 3. Value - Score
| Metric | Score (1-10) | Notes |
| :--- | :--- | :--- |
| **Performance** | [X]/100 | [Reasoning] |
| **Security** | [X]/100 | [Reasoning] |
| **Maintainability** | [X]/100 | [Reasoning] |
| **Overall Quality** | **[X]/100** | **[Summary]** |

## 4. Advice & Observations
*(Detailed observations about the code structure, logic flows, and potential bottlenecks)*

## 5. Recommendations
*(Specific, actionable steps to improve the code. Do not implement them, just list them.)*
- [ ] **Critical**: Fix potential crash in ...
- [ ] **Optimization**: Add index on column ...
- [ ] **Refactor**: Move logic from controller to service ...

## 6. Further Development
*(Ideas for future enhancements or features that could build upon this foundation)*
